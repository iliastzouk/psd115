/**
 * Λογικά namespaces προόδου ανά μάθημα (Phase 1E-4a).
 *
 * ΠΡΟΣΟΧΗ: είναι κλειδιά ΜΕΣΑ στο ένα αντικείμενο state του store (`study-progress-state-v1`), ΟΧΙ ξεχωριστά
 * κλειδιά localStorage. Το πραγματικό localStorage key του state δεν αλλάζει.
 *
 *   progress:wrongbook:<courseId>    { version: 1, entries: WrongEntry[] }
 *   progress:checklists:<courseId>   { version: 1, topics: { [topicId]: { items: boolean[] } } }
 *   progress:reset:<courseId>        { at: ISO 8601, reason?: string }
 *
 * Τα ιστορικά artifacts του migration (baseline, σημάδι, shadow) κρατούν τα δικά τους κλειδιά (keys.js).
 */
import { isCourseId } from '../academic/ids.js'

/** @param {'wrongbook' | 'checklists' | 'reset'} kind @param {string} courseId */
function progressStateKey(kind, courseId) {
  if (!isCourseId(courseId)) throw new Error(`Άκυρο courseId: ${JSON.stringify(courseId)}`)
  return `progress:${kind}:${courseId}`
}

export const wrongBookStateKey = (courseId) => progressStateKey('wrongbook', courseId)
export const checklistsStateKey = (courseId) => progressStateKey('checklists', courseId)
export const resetStateKey = (courseId) => progressStateKey('reset', courseId)

export const WRONG_BOOK_STATE_VERSION = 1
export const CHECKLISTS_STATE_VERSION = 1
