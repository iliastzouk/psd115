import { NavLink } from 'react-router-dom'

const links = [
  { to: '/week/1', label: 'Αρχική', end: true },
  { to: '/week/1/definition', label: 'Ορισμός' },
  { to: '/week/1/philosophers', label: 'Φιλόσοφοι' },
  { to: '/week/1/wundt', label: 'Wundt' },
  { to: '/week/1/functionalism', label: 'James' },
  { to: '/week/1/clinical', label: 'Κλινική' },
  { to: '/week/1/psychoanalysis', label: 'Freud' },
  { to: '/week/1/humanistic', label: 'Ανθρωπιστική' },
  { to: '/week/1/behaviorism', label: 'Συμπεριφορά' },
  { to: '/week/1/pavlov', label: 'Pavlov' },
  { to: '/week/1/little-albert', label: 'Albert' },
  { to: '/week/1/thorndike', label: 'Thorndike' },
  { to: '/week/1/flashcards', label: 'Κάρτες' },
  { to: '/week/1/quiz', label: 'Κουίζ' },
  { to: '/week/1/exam', label: 'Εξέταση' },
  { to: '/week/1/review', label: 'Λάθη' },
]

export default function Week1SubNav() {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-1">
      <nav className="flex gap-1.5 min-w-max sm:flex-wrap">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'touch-manipulation rounded-full px-3 py-2 text-xs font-medium border transition min-h-[40px] inline-flex items-center',
                isActive
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-teal-400',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
