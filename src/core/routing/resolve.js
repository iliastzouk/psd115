/**
 * Επίλυση canonical διεύθυνσης σε ταυτότητα (pure, χωρίς React/browser APIs).
 *
 * Κάθε ταυτότητα προκύπτει από ρητά δεδομένα (content catalog, academic registry). Ό,τι δεν υπάρχει
 * επιστρέφει `notFound` — ποτέ δεν αντιστοιχίζεται σιωπηλά σε άλλη οντότητα.
 *
 * `legacyKey`: το αντίστοιχο παλιό κλειδί διαδρομής (/week/N/...), μόνο για να διαβάσει το υπάρχον
 * περιεχόμενο/UI τα δεδομένα του (διαφάνειες, πλοήγηση, επιλογή εβδομάδας). Δεν είναι ταυτότητα.
 */
import { registry } from '../academic/data/index.js'
import { getContentCourse, getDoc, getTopic, getUnit } from './catalog.js'
import { legacyKeyForTool, legacyKeyForTopic, legacyKeyForUnit } from './legacy.js'
import { STUDY_TOOLS } from './paths.js'
import { parseScope } from './scope.js'

const courseExists = (courseId) => Boolean(getContentCourse(courseId)) || registry.courses.some((c) => c.id === courseId)
const termExists = (termId) => registry.terms.some((t) => t.id === termId)

/** Ύπαρξη της οντότητας στην οποία δείχνει ένα (συντακτικά έγκυρο) scope. */
export function scopeExists(scope) {
  switch (scope?.kind) {
    case 'course':
      return courseExists(scope.courseId)
    case 'unit':
      return Boolean(getUnit(scope.courseId, scope.unitId))
    case 'topic':
      return Boolean(getTopic(scope.courseId, scope.topicId))
    case 'term':
      return termExists(scope.termId)
    default:
      return false
  }
}

const NOT_FOUND = (extra = {}) => ({ kind: 'notFound', legacyKey: '', ...extra })

function resolveScope(search) {
  const raw = new URLSearchParams(search).get('scope')
  const scope = parseScope(raw)
  return scope && scopeExists(scope) ? scope : null
}

/**
 * @param {string} pathname
 * @param {string} [search]
 */
export function resolveLocation(pathname, search = '') {
  const seg = pathname.split('/').filter(Boolean)
  if (seg.length === 0) return { kind: 'home', legacyKey: '' }
  const [first, second, third] = seg

  if (first === 'week') return { kind: 'legacy', legacyKey: '' }

  if (first === 'terms') {
    return seg.length === 2 && termExists(second) ? { kind: 'term', termId: second, legacyKey: '' } : NOT_FOUND()
  }

  if (first === 'study') {
    if (seg.length !== 2 || !STUDY_TOOLS.includes(second)) return NOT_FOUND()
    const scope = resolveScope(search)
    if (!scope) return NOT_FOUND({ reason: 'scope' })
    const unitId = scope.kind === 'unit' ? scope.unitId : undefined
    const legacyKey = scope.kind === 'unit' ? legacyKeyForTool(scope.courseId, scope.unitId, second) ?? '' : ''
    return { kind: 'study', tool: second, scope, courseId: scope.courseId, unitId, legacyKey }
  }

  if (first === 'progress') {
    if (seg.length !== 1) return NOT_FOUND()
    const scope = resolveScope(search)
    return scope ? { kind: 'progress', scope, courseId: scope.courseId, unitId: scope.unitId, legacyKey: '' } : NOT_FOUND({ reason: 'scope' })
  }

  const courseId = first
  if (!courseExists(courseId)) return NOT_FOUND()
  if (seg.length === 1) return { kind: 'course', courseId, hasContent: Boolean(getContentCourse(courseId)), legacyKey: '' }
  if (seg.length !== 3) return NOT_FOUND({ courseId })

  if (second === 'units') {
    const unit = getUnit(courseId, third)
    return unit ? { kind: 'unit', courseId, unitId: unit.id, legacyKey: legacyKeyForUnit(courseId, unit.id) } : NOT_FOUND({ courseId })
  }
  if (second === 'topics') {
    const topic = getTopic(courseId, third)
    return topic
      ? { kind: 'topic', courseId, topicId: topic.id, unitId: topic.unit, legacySlug: topic.legacySlug, legacyKey: legacyKeyForTopic(courseId, topic) }
      : NOT_FOUND({ courseId })
  }
  if (second === 'docs') {
    const doc = getDoc(courseId, third)
    return doc ? { kind: 'doc', courseId, docId: doc.id, unitId: doc.unit, legacyKey: '' } : NOT_FOUND({ courseId })
  }
  return NOT_FOUND({ courseId })
}
