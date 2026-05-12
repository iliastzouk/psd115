import { K1_PPT_SLIDE_BODIES, K1_PPT_TOTAL_SLIDES } from './week1/k1PptSlideBodies.generated.js'
import { k1DeckSlideToPdfPageNum } from './week1/k1DeckSlideToPdfPage.js'
import { K2_PPT_SLIDE_BODIES, K2_PPT_TOTAL_SLIDES } from './week2/k2PptSlideBodies.generated.js'
import { k2DeckSlideToPdfPageNum } from './week2/k2DeckSlideToPdfPage.js'

/** @typedef {'week1' | 'week2'} PptDeckId */

/** @type {Record<PptDeckId, { bodies: Record<number, string>, totalSlides: number, deckToPdfPage: (n: number) => number, pdfPath: string, slidesDir: string, headerTitle: string, ariaLabel: string, codeLabel: string, buildImagesHint: string }>} */
export const PPT_DECK_REGISTRY = {
  week1: {
    bodies: K1_PPT_SLIDE_BODIES,
    totalSlides: K1_PPT_TOTAL_SLIDES,
    deckToPdfPage: k1DeckSlideToPdfPageNum,
    pdfPath: 'week1/k1-psd115.pdf',
    slidesDir: 'week1/slides',
    headerTitle: 'Διαφάνεια στο PDF εβδομάδας 1 (K1)',
    ariaLabel: 'Διαφάνειες διαλέξεων K1',
    codeLabel: 'K1 PSD115',
    buildImagesHint: 'npm run build:k1-images',
  },
  week2: {
    bodies: K2_PPT_SLIDE_BODIES,
    totalSlides: K2_PPT_TOTAL_SLIDES,
    deckToPdfPage: k2DeckSlideToPdfPageNum,
    pdfPath: 'week2/k2-psd115.pdf',
    slidesDir: 'week2/slides',
    headerTitle: 'Διαφάνεια στο PDF εβδομάδας 2 (K2)',
    ariaLabel: 'Διαφάνειες διαλέξεων K2',
    codeLabel: 'K2 PSD115',
    buildImagesHint: 'npm run build:k2-images',
  },
}
