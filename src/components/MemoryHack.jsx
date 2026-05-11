export default function MemoryHack({ lines, title = 'Μνημονικό' }) {
  const list = Array.isArray(lines) ? lines : [lines]
  return (
    <div className="rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200 mb-1">{title}</p>
      {list.map((line, i) => (
        <p key={i} className="text-sm font-medium text-slate-900 dark:text-amber-50">
          {line}
        </p>
      ))}
    </div>
  )
}
