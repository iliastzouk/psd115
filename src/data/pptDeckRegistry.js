import { K1_PPT_SLIDE_BODIES, K1_PPT_TOTAL_SLIDES } from './week1/k1PptSlideBodies.generated.js'
import { k1DeckSlideToPdfPageNum } from './week1/k1DeckSlideToPdfPage.js'
import { K2_PPT_SLIDE_BODIES, K2_PPT_TOTAL_SLIDES } from './week2/k2PptSlideBodies.generated.js'
import { k2DeckSlideToPdfPageNum } from './week2/k2DeckSlideToPdfPage.js'
import { K3_PPT_SLIDE_BODIES, K3_PPT_TOTAL_SLIDES } from './week3/k3PptSlideBodies.generated.js'
import { k3DeckSlideToPdfPageNum } from './week3/k3DeckSlideToPdfPage.js'
import { K4_PPT_SLIDE_BODIES, K4_PPT_TOTAL_SLIDES } from './week4/k4PptSlideBodies.generated.js'
import { k4DeckSlideToPdfPageNum } from './week4/k4DeckSlideToPdfPage.js'

/** @typedef {'week1' | 'week2' | 'week3' | 'week4'} PptDeckId */

/** @type {Record<PptDeckId, { bodies: Record<number, string>, totalSlides: number, deckToPdfPage: (n: number) => number, pdfPath: string, slidesDir: string, headerTitle: string, ariaLabel: string, codeLabel: string, buildImagesHint: string }>} */
export const PPT_DECK_REGISTRY = {
  week1: {
    bodies: K1_PPT_SLIDE_BODIES,
    totalSlides: K1_PPT_TOTAL_SLIDES,
    deckToPdfPage: k1DeckSlideToPdfPageNum,
    pdfPath: 'week1/k1-psd115.pdf',
    slidesDir: 'week1/slides',
    headerTitle: 'Διαφάνειες εβδομάδας 1',
    ariaLabel: 'Διαφάνειες διάλεξης εβδομάδας 1',
    codeLabel: 'Εβδομάδα 1',
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
  week3: {
    bodies: K3_PPT_SLIDE_BODIES,
    totalSlides: K3_PPT_TOTAL_SLIDES,
    deckToPdfPage: k3DeckSlideToPdfPageNum,
    pdfPath: 'week3/k3-psd115.pdf',
    slidesDir: 'week3/slides',
    headerTitle: 'Διαφάνεια στο PDF εβδομάδας 3 (K3)',
    ariaLabel: 'Διαφάνειες διαλέξεων K3',
    codeLabel: 'K3 PSD115',
    buildImagesHint: 'npm run build:k3-images',
  },
  week4: {
    bodies: K4_PPT_SLIDE_BODIES,
    totalSlides: K4_PPT_TOTAL_SLIDES,
    deckToPdfPage: k4DeckSlideToPdfPageNum,
    pdfPath: 'week4/k4-psd115.pdf',
    slidesDir: 'week4/slides',
    headerTitle: 'Διαφάνεια στο PDF εβδομάδας 4 (K4)',
    ariaLabel: 'Διαφάνειες διαλέξεων K4',
    codeLabel: 'K4 PSD115',
    buildImagesHint: 'npm run build:k4-images',
  },
}
