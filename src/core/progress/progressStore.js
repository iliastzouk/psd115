/**
 * progressStore — νέα υποδομή προόδου (Phase 0B). ΠΑΡΑΛΛΗΛΗ με το υπάρχον `utils/storage.js`,
 * ΔΕΝ το αντικαθιστά: η εφαρμογή δεν τη χρησιμοποιεί ακόμα.
 *
 * - events: append-only log (δες ./events.js). Ποτέ update/overwrite/delete.
 * - state: μικρές μεταβλητές τιμές που δεν είναι events (checklists, ρυθμίσεις…).
 * - Backend: localStorage, σε δικό του namespace (ΟΧΙ `psd115-*`).
 * - API async ώστε αργότερα να αλλάξει backend (IndexedDB / server) χωρίς αλλαγές στους καλούντες.
 *
 * Παράγωγες τιμές (ακρίβεια, mastery, σύνολα…) δεν αποθηκεύονται ποτέ — υπολογίζονται από τα events.
 */
import { sameEvent, validateEvent } from './events.js'
import { boundaryViolations, importBoundary, migrationBoundary } from './boundary.js'

export const EVENTS_KEY = 'study-progress-events-v1'
export const STATE_KEY = 'study-progress-state-v1'
export const EXPORT_FORMAT = 'study-progress'
export const EXPORT_VERSION = 1

const QUERY_FIELDS = new Set(['item', 'kind', 'ctx', 'session', 'from', 'to'])

