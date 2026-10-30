/**
 * Content adapter της προόδου: η ΜΟΝΗ εξάρτηση του engine (courseProgress) από περιεχόμενο μαθήματος.
 * Κάθε μάθημα δίνει το δικό του adapter με το ίδιο contract· ο engine δεν ξέρει ποια μαθήματα υπάρχουν.
 *
 * Όλα τα IDs εδώ είναι ΤΟΠΙΚΑ (localId του `<courseId>/<localId>`)· το global ID το χειρίζεται ο engine.
 *
 * @typedef {{
 *   courseId: string,
 *   hasGroup: (groupId: string) => boolean,
 *   groupOf: (questionId: string) => string | null,  // ομάδα στατιστικών μιας ερώτησης· null = άγνωστη (ποτέ επινοημένη)
 *   isQuestion: (localId: string) => boolean,
 *   isCard: (localId: string) => boolean,
 *   hasTopic: (topicId: string) => boolean,
 * }} ContentAdapter
 */
import { isCourseId } from '../academic/ids.js'

const FUNCTIONS = ['hasGroup', 'groupOf', 'isQuestion', 'isCard', 'hasTopic']

/** @returns {string[]} σφάλματα (κενό = έγκυρο contract) */
export function checkContentAdapter(adapter, courseId) {
  if (adapter === null || typeof adapter !== 'object') return ['content adapter: αναμενόταν αντικείμενο']
  const errors = []
  if (!isCourseId(adapter.courseId)) errors.push('content adapter: άκυρο courseId')
  else if (courseId !== undefined && adapter.courseId !== courseId) {
    errors.push(`content adapter: είναι για «${adapter.courseId}», όχι για «${courseId}»`)
  }
  for (const f of FUNCTIONS) if (typeof adapter[f] !== 'function') errors.push(`content adapter: λείπει το ${f}()`)
  return errors
}

/**
 * Adapter για μάθημα χωρίς γνωστό περιεχόμενο: δεν επινοεί τίποτα (καμία ομάδα, ερώτηση, κάρτα ή θέμα).
 * @param {string} courseId
 * @returns {ContentAdapter}
 */
export function unknownCourseAdapter(courseId) {
  if (!isCourseId(courseId)) throw new Error(`Άκυρο courseId: ${JSON.stringify(courseId)}`)
  const no = () => false
  return Object.freeze({ courseId, hasGroup: no, groupOf: () => null, isQuestion: no, isCard: no, hasTopic: no })
}
