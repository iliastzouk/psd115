/**
 * Deck K2 (1…44, `-- N of 44 --`) ↔ σελίδα PDF / αρχείο PNG (σελ. 1 PDF κενή).
 */
export function k2DeckSlideToPdfPageNum(deckSlide) {
  if (deckSlide < 1) return 1
  return Math.min(deckSlide + 1, 44)
}