export class ProgressStoreError extends Error {
  /** @param {string} message @param {string[]} [details] */
  constructor(message, details = []) {
    super(details.length ? `${message}: ${details.slice(0, 5).join('; ')}` : message)
    this.name = 'ProgressStoreError'
    this.details = details
  }
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * @param {{ storage?: Storage, now?: () => number }} [opts]
 *   storage: αντικείμενο με getItem/setItem/removeItem (localStorage ή fake στα tests).
 */
export function createProgressStore({ storage, now = () => Date.now() } = {}) {
  const store = storage ?? globalThis.localStorage
  if (!store) throw new ProgressStoreError('Δεν υπάρχει διαθέσιμο storage')

  // Κάθε ανάγνωση γίνεται από το storage (όχι cache στη μνήμη), ώστε ένα άλλο tab να μη
  // γράφεται από πάνω με παλιά δεδομένα. Κατεστραμμένα δεδομένα ΔΕΝ αντικαθίστανται σιωπηλά.
  function readEvents() {
    const raw = store.getItem(EVENTS_KEY)
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

  function readState() {
    const raw = store.getItem(STATE_KEY)
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

  /** Γράφει events και/ή state· αν αποτύχει η δεύτερη εγγραφή, επαναφέρει την πρώτη (ατομικότητα). */
  function writeAtomic(nextEvents, nextState) {
    const prevEvents = store.getItem(EVENTS_KEY)
    const prevState = store.getItem(STATE_KEY)
    try {
      if (nextEvents) store.setItem(EVENTS_KEY, JSON.stringify(nextEvents))
      if (nextState) store.setItem(STATE_KEY, JSON.stringify(nextState))
    } catch (err) {
      for (const [key, prev] of [
        [EVENTS_KEY, prevEvents],
        [STATE_KEY, prevState],
      ]) {
        try {
          if (prev === null) store.removeItem(key)
          else store.setItem(key, prev)
        } catch {
          /* best effort */
        }
      }
      throw new ProgressStoreError(`Η αποθήκευση απέτυχε (${err?.name ?? 'error'})· δεν άλλαξε τίποτα`)
    }
  }

  function boundaryOf(state) {
    try {
      return migrationBoundary(state)
    } catch (e) {
      throw new ProgressStoreError(e.message)
    }
  }

  function checkEvent(ev) {
    const r = validateEvent(ev)
    if (!r.ok) throw new ProgressStoreError('Άκυρο event', r.errors)
  }

  return {
    /**
     * Προσθέτει ένα event στο τέλος του log. Απορρίπτει άκυρα events και ids που υπάρχουν ήδη.
     * @param {import('./events.js').ProgressEvent} event
     */
    async append(event) {
      checkEvent(event)
      const events = readEvents()
      if (events.some((e) => e.id === event.id)) {
        throw new ProgressStoreError(`Υπάρχει ήδη event με id ${event.id}· τα events δεν αντικαθίστανται`)
      }
      // Όριο migration (1E-3): μετά το σημάδι, κανένα event πριν από το `marker.at`.
      const late = boundaryViolations([event], boundaryOf(readState()))
      if (late.length) throw new ProgressStoreError('Event πριν από το όριο migration· δεν γράφτηκε', late)
      writeAtomic([...events, { ...event }], null)
      return { ...event }
    },

    /**
     * Events με τη σειρά εισαγωγής. Φίλτρα (όλα προαιρετικά, συνδυάζονται με AND):
     * item, kind, ctx, session, from (t >= from), to (t < to).
     * Επιστρέφει αντίγραφα — τα αποθηκευμένα events δεν μπορούν να αλλάξουν μέσω του αποτελέσματος.
     */
    async query(filter = {}) {
      if (!isPlainObject(filter)) throw new ProgressStoreError('Το φίλτρο πρέπει να είναι αντικείμενο')
      for (const k of Object.keys(filter)) {
        if (!QUERY_FIELDS.has(k)) throw new ProgressStoreError(`Άγνωστο φίλτρο «${k}»`)
      }
      const { item, kind, ctx, session, from, to } = filter
      return readEvents().filter(
        (e) =>
          (item === undefined || e.item === item) &&
          (kind === undefined || e.kind === kind) &&
          (ctx === undefined || e.ctx === ctx) &&
          (session === undefined || e.session === session) &&
          (from === undefined || e.t >= from) &&
          (to === undefined || e.t < to),
      )
    },

    /** @param {string} key @returns {Promise<unknown>} αντίγραφο της τιμής ή undefined */
    async getState(key) {
      if (typeof key !== 'string' || !key) throw new ProgressStoreError('Άκυρο κλειδί state')
      const state = readState()
      return key in state ? structuredClone(state[key]) : undefined
    },

    /** @param {string} key @param {unknown} value JSON τιμή· `undefined` αφαιρεί το κλειδί */
    async setState(key, value) {
      if (typeof key !== 'string' || !key) throw new ProgressStoreError('Άκυρο κλειδί state')
      const state = readState()
      if (value === undefined) delete state[key]
      else {
        const json = JSON.stringify(value)
        if (json === undefined) throw new ProgressStoreError(`Η τιμή του «${key}» δεν αποθηκεύεται ως JSON`)
        state[key] = JSON.parse(json)
      }
      writeAtomic(null, state)
    },

    async exportAll() {
      return {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: new Date(now()).toISOString(),
        events: readEvents(),
        state: readState(),
      }
    },

    /**
     * Εισάγει export ως ένωση: νέα events μπαίνουν στο τέλος, ίδια (ίδιο id + ίδιο περιεχόμενο)
     * παραλείπονται, ίδιο id με διαφορετικό περιεχόμενο → απόρριψη ΟΛΗΣ της εισαγωγής.
     * Τα κλειδιά state του αρχείου γράφονται· τα υπόλοιπα μένουν. Όλα ή τίποτα.
     */
    async importAll(data) {
      const errors = []
      if (!isPlainObject(data)) throw new ProgressStoreError('Το αρχείο δεν είναι αντικείμενο')
      if (data.format !== EXPORT_FORMAT) errors.push(`άγνωστο format ${JSON.stringify(data.format)}`)
      if (data.version !== EXPORT_VERSION) errors.push(`μη υποστηριζόμενη έκδοση ${JSON.stringify(data.version)}`)
      if (!Array.isArray(data.events)) errors.push('λείπει ο πίνακας events')
      if (!isPlainObject(data.state)) errors.push('λείπει το αντικείμενο state')
      if (errors.length) throw new ProgressStoreError('Μη συμβατό αρχείο', errors)

      const seen = new Set()
      data.events.forEach((ev, i) => {
        const r = validateEvent(ev)
        if (!r.ok) errors.push(`events[${i}]: ${r.errors.join(', ')}`)
        else if (seen.has(ev.id)) errors.push(`events[${i}]: διπλό id ${ev.id} μέσα στο αρχείο`)
        seen.add(ev?.id)
      })
      if (errors.length) throw new ProgressStoreError('Άκυρα events· δεν εισήχθη τίποτα', errors)

      const currentState = readState()
      const { boundary, error } = importBoundary(currentState, data.state)
      if (error) throw new ProgressStoreError('Σύγκρουση σημαδιού migration· δεν εισήχθη τίποτα', [error])
      const late = boundaryViolations(data.events, boundary)
      if (late.length) throw new ProgressStoreError('Events πριν από το όριο migration· δεν εισήχθη τίποτα', late)

      const current = readEvents()
      const byId = new Map(current.map((e) => [e.id, e]))
      const added = []
      let skipped = 0
      for (const ev of data.events) {
        const existing = byId.get(ev.id)
        if (!existing) added.push({ ...ev })
        else if (sameEvent(existing, ev)) skipped += 1
        else errors.push(`το id ${ev.id} υπάρχει ήδη με διαφορετικό περιεχόμενο`)
      }
      if (errors.length) throw new ProgressStoreError('Σύγκρουση με υπάρχοντα events· δεν εισήχθη τίποτα', errors)

      const state = { ...currentState, ...JSON.parse(JSON.stringify(data.state)) }
      writeAtomic([...current, ...added], state)
      return { added: added.length, skipped, stateKeys: Object.keys(data.state).length }
    },
  }
}

let defaultStore = null
/** Το store της εφαρμογής (localStorage). Δημιουργείται μόνο όταν ζητηθεί. */
export function getProgressStore() {
  defaultStore ??= createProgressStore()
  return defaultStore
}
