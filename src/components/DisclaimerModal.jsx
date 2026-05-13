import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import WarningTriangleIcon from './WarningTriangleIcon.jsx'

/**
 * First-visit blocking disclaimer. No dismiss via backdrop or Escape.
 */
export default function DisclaimerModal({ open, onAccept }) {
  const titleId = useId()
  const descId = useId()
  const acceptRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => acceptRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/90 bg-stone-50 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2
          id={titleId}
          className="flex items-center gap-2 text-base font-normal text-slate-800 dark:text-slate-100"
        >
          <span className="shrink-0 text-amber-600/50 dark:text-amber-500/40" aria-hidden>
            <WarningTriangleIcon className="size-6" />
          </span>
          <span className="leading-tight">
            <span className="font-normal text-rose-600/85 dark:text-rose-300/75">ΠΡΟΣΟΧΗ:</span> Αποποίηση ευθύνης
          </span>
        </h2>
        <div
          id={descId}
          className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          <p>
            Αυτή η εφαρμογή είναι προσωπική εργασία οργάνωσης και μελέτης. Δεν σχετίζεται με τον διδάσκοντα, το
            πανεπιστήμιο ή οποιονδήποτε επίσημο φορέα του μαθήματος PSD115.
          </p>
          <p>
            Το περιεχόμενο μπορεί να περιέχει λάθη, παραλείψεις ή ανακρίβειες· δεν αποτελεί επίσημο οδηγό
            προετοιμασίας.
          </p>
          <p className="font-medium text-slate-800 dark:text-slate-200">
            Για να συνεχίσετε, επιβεβαιώστε ότι το κατανοείτε.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            ref={acceptRef}
            type="button"
            onClick={onAccept}
            className="touch-manipulation rounded-lg border border-teal-600 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 hover:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Συμφωνώ και συνεχίζω
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
