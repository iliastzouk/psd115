/**
 * Σύμβαση global IDs (κλειδωμένη στο Phase 1A):
 *
 *   <courseId>/<localId>      π.χ. psd115/q-w2-overview-1
 *
 * - courseId: σταθερό lowercase αναγνωριστικό μαθήματος (όχι κωδικός με κεφαλαία, όχι term/έτος).
 * - localId: το ΥΠΑΡΧΟΝ σταθερό ID του περιεχομένου, αυτούσιο. Το global ID είναι απλώς namespace
 *   γύρω του — τα υπάρχοντα IDs ερωτήσεων/καρτών δεν μετονομάζονται ποτέ.
 * - Ίδιο global ID σε κάθε έκδοση/term του μαθήματος.
 */

export const COURSE_ID_RE = /^[a-z][a-z0-9-]*$/
export const LOCAL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export const isCourseId = (v) => typeof v === 'string' && COURSE_ID_RE.test(v)
export const isLocalId = (v) => typeof v === 'string' && LOCAL_ID_RE.test(v)

/** @returns {string} `${courseId}/${localId}` — πετάει σφάλμα αν κάποιο μέρος είναι άκυρο. */
export function toGlobalId(courseId, localId) {
  if (!isCourseId(courseId)) throw new Error(`Άκυρο courseId: ${JSON.stringify(courseId)}`)
  if (!isLocalId(localId)) throw new Error(`Άκυρο localId: ${JSON.stringify(localId)}`)
  return `${courseId}/${localId}`
}

/** @returns {{ courseId: string, localId: string } | null} */
export function parseGlobalId(globalId) {
  if (typeof globalId !== 'string') return null
  const i = globalId.indexOf('/')
  if (i < 0) return null
  const courseId = globalId.slice(0, i)
  const localId = globalId.slice(i + 1)
  return isCourseId(courseId) && isLocalId(localId) ? { courseId, localId } : null
}

export const isGlobalId = (v) => parseGlobalId(v) !== null
