/**
 * Κύρια πλοήγηση εβδομάδων (header). Πρόσθεσε εδώ νέες εβδομάδες όταν προστίθενται routes στο App.
 * @type {{ to: string, end?: boolean, short: string, long: string }[]}
 */
export const HEADER_WEEK_NAV = [
  { to: '/', end: true, short: 'Αρχική', long: 'Αρχική' },
  { to: '/week/1', short: 'Εβδ. 1', long: 'Εβδομάδα 1' },
  { to: '/week/2', short: 'Εβδ. 2', long: 'Εβδομάδα 2' },
  { to: '/week/3', short: 'Εβδ. 3', long: 'Εβδομάδα 3' },
  { to: '/week/4', short: 'Εβδ. 4', long: 'Εβδομάδα 4' },
]
