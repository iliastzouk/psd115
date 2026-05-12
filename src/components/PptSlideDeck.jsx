import { useCallback, useEffect, useMemo, useState } from 'react'
import { K1_PPT_SLIDE_BODIES, K1_PPT_TOTAL_SLIDES } from '../data/week1/k1PptSlideBodies.generated.js'
import { k1DeckSlideToPdfPageNum } from '../data/week1/k1DeckSlideToPdfPage.js'

function withBaseUrl(relPath) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/?$/, '/')}${relPath.replace(/^\//, '')}`
}

function pdfPageUrlForDeckSlide(deckSlide) {
  const pdfPage = k1DeckSlideToPdfPageNum(deckSlide)
  return withBaseUrl(`week1/k1-psd115.pdf#page=${pdfPage}`)
}

function slidePngUrlForDeckSlide(deckSlide) {
  const fileIndex = k1DeckSlideToPdfPageNum(deckSlide)
  return withBaseUrl(`week1/slides/slide-${String(fileIndex).padStart(2, '0')}.png`)
}

export default function PptSlideDeck({ slideNumbers, routeKey }) {
  const nums = useMemo(() => (Array.isArray(slideNumbers) ? slideNumbers.filter((n) => n >= 1 && n <= K1_PPT_TOTAL_SLIDES) : []), [slideNumbers])
  const [idx, setIdx] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setIdx(0)
  }, [routeKey, nums.join(',')])

  const at = nums[idx] ?? nums[0]
  const body = at != null ? K1_PPT_SLIDE_BODIES[at] : ''
  const hasMany = nums.length > 1

  useEffect(() => {
    setImgFailed(false)
  }, [at])

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIdx((i) => Math.min(nums.length - 1, i + 1)), [nums.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  if (!nums.length || at == null) return null

  const pdfPage = k1DeckSlideToPdfPageNum(at)
  const alt = `Διαφάνεια ${at} από ${K1_PPT_TOTAL_SLIDES} (K1 PSD115)`

  return (
    <section
      aria-label="Διαφάνειες διαλέξεων K1"
      className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Διαφάνεια στο PDF εβδομάδας 1 (K1)</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Διαφάνεια {at} / {K1_PPT_TOTAL_SLIDES}
            {hasMany ? ` · ${idx + 1} / ${nums.length} για αυτή την ενότητα` : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasMany && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={idx === 0}
                className="touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs font-medium min-h-[44px] sm:min-h-0 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Προηγ.
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={idx >= nums.length - 1}
                className="touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs font-medium min-h-[44px] sm:min-h-0 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Επόμ.
              </button>
            </>
          )}
          <a
            href={pdfPageUrlForDeckSlide(at)}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-manipulation rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white px-3 py-2 text-xs font-medium min-h-[44px] sm:min-h-0 inline-flex items-center"
          >
            Άνοιγμα PDF
          </a>
        </div>
      </div>
      <div className="px-3 sm:px-4 py-3 sm:py-4 bg-slate-100/60 dark:bg-slate-950/40">
        {!imgFailed ? (
          <figure className="m-0 rounded-lg overflow-hidden border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner">
            <img
              src={slidePngUrlForDeckSlide(at)}
              alt={alt}
              width={1280}
              height={720}
              className="w-full h-auto max-h-[min(70vh,28rem)] object-contain object-center mx-auto block"
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
            />
          </figure>
        ) : (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-2">Δεν φορτώθηκε η εικόνα διαφάνειας. Εκτελέστε `npm run build:k1-images` ή ανοίξτε το PDF.</p>
            {body ? (
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">{body}</p>
            ) : null}
          </div>
        )}
      </div>
      {hasMany && nums.length <= 8 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3" role="tablist" aria-label="Επιλογή διαφάνειας">
          {nums.map((n, i) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={i === idx}
              onClick={() => setIdx(i)}
              className={`touch-manipulation min-w-[2.25rem] rounded-md px-2 py-1 text-xs font-medium transition ${
                i === idx
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-400 px-4 pb-3 pt-0 border-t border-slate-200/70 dark:border-slate-700/80 mt-1">
        Οι διαφάνειες PowerPoint της διάλεξης αποτελούν πνευματική ιδιοκτησία του Ευρωπαϊκού Πανεπιστημίου Κύπρου.
      </p>
    </section>
  )
}
