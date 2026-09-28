/**
 * Deck K4 (1…51) ↔ σελίδα PDF / αρχείο PNG — ευθυγράμμιση 1:1 με τις διαφάνειες.
 */
export function k4DeckSlideToPdfPageNum(deckSlide) {
  if (deckSlide < 1) return 1
  return Math.min(deckSlide, 51)
}
