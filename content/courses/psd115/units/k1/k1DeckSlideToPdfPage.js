/**
 * Αριθμοί διαφανειών στο deck K1 (1…35, όπως `-- N of 35 --` στο κείμενο) έναντι
 * πραγματικής σελίδας στο αρχείο PDF / στο όνομα PNG (slide-XX.png = PDF σελίδα XX).
 *
 * Η 1η σελίδα του PDF είναι κενή· η διαφάνεια «1» (Στόχοι) είναι PDF σελίδα 2 → slide-02.png.
 */
export function k1DeckSlideToPdfPageNum(deckSlide) {
  if (deckSlide < 1) return 1
  return Math.min(deckSlide + 1, 35)
}
