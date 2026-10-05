/**
 * Reconciliation shadow ↔ legacy (Phase 1E-3) — pure.
 *
 * Όσο ο shadow mode είναι ενεργός από τη στιγμή του migration, κάθε αλλαγή στο legacy πρέπει να έχει
 * αντίστοιχα πραγματικά events:
 *   κουίζ:  legacy (answered, correct, byCategory) − baseline  ==  answer events (ctx 'quiz')
 *   κάρτες: legacy seen − baseline seen                         ==  flip items (ctx 'flash') − baseline seen
 * Το wrongBook ΔΕΝ συγκρίνεται (το event δεν κρατά την επιλεγμένη απάντηση).
 * Με reset marker, η σύγκριση ξεκινά από το μηδέν και μόνο με events από το reset και μετά.
 */
import { quizQuestions } from '../../../content/courses/psd115/questions.js'
import { parseGlobalId } from '../academic/ids.js'

const categoryOf = new Map(quizQuestions.map((q) => [q.id, q.categoryId]))
const ZERO = { quizAnswered: 0, quizCorrect: 0, byCategory: {}, flashcardSeenIds: [] }

/**
 * @param {{ baseline: { courseId: string, progress: object }, legacy: object, events: object[], reset?: { at: string } | null }} input
 *   legacy: το parsed `psd115-w1-study` τώρα
 */
export function reconcileShadow({ baseline, legacy, events, reset = null }) {
  const resetAt = reset?.at ? Date.parse(reset.at) : null
  const base = resetAt === null ? baseline.progress : ZERO
  const relevant = events.filter((e) => (resetAt === null || e.t >= resetAt) && parseGlobalId(e.item)?.courseId === baseline.courseId)
  const local = (e) => parseGlobalId(e.item).localId

  const answers = relevant.filter((e) => e.kind === 'answer' && e.ctx === 'quiz')
  const eventsDelta = { answered: answers.length, correct: answers.filter((e) => e.ok === 1).length, byCategory: {} }
  for (const e of answers) {
    const cat = categoryOf.get(local(e)) ?? '(άγνωστη)'
    const s = (eventsDelta.byCategory[cat] ??= { correct: 0, wrong: 0 })
    if (e.ok === 1) s.correct += 1
    else s.wrong += 1
  }

  const legacyDelta = {
    answered: (legacy.quizAnswered ?? 0) - base.quizAnswered,
    correct: (legacy.quizCorrect ?? 0) - base.quizCorrect,
    byCategory: {},
  }
  const cats = new Set([...Object.keys(legacy.byCategory ?? {}), ...Object.keys(base.byCategory)])
  for (const cat of cats) {
    const now = legacy.byCategory?.[cat] ?? { correct: 0, wrong: 0 }
    const was = base.byCategory[cat] ?? { correct: 0, wrong: 0 }
    const d = { correct: now.correct - was.correct, wrong: now.wrong - was.wrong }
    if (d.correct || d.wrong) legacyDelta.byCategory[cat] = d
  }

  const issues = []
  if (legacyDelta.answered < 0 || legacyDelta.correct < 0 || Object.values(legacyDelta.byCategory).some((d) => d.correct < 0 || d.wrong < 0)) {
    issues.push('το legacy είναι «πίσω» από το baseline (reset χωρίς σημάδι ή overwrite από άλλο tab)')
  }
  const byCategoryMismatch = [...new Set([...Object.keys(legacyDelta.byCategory), ...Object.keys(eventsDelta.byCategory)])]
    .filter((cat) => JSON.stringify(legacyDelta.byCategory[cat] ?? null) !== JSON.stringify(eventsDelta.byCategory[cat] ?? null))
    .sort()

  const baseSeen = new Set(base.flashcardSeenIds)
  const legacyNew = new Set((legacy.flashcardSeenIds ?? []).filter((id) => !baseSeen.has(id)))
  const eventNew = new Set(relevant.filter((e) => e.kind === 'flip' && e.ctx === 'flash').map(local).filter((id) => !baseSeen.has(id)))
  const cards = {
    missingEvents: [...legacyNew].filter((id) => !eventNew.has(id)).sort(),
    extraEvents: [...eventNew].filter((id) => !legacyNew.has(id)).sort(),
  }

  const ok =
    !issues.length &&
    legacyDelta.answered === eventsDelta.answered &&
    legacyDelta.correct === eventsDelta.correct &&
    !byCategoryMismatch.length &&
    !cards.missingEvents.length &&
    !cards.extraEvents.length
  return { ok, quiz: { legacy: legacyDelta, events: eventsDelta, byCategoryMismatch }, cards, issues }
}
