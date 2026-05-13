import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Επιβεβαίωση',
  cancelLabel = 'Άκυρο',
  variant = 'neutral',
}) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef(null)

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
    const t = window.setTimeout(() => cancelRef.current?.focus(), 0)
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const confirmClass =
    variant === 'danger'
      ? 'rounded-lg border border-rose-600 bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 hover:border-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
      : 'rounded-lg border border-teal-600 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 hover:border-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        aria-label={cancelLabel}
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/90 bg-stone-50 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="touch-manipulation rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80 dark:focus-visible:ring-offset-slate-900"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={`touch-manipulation ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
