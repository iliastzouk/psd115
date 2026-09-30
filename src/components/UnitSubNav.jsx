import { NavLink, useNavigate } from 'react-router-dom'
import { useRouteIdentity } from '../core/routing/hooks.js'
import { getUnit } from '../core/routing/catalog.js'
import { unitTools, unitTopics } from '../core/routing/navigation.js'
import { unitPath } from '../core/routing/paths.js'
import { topicTitle } from '../pages/routing/coursePresentation.js'

const TOOL_LABELS = { flashcards: 'Κάρτες', quiz: 'Κουίζ', exam: 'Εξέταση', review: 'Λάθη' }

const pillBase =
  'touch-manipulation rounded-full px-3 py-2 text-xs font-medium border transition min-h-[40px] inline-flex items-center'

function linkClass(isActive) {
  return [
    pillBase,
    isActive
      ? 'border-teal-600 bg-teal-600 text-white'
      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-400',
  ].join(' ')
}

const selectClass =
  'w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'

/**
 * Πλοήγηση μιας unit: εργαλεία μελέτης + επιλογή θέματος. Όλα τα links/τιμές προέρχονται από τα
 * canonical identities (navigation.js)· το ενεργό θέμα από την επιλυμένη ταυτότητα, όχι από pathname.
 * @param {{ courseId: string, unitId: string }} props
 */
export default function UnitSubNav({ courseId, unitId }) {
  const navigate = useNavigate()
  const id = useRouteIdentity()
  const unit = getUnit(courseId, unitId)
  const topics = unitTopics(courseId, unitId)
  if (!unit) return null

  /** Πάντα ορατά — χωρίς οριζόντιο scroll για Κάρτες/Κουίζ. Όχι «Αρχική» (αυτή είναι στο header). */
  const toolLinks = [
    { to: unitPath(courseId, unitId), label: 'Ενότητες', end: true },
    ...unitTools(courseId, unitId).map((t) => ({ to: t.path, label: TOOL_LABELS[t.tool] })),
  ]
  const onToolPage = id.kind === 'study'
  const selected = id.kind === 'topic' && topics.some((t) => t.topicId === id.topicId) ? id.topicId : ''
  const selectId = `${unitId}-lesson-select`

  return (
    <nav className="space-y-2.5" aria-label={`${unit.label} — πλοήγηση`}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
          Εργαλεία μελέτης
        </p>
        <div className="flex flex-wrap gap-1.5">
          {toolLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {!onToolPage && (
        <div>
          <label
            htmlFor={selectId}
            className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5 block"
          >
            Θέμα ενότητας
          </label>
          <select
            id={selectId}
            className={selectClass}
            value={selected}
            onChange={(e) => {
              const next = topics.find((t) => t.topicId === e.target.value)
              if (next) navigate(next.path)
            }}
            aria-label="Επίλεξε θέμα για να ανοίξεις τη σελίδα ενότητας"
          >
            <option value="">— Επίλεξε ενότητα —</option>
            {topics.map((t) => (
              <option key={t.topicId} value={t.topicId}>
                {topicTitle(t)}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  )
}
