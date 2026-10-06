/**
 * Όριο migration (Phase 1E-3): μετά το σημάδι `migration:psd115-v1`, κάθε event πρέπει να έχει
 * `t >= Date.parse(marker.at)`. Event με `t < at` θα «χωρούσε» στο παρελθόν που ήδη αντιπροσωπεύει το
 * frozen baseline → απορρίπτεται. Το όριο είναι κλειστό: `t === at` γίνεται δεκτό.
 *
 * Ελέγχεται από ΚΑΘΕ δρόμο εγγραφής events: progressStore.append / importAll, import αρχείου v2
 * (progressBackup) και έλεγχο αρχείου (progressValidate). Χωρίς σημάδι δεν υπάρχει όριο — αλλά τότε
 * το αρχικό migration απαιτεί άδειο log (1E-2), οπότε κανένα event δεν προηγείται του baseline.
 */
import { MIGRATION_MARKER_KEY } from './keys.js'

/** @returns {number | null} ms του ορίου, ή null αν δεν υπάρχει (έγκυρο) σημάδι */
export function migrationBoundary(state) {
  const at = state && typeof state === 'object' ? state[MIGRATION_MARKER_KEY]?.at : undefined
  if (at === undefined) return null
  const ms = typeof at === 'string' ? Date.parse(at) : NaN
  if (!Number.isFinite(ms)) throw new Error(`άκυρο σημάδι migration (at: ${JSON.stringify(at)})`)
  return ms
}

/** Μηνύματα για events που παραβιάζουν το όριο (κενό = όλα εντάξει). */
export function boundaryViolations(events, boundary) {
  if (boundary === null) return []
  return events.filter((e) => e.t < boundary).map((e) => `το event ${e.id} (t=${e.t}) είναι πριν από το όριο migration (${boundary})`)
}

/**
 * Όριο για εισαγωγή: το σημάδι του αρχείου και το τρέχον πρέπει να συμφωνούν αν υπάρχουν και τα δύο.
 * @returns {{ boundary: number | null, error?: string }}
 */
export function importBoundary(currentState, incomingState) {
  const cur = currentState?.[MIGRATION_MARKER_KEY]
  const inc = incomingState?.[MIGRATION_MARKER_KEY]
  if (cur && inc && (cur.at !== inc.at || cur.sourceHash !== inc.sourceHash)) {
    return { boundary: null, error: 'το αρχείο έχει διαφορετικό σημάδι migration από το τρέχον' }
  }
  return { boundary: migrationBoundary(cur ? currentState : incomingState) }
}
