export default function SectionCard({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="text-sm font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wide mb-3">{title}</h2>
      )}
      {children}
    </section>
  )
}
