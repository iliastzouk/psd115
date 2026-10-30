/**
 * Async API του store με τα όρια migration (Phase 0B–1E-4c-2). Το χρησιμοποιεί ΜΟΝΟ ο legacy κώδικας (migration, shadow)
 * και τα tests του, μέχρι να αφαιρεθεί στο 6b· η εφαρμογή (Φάση 6a) χρησιμοποιεί απευθείας τον πυρήνα του
 * progressStore.js, που δεν ξέρει τίποτα για migration.
 */
import { boundaryViolations, importBoundary, migrationBoundary } from './boundary.js'
import { createStoreCore, ProgressStoreError } from './progressStore.js'

export { EVENTS_KEY, STATE_KEY, EXPORT_FORMAT, EXPORT_VERSION, ProgressStoreError } from './progressStore.js'

const QUERY_FIELDS = new Set(['item', 'kind', 'ctx', 'session', 'from', 'to'])
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** Όριο migration (1E-3) στο commit, με το state όπως θα είναι μετά. */
function extraViolations(events, nextState) {
  let boundary
  try {
    boundary = migrationBoundary(nextState)
  } catch (e) {
    throw new ProgressStoreError(e.message)
  }
  return boundaryViolations(events, boundary)
}

/** Όριο migration στο importAll: ίδιο σημάδι στις δύο πλευρές, κανένα event πριν από αυτό. */
function importCheck(currentState, data) {
  const { boundary, error } = importBoundary(currentState, data.state)
  if (error) throw new ProgressStoreError('Σύγκρουση σημαδιού migration· δεν εισήχθη τίποτα', [error])
  const late = boundaryViolations(data.events, boundary)
  if (late.length) throw new ProgressStoreError('Events πριν από το όριο migration· δεν εισήχθη τίποτα', late)
}

/**
 * @param {{ storage?: Storage, now?: () => number }} [opts]
 *   storage: αντικείμενο με getItem/setItem/removeItem (localStorage ή fake στα tests).
 */
export function createProgressStore({ storage, now = () => Date.now() } = {}) {
  const core = createStoreCore(storage ?? globalThis.localStorage, { now, extraViolations, importCheck })

  return {
    /**
     * Προσθέτει ένα event στο τέλος του log. Απορρίπτει άκυρα events και ids που υπάρχουν ήδη.
     * @param {import('./events.js').ProgressEvent} event
     */
    async append(event) {
      core.commitSync({ events: [event] })
      return { ...event }
    },

    /** Async περιτύλιγμα του `commitSync` (ίδια επικύρωση, ίδια εγγραφή). */
    async commit(change) {
      return core.commitSync(change)
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
      return core.readEvents().filter(
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
      const state = core.readState()
      return key in state ? structuredClone(state[key]) : undefined
    },

    /** @param {string} key @param {unknown} value JSON τιμή· `undefined` αφαιρεί το κλειδί */
    async setState(key, value) {
      if (typeof key !== 'string' || !key) throw new ProgressStoreError('Άκυρο κλειδί state')
      if (value !== undefined && JSON.stringify(value) === undefined) {
        throw new ProgressStoreError(`Η τιμή του «${key}» δεν αποθηκεύεται ως JSON`)
      }
      core.commitSync({ state: { [key]: value } })
    },

    async exportAll() {
      return core.exportSync()
    },

    /**
     * Εισάγει export ως ένωση: νέα events μπαίνουν στο τέλος, ίδια (ίδιο id + ίδιο περιεχόμενο)
     * παραλείπονται, ίδιο id με διαφορετικό περιεχόμενο → απόρριψη ΟΛΗΣ της εισαγωγής.
     * Τα κλειδιά state του αρχείου γράφονται· τα υπόλοιπα μένουν. Όλα ή τίποτα.
     * (Το import της εφαρμογής, Φάση 6a, γίνεται με προεπισκόπηση στο studyProgressBackup.)
     */
    async importAll(data) {
      return core.importAllSync(data)
    },
  }
}

let defaultStore = null
/** Το store της εφαρμογής (localStorage). Δημιουργείται μόνο όταν ζητηθεί. */
export function getProgressStore() {
  defaultStore ??= createProgressStore()
  return defaultStore
}
