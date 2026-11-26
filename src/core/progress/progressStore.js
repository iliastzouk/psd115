/**
 * progressStore — υποδομή προόδου (Phase 0B· ενεργή πηγή της εφαρμογής από τη Φάση 6a, μέσω του storeProgressService).
 *
 * - events: append-only log (δες ./events.js). Ποτέ update/overwrite/delete.
 * - state: μικρές μεταβλητές τιμές που δεν είναι events (checklists, ρυθμίσεις…).
 * - Backend: localStorage, σε δικό του namespace (ΟΧΙ `psd115-*`).
 * - API σύγχρονο (createStoreCore)· βλ. το trade-off παρακάτω για μελλοντικό async backend.
 *
 * Παράγωγες τιμές (ακρίβεια, mastery, σύνολα…) δεν αποθηκεύονται ποτέ — υπολογίζονται από τα events.
 */
import { validateEvent } from './events.js'
import { resetViolations } from './resetBoundary.js'
import { ProgressTransactionError, runTransaction, TXN_KEY } from './transaction.js'

export const EVENTS_KEY = 'study-progress-events-v1'
export const STATE_KEY = 'study-progress-state-v1'
export const EXPORT_FORMAT = 'study-progress'
export const EXPORT_VERSION = 1

export class ProgressStoreError extends Error {
  /**
   * @param {string} message @param {string[]} [details]
   * @param {'not-started' | 'rolled-back' | 'rollback-incomplete'} [outcome] μόνο για αποτυχίες εγγραφής (1E-4c-2)
   */
  constructor(message, details = [], outcome) {
    super(details.length ? `${message}: ${details.slice(0, 5).join('; ')}` : message)
    this.name = 'ProgressStoreError'
    this.details = details
    if (outcome) this.outcome = outcome
  }
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * Σύγχρονος πυρήνας του store (Φάση 6a, J2): ΜΙΑ υλοποίηση ανάγνωσης, επικύρωσης και εγγραφής. Τον χρησιμοποιούν ο
 * ProgressService (σύγχρονη ανάγνωση πριν από το πρώτο render) και το studyProgressBackup (export, reset).
 *
 * Trade-off: η εφαρμογή εξαρτάται πλέον από σύγχρονο storage (localStorage). Μετάβαση σε IndexedDB θα χρειαστεί async
 * εκκίνηση με κατάσταση «φόρτωση», όχι απλή αλλαγή backend.
 * Ο μόνος έλεγχος ορίου είναι το reset ανά μάθημα (resetBoundary.js).
 * @param {Storage} storage
 * @param {{ now?: () => number }} [opts]
 */
export function createStoreCore(storage, { now = () => Date.now() } = {}) {
  const store = storage
  if (!store) throw new ProgressStoreError('Δεν υπάρχει διαθέσιμο storage')

  // Κάθε ανάγνωση γίνεται από το storage (όχι cache στη μνήμη), ώστε ένα άλλο tab να μη
  // γράφεται από πάνω με παλιά δεδομένα. Κατεστραμμένα δεδομένα ΔΕΝ αντικαθίστανται σιωπηλά.
  function parseEvents(raw) {
    if (raw === null) return []
    let arr
    try {
      arr = JSON.parse(raw)
    } catch {
      throw new ProgressStoreError(`Το «${EVENTS_KEY}» δεν είναι έγκυρο JSON· δεν γράφτηκε τίποτα`)
    }
    if (!Array.isArray(arr)) throw new ProgressStoreError(`Το «${EVENTS_KEY}» δεν είναι πίνακας· δεν γράφτηκε τίποτα`)
    return arr
  }

  function parseState(raw) {
    if (raw === null) return {}
    let obj
    try {
      obj = JSON.parse(raw)
    } catch {
      throw new ProgressStoreError(`Το «${STATE_KEY}» δεν είναι έγκυρο JSON· δεν γράφτηκε τίποτα`)
    }
    if (!isPlainObject(obj)) throw new ProgressStoreError(`Το «${STATE_KEY}» δεν είναι αντικείμενο· δεν γράφτηκε τίποτα`)
    return obj
  }

  const readEvents = () => parseEvents(store.getItem(EVENTS_KEY))
  const readState = () => parseState(store.getItem(STATE_KEY))

  /**
   * Γράφει events και/ή state. Το localStorage δεν έχει συναλλαγές· η εγγύηση είναι της εφαρμογής:
   *  - ΕΝΑ κλειδί: ένα setItem (είτε γράφεται είτε μένει η παλιά τιμή) → αποτυχία = `not-started`.
   *  - ΔΥΟ κλειδιά (commit events + state): μέσω runTransaction (σημάδι → εγγραφή → επαλήθευση → rollback με
   *    επαλήθευση). Αν και το rollback δεν ολοκληρωθεί, το σφάλμα λέει ρητά `rollback-incomplete` (ΟΧΙ «δεν άλλαξε τίποτα»)
   *    και το σημάδι μένει: το recoverInterrupted της εκκίνησης ολοκληρώνει ή επαναφέρει.
   *  - Όσο υπάρχει σημάδι μη ολοκληρωμένης αλλαγής, ΚΑΜΙΑ εγγραφή του store (η ανάκτηση θα έσβηνε ό,τι γραφτεί ενδιάμεσα).
   */
  function writeAtomic(nextEvents, nextState) {
    if (store.getItem(TXN_KEY) !== null) {
      throw new ProgressStoreError('Υπάρχει μη ολοκληρωμένη προηγούμενη αλλαγή (ανάκτηση στην επόμενη εκκίνηση)· δεν άλλαξε τίποτα', [], 'not-started')
    }
    const targets = {}
    if (nextEvents) targets[EVENTS_KEY] = JSON.stringify(nextEvents)
    if (nextState) targets[STATE_KEY] = JSON.stringify(nextState)
    const keys = Object.keys(targets)
    if (keys.length === 1) {
      try {
        store.setItem(keys[0], targets[keys[0]])
      } catch (err) {
        const e = new ProgressStoreError(`Η αποθήκευση απέτυχε (${err?.name ?? 'error'})· δεν άλλαξε τίποτα`, [], 'not-started')
        e.cause = err
        throw e
      }
      return
    }
    try {
      runTransaction(store, { op: 'progress-store', targets, now })
    } catch (err) {
      if (err instanceof ProgressTransactionError) throw new ProgressStoreError(err.message, [], err.outcome)
      throw err
    }
  }

  function checkEvent(ev) {
    const r = validateEvent(ev)
    if (!r.ok) throw new ProgressStoreError('Άκυρο event', r.errors)
  }

  /**
   * Ατομική εγγραφή events ΚΑΙ state: είτε γράφονται όλα, είτε τίποτα. Για κάθε event: schema, μοναδικό id στο log και
   * στο batch, όριο reset ανά μάθημα. `state`: patch ανά κλειδί (`undefined` = αφαίρεση· τα άλλα κλειδιά μένουν).
   * @param {{ events?: import('./events.js').ProgressEvent[], state?: Record<string, unknown> }} change
   */
  function commitSync({ events = [], state = {} } = {}) {
    if (!Array.isArray(events)) throw new ProgressStoreError('commit: τα events πρέπει να είναι πίνακας')
    if (!isPlainObject(state)) throw new ProgressStoreError('commit: το state πρέπει να είναι αντικείμενο')
    for (const ev of events) checkEvent(ev)
    const ids = new Set()
    for (const ev of events) {
      if (ids.has(ev.id)) throw new ProgressStoreError(`Διπλό id ${ev.id} μέσα στο ίδιο commit· δεν γράφτηκε τίποτα`)
      ids.add(ev.id)
    }
    const current = events.length ? readEvents() : null
    const clash = current?.find((e) => ids.has(e.id))
    if (clash) throw new ProgressStoreError(`Υπάρχει ήδη event με id ${clash.id}· τα events δεν αντικαθίστανται`)

    const currentState = readState()
    const nextState = { ...currentState }
    for (const [key, value] of Object.entries(state)) {
      if (!key) throw new ProgressStoreError('Άκυρο κλειδί state')
      if (value === undefined) delete nextState[key]
      else {
        const json = JSON.stringify(value)
        if (json === undefined) throw new ProgressStoreError(`Η τιμή του «${key}» δεν αποθηκεύεται ως JSON`)
        nextState[key] = JSON.parse(json)
      }
    }
    // Όριο reset ανά μάθημα, με το state μετά το commit (ένα reset στο ίδιο commit ισχύει για τα events του).
    const late = resetViolations(events, nextState)
    if (late.length) {
      const e = new ProgressStoreError('Event πριν από το όριο reset του μαθήματος· δεν γράφτηκε τίποτα', late)
      e.code = 'boundary'
      throw e
    }

    writeAtomic(events.length ? [...current, ...events.map((e) => ({ ...e }))] : null, Object.keys(state).length ? nextState : null)
    return { events: events.length, stateKeys: Object.keys(state).length }
  }

  return Object.freeze({
    /** Οι raw τιμές των δύο κλειδιών (null = απόν). Μόνο ανάγνωση. */
    readRaw: () => ({ events: store.getItem(EVENTS_KEY), state: store.getItem(STATE_KEY) }),
    /** Parse των δύο κλειδιών (απόν = κενό). Άκυρο JSON / λάθος τύπος → ProgressStoreError. Μόνο ανάγνωση. */
    readSync: () => ({ events: readEvents(), state: readState() }),
    /** Parse από ήδη διαβασμένες raw τιμές (ίδιοι κανόνες με το readSync). */
    parseRaw: (raw) => ({ events: parseEvents(raw.events), state: parseState(raw.state) }),
    /** Υπάρχει σημάδι μη ολοκληρωμένης συναλλαγής (εκκρεμές ή κατεστραμμένο); Αν το storage πετάξει, πετάει. */
    pending: () => store.getItem(TXN_KEY) !== null,
    readState,
    commitSync,
    exportSync: () => ({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date(now()).toISOString(),
      events: readEvents(),
      state: readState(),
    }),
  })
}
