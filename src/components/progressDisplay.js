/**
 * Τιμές εμφάνισης της μπάρας «Πρόοδος» ανά scope (Φάση 4). Καθαρός υπολογισμός πάνω στο snapshot· ΤΙΠΟΤΑ δεν αλλάζει στο
 * storage (orphan κάρτες κ.λπ. κρατιούνται εκεί, απλώς δεν μετρούν εδώ).
 *
 *  - Κάρτες (H2): αριθμητής ΚΑΙ παρονομαστής από την πραγματική λίστα καρτών του scope → μόνο υπαρκτές κάρτες του scope,
 *    X ≤ Y πάντα.
 *  - Κουίζ σε ενότητα (H3): άθροισμα correct/wrong των ομάδων της ενότητας (byGroup).
 *  - Κουίζ σε ολόκληρο το μάθημα (H4): οι υπάρχοντες συνολικοί μετρητές quizCorrect/quizAnswered — ΟΧΙ το άθροισμα του
 *    byGroup, που σε ιστορικά δεδομένα μπορεί να διαφέρει.
 */
import { progressItem } from '../core/progress/items.js'
import { STUDY_CONTENT } from '../core/study/content.js'

/** Οι έγκυρες κάρτες/ομάδες ενός μαθήματος, από το περιεχόμενο (STUDY_CONTENT). */
function courseContent(courseId) {
  const c = STUDY_CONTENT[courseId]
  if (!c) throw new Error(`progressScope: άγνωστο μάθημα «${courseId}»`)
  const groups = Object.values(c.units).flatMap((u) => u.categories.map((g) => g.id))
  return { c, cards: new Set(c.flashcards.map((f) => f.id)), groups: new Set(groups) }
}

/** Όλες οι κατηγορίες ενός μαθήματος (STUDY_CONTENT)· άγνωστο μάθημα → σφάλμα. */
export function courseCategories(courseId) {
  return courseContent(courseId).c.categories
}

/**
 * Το scope της μπάρας «Πρόοδος» από έγκυρα IDs (Φάση 4, review #16): οι λίστες καρτών/ομάδων τις ορίζει το περιεχόμενο,
 * όχι ο caller. Χωρίς `unitId` → ολόκληρο το μάθημα. Άγνωστο μάθημα ή ενότητα → σφάλμα.
 * @param {string} courseId @param {string} [unitId]
 */
export function progressScopeFor(courseId, unitId) {
  const { c, groups } = courseContent(courseId)
  let groupIds = [...groups]
  if (unitId !== undefined) {
    const unit = c.units[unitId]
    if (!unit) throw new Error(`progressScope: άγνωστη ενότητα «${unitId}» του «${courseId}»`)
    groupIds = unit.categories.map((g) => g.id)
  }
  const inScope = new Set(groupIds)
  return Object.freeze({
    kind: unitId === undefined ? 'course' : 'unit',
    courseId,
    cardIds: Object.freeze(c.flashcards.filter((f) => inScope.has(f.categoryId)).map((f) => f.id)),
    groupIds: Object.freeze(groupIds),
  })
}

/** Το scope πρέπει να ταιριάζει με το περιεχόμενο του μαθήματος· αλλιώς σφάλμα (όχι παραπλανητική μέτρηση). */
function assertScope({ kind, courseId, cardIds, groupIds }) {
  if (kind !== 'unit' && kind !== 'course') throw new Error(`progressScope: άγνωστο kind «${kind}»`)
  const { cards, groups } = courseContent(courseId)
  const badCard = cardIds.find((id) => !cards.has(id))
  if (badCard !== undefined) throw new Error(`progressScope: η κάρτα «${badCard}» δεν ανήκει στο «${courseId}»`)
  const badGroup = groupIds.find((id) => !groups.has(id))
  if (badGroup !== undefined) throw new Error(`progressScope: η ομάδα «${badGroup}» δεν ανήκει στο «${courseId}»`)
}

/**
 * @param {{ quizCorrect: number, quizAnswered: number, byGroup: Record<string, { correct: number, wrong: number }>, flashcardSeenIds: string[] }} progress snapshot του μαθήματος (global ids)
 * @param {{ kind: 'unit' | 'course', courseId: string, cardIds: string[], groupIds: string[] }} scope cardIds/groupIds = local ids του περιεχομένου
 */
export function scopedProgress(progress, scope) {
  assertScope(scope)
  const { kind, courseId, cardIds, groupIds } = scope
  const seen = new Set(progress.flashcardSeenIds)
  const scopeCards = [...new Set(cardIds)]
  const seenCards = scopeCards.filter((id) => seen.has(progressItem(courseId, id))).length
  let quizCorrect = progress.quizCorrect
  let quizAnswered = progress.quizAnswered
  if (kind === 'unit') {
    quizCorrect = 0
    quizAnswered = 0
    for (const g of new Set(groupIds)) {
      const s = progress.byGroup[g]
      if (!s) continue
      quizCorrect += s.correct
      quizAnswered += s.correct + s.wrong
    }
  }
  return { seenCards, totalCards: scopeCards.length, quizCorrect, quizAnswered }
}

export const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0)

/** Η σύνοψη της κλειστής μπάρας. Χωρίς απαντήσεις στο scope → «—». */
export function progressSummary({ seenCards, totalCards, quizCorrect, quizAnswered }) {
  const quiz = quizAnswered ? `${pct(quizCorrect, quizAnswered)}%` : '—'
  return `Κουίζ ${quiz} · Κάρτες ${seenCards}/${totalCards} (${pct(seenCards, totalCards)}%)`
}

const UNSUPPORTED = Object.freeze({ kind: 'unsupported' })

/**
 * Η σελίδα `/progress?scope=…` (Φάση 5, I2): κατηγορίες, scope και πλήθος ερωτήσεων από το STUDY_CONTENT του μαθήματος
 * της διαδρομής (κανένα fallback σε άλλο μάθημα). Μόνο όταν η συνεδρία κρατά πρόοδο ΑΥΤΟΥ του μαθήματος (`ready`)·
 * αλλιώς «δεν υποστηρίζεται» — ποτέ μηδενικά που μοιάζουν με αποθηκευμένη πρόοδο.
 * @param {{ courseId: string, unitId?: string, scope: { kind: string } }} identity επιλυμένη διαδρομή `progress`
 * @param {{ courseId: string, status: string }} course το μάθημα της συνεδρίας (studyCourse)
 */
export function progressPageView(identity, course) {
  const { courseId, scope } = identity
  if (course?.status !== 'ready' || course.courseId !== courseId) return UNSUPPORTED
  if (scope?.kind !== 'course' && scope?.kind !== 'unit') return UNSUPPORTED
  const c = STUDY_CONTENT[courseId]
  const unitId = scope.kind === 'unit' ? identity.unitId : undefined
  const categories = unitId === undefined ? c.categories : c.units[unitId]?.categories
  if (!categories) return UNSUPPORTED
  const ids = new Set(categories.map((g) => g.id))
  return Object.freeze({
    kind: 'ok',
    scope: progressScopeFor(courseId, unitId),
    categories,
    totalQuiz: c.quizQuestions.filter((q) => ids.has(q.categoryId)).length,
  })
}
