/**
 * Όριο reset ανά μάθημα (Phase 1E-4c-2· ο μόνος έλεγχος ορίου της ενεργής υποδομής από τη Φάση 6a).
 * Ανεξάρτητο από τον μηχανισμό migration (boundary.js), που μένει μόνο για τον legacy κώδικα μέχρι το 6b.
 */
import { resetStateKey } from './namespaces.js'
import { parseGlobalId } from '../academic/ids.js'

/**
 * Όριο reset (Phase 1E-4c-2): event ενός μαθήματος με `t` πριν από το reset ΤΟΥ ΜΑΘΗΜΑΤΟΣ (`progress:reset:<courseId>`)
 * απορρίπτεται κατά την εγγραφή — ο reader θα το αγνοούσε σιωπηλά. Events άλλων μαθημάτων δεν επηρεάζονται.
 * Δεν εφαρμόζεται στο import (επαναφορά backup με γνήσια παλαιότερα events).
 */
export function resetViolations(events, state) {
  const out = []
  for (const e of events) {
    const courseId = parseGlobalId(e.item)?.courseId
    const at = courseId ? state?.[resetStateKey(courseId)]?.at : undefined
    if (at === undefined) continue
    const ms = Date.parse(at)
    if (Number.isFinite(ms) && e.t < ms) out.push(`το event ${e.id} (t=${e.t}) είναι πριν από το reset του «${courseId}» (${at})`)
  }
  return out
}
