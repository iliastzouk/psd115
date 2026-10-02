/**
 * Canonical study scope (Phase 1D): από την επιλυμένη ταυτότητα διαδρομής (resolveLocation /
 * useRouteIdentity) στο υλικό μελέτης. Pure — καμία εξάρτηση από router ή διεύθυνση· η ταυτότητα
 * είναι η μόνη είσοδος.
 *
 *   identity → studyScope(identity) → selectStudyMaterial(scope) → STUDY_CONTENT (adapter) → content
 *
 * Scopes:
 *  - { kind: 'unit', courseId, unitId, source }   υλικό της unit
 *      source 'unit'  : σελίδα unit · 'tool': /study/<tool>?scope=unit:…
 *      source 'topic' : σελίδα θέματος → η unit που το περιέχει (ΟΧΙ topic-scoped υλικό)
 *  - { kind: 'course', courseId }                 επιλογή unit, χωρίς υλικό (όχι «όλο το μάθημα»)
 *  - { kind: 'unsupported', reason }              topic/term scope σε εργαλείο μελέτης
 *  - { kind: 'none' }                             διαδρομή χωρίς scope μελέτης
 */
import { STUDY_CONTENT } from './content.js'

/** Εργαλεία που φορτώνουν υλικό μελέτης (το /study/today είναι placeholder). */
export const MATERIAL_TOOLS = Object.freeze(['flashcards', 'quiz', 'exam', 'review'])

const NONE = Object.freeze({ kind: 'none' })

/** @param {{ kind: string, courseId?: string, unitId?: string, tool?: string, scope?: { kind: string } }} identity */
export function studyScope(identity) {
  switch (identity?.kind) {
    case 'unit':
      return { kind: 'unit', courseId: identity.courseId, unitId: identity.unitId, source: 'unit' }
    case 'topic':
      return { kind: 'unit', courseId: identity.courseId, unitId: identity.unitId, source: 'topic' }
    case 'study': {
      if (!MATERIAL_TOOLS.includes(identity.tool)) return NONE
      const s = identity.scope
      if (s?.kind === 'unit') return { kind: 'unit', courseId: s.courseId, unitId: s.unitId, source: 'tool' }
      if (s?.kind === 'course') return { kind: 'course', courseId: s.courseId }
      return { kind: 'unsupported', reason: s?.kind ?? 'scope' }
    }
    default:
      return NONE
  }
}

/** Σταθερό κλειδί ενός scope (για memo/reset). Το source δεν αλλάζει το υλικό, άρα δεν μπαίνει. */
export function studyScopeKey(scope) {
  if (scope?.kind === 'unit') return `unit:${scope.courseId}/${scope.unitId}`
  if (scope?.kind === 'course') return `course:${scope.courseId}`
  if (scope?.kind === 'unsupported') return `unsupported:${scope.reason}`
  return 'none'
}

export const EMPTY_MATERIAL = Object.freeze({
  categories: Object.freeze([]),
  flashcards: Object.freeze([]),
  quizQuestions: Object.freeze([]),
  examQuestions: Object.freeze([]),
})

const cache = new Map()

/**
 * Υλικό μελέτης ενός scope, με την ίδια σειρά που έχει το περιεχόμενο (πριν από shuffle).
 * Μόνο unit scope με περιεχόμενο έχει υλικό· όλα τα άλλα → EMPTY_MATERIAL (ποτέ fallback σε άλλη unit).
 * Το αποτέλεσμα είναι σταθερό ανά scope (ίδιο αντικείμενο), για ασφαλή χρήση σε React deps.
 */
export function selectStudyMaterial(scope) {
  if (scope?.kind !== 'unit') return EMPTY_MATERIAL
  const course = STUDY_CONTENT[scope.courseId]
  const unit = course?.units[scope.unitId]
  if (!unit) return EMPTY_MATERIAL
  const key = studyScopeKey(scope)
  if (!cache.has(key)) {
    const ids = new Set(unit.categories.map((c) => c.id))
    cache.set(
      key,
      Object.freeze({
        categories: unit.categories,
        flashcards: course.flashcards.filter((c) => ids.has(c.categoryId)),
        quizQuestions: course.quizQuestions.filter((q) => ids.has(q.categoryId)),
        examQuestions: unit.examQuestions(),
      }),
    )
  }
  return cache.get(key)
}
