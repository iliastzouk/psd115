import { unitPath } from '../core/routing/paths.js'

/**
 * Κύρια πλοήγηση εβδομάδων (header). Canonical URLs (Phase 1C-B)· το `unitId` χρησιμοποιείται για
 * να φωτίζεται η εβδομάδα και σε topic/study σελίδες της ίδιας ενότητας.
 * @type {{ to: string, end?: boolean, unitId?: string, short: string, long: string }[]}
 */
export const HEADER_WEEK_NAV = [
  { to: '/', end: true, short: 'Αρχική', long: 'Αρχική' },
  { to: unitPath('psd115', 'k1'), unitId: 'k1', short: 'Εβδ. 1', long: 'Εβδομάδα 1' },
  { to: unitPath('psd115', 'k2'), unitId: 'k2', short: 'Εβδ. 2', long: 'Εβδομάδα 2' },
  { to: unitPath('psd115', 'k3'), unitId: 'k3', short: 'Εβδ. 3', long: 'Εβδομάδα 3' },
  { to: unitPath('psd115', 'k4'), unitId: 'k4', short: 'Εβδ. 4', long: 'Εβδομάδα 4' },
]
