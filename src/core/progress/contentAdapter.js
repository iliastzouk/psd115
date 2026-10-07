/**
 * Content adapter της προόδου (Phase 1E-4a): η ΜΟΝΗ εξάρτηση του snapshot engine από περιεχόμενο μαθήματος.
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
 *   legacy?: LegacyCodec,                            // μόνο για μάθημα με παλιά (legacy) αποθήκευση
 * }} ContentAdapter
 *
 * Legacy codec: η διάταξη των παλιών κλειδιών αποθήκευσης ενός μαθήματος. Μόνο μετατροπή κλειδιών/JSON —
 * ο έλεγχος περιεχομένου (counts, κάρτες, ερωτήσεις, topics) γίνεται στον engine.
 *
 * @typedef {{
 *   decode: (entries: Record<string, string>) => {
 *     study: unknown,                                // parsed αντικείμενο προόδου μελέτης· undefined αν δεν υπάρχει
 *     checklists: { key: string, topicId: string | null, items: unknown }[],  // topicId null = άγνωστο θέμα
 *     settings: string[],                            // κλειδιά ρυθμίσεων (όχι πρόοδος μάθησης)
 *     unknown: string[],                             // κλειδιά που δεν είναι γνωστή πρόοδος (δεν διαβάζονται, δεν αγγίζονται)
 *     errors: string[],                              // δομικά σφάλματα (π.χ. μη έγκυρο JSON)
 *   },
 *   encode: (input: { study: object, checklists: Record<string, boolean[]> },
 *            opts?: { previous?: Record<string, string> }) => {  // previous: τρέχουσες raw τιμές (διατήρηση orphan)
 *     entries: Record<string, string>,
 *     unprojected: string[],                         // topicIds χωρίς legacy κλειδί (π.χ. orphan)
 *   },
 * }} LegacyCodec
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
  if (adapter.legacy !== undefined && (typeof adapter.legacy?.decode !== 'function' || typeof adapter.legacy?.encode !== 'function')) {
    errors.push('content adapter: το legacy χρειάζεται decode() και encode()')
  }
  return errors
}

/**
 * Adapter για μάθημα χωρίς γνωστό περιεχόμενο: δεν επινοεί τίποτα (καμία ομάδα, ερώτηση, κάρτα ή θέμα)
 * και δεν έχει legacy αποθήκευση. Τα events του μετριούνται, απλώς χωρίς ομαδοποίηση.
 * @param {string} courseId
 * @returns {ContentAdapter}
 */
export function unknownCourseAdapter(courseId) {
  if (!isCourseId(courseId)) throw new Error(`Άκυρο courseId: ${JSON.stringify(courseId)}`)
  const no = () => false
  return Object.freeze({ courseId, hasGroup: no, groupOf: () => null, isQuestion: no, isCard: no, hasTopic: no })
}
