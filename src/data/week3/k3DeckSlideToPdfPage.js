/**
 * Deck K3 (1…66) ↔ σελίδα PDF / αρχείο PNG — 66 σελίδες PDF ευθυγραμμισμένες με τις διαφάνειες.
 */
export function k3DeckSlideToPdfPageNum(deckSlide) {
  if (deckSlide < 1) return 1
  return Math.min(deckSlide, 66)
}
