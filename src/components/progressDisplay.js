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

/**
 * @param {{ quizCorrect: number, quizAnswered: number, byGroup: Record<string, { correct: number, wrong: number }>, flashcardSeenIds: string[] }} progress snapshot του μαθήματος (global ids)
 * @param {{ kind: 'unit' | 'course', courseId: string, cardIds: string[], groupIds: string[] }} scope cardIds/groupIds = local ids του περιεχομένου
 */
export function scopedProgress(progress, { kind, courseId, cardIds, groupIds }) {
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
