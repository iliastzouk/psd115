/**
 * Deck K3 — λογικός αριθμός διαφάνειας (όπως στα εξαγόμενα `k3PptSlideBodies`, `-- N of 66 --`)
 * ↔ σελίδα PDF / αρχείο PNG (`public/week3/slides/slide-XX.png`).
 *
 * Η 1η σελίδα του PDF είναι ο τίτλος («Νευροεπιστήμη και Συμπεριφορά»)· το εξαγόμενο κείμενο
 * για «διαφάνεια 1» αντιστοιχεί στην 2η σελίδα του PDF (Στόχοι μαθήματος). Ίδια λογική με K2:
 * `deckSlide + 1` για το άνοιγμα σωστής εικόνας/PDF page.
 */
export function k3DeckSlideToPdfPageNum(deckSlide) {
  if (deckSlide < 1) return 1
  return Math.min(deckSlide + 1, 66)
}
