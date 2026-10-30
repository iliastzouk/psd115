/**
 * Σχήμα του Snapshot προόδου ενός μαθήματος (v1) — κοινό για την ενεργή υποδομή (courseProgress) και τον legacy κώδικα.
 *
 *   { format: 'progress-snapshot', version: 1, courseId, quizAnswered, quizCorrect, byGroup, flashcardSeenIds, wrongBook, checklists }
 */
export const SNAPSHOT_FORMAT = 'progress-snapshot'
export const SNAPSHOT_VERSION = 1

/** @param {string} courseId */
export function emptySnapshot(courseId) {
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    courseId,
    quizAnswered: 0,
    quizCorrect: 0,
    byGroup: {},
    flashcardSeenIds: [],
    wrongBook: [],
    checklists: {},
  }
}
