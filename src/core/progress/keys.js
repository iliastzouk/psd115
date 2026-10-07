/**
 * Κλειδιά state του νέου progress store (μία πηγή).
 */
import { resetStateKey } from './namespaces.js'

export const LEGACY_BASELINE_KEY = 'legacy-baseline:psd115'
export const MIGRATION_MARKER_KEY = 'migration:psd115-v1'
/**
 * Reset μετά το migration: τα παράγωγα αγνοούν το baseline και τα events πριν από το `at`.
 * ΕΝΑΣ ορισμός (Phase 1E-4b): το ίδιο κλειδί γράφει το reset (progressBackup) και διαβάζουν το reconciliation
 * και ο snapshot reader — `progress:reset:psd115`. Κανένα εναλλακτικό/παλιό κλειδί δεν γίνεται δεκτό.
 */
export const RESET_MARKER_KEY = resetStateKey('psd115')
/** Shadow mode (1E-3): { enabled, activatedAt, failures, recentFailures[] }. */
export const SHADOW_STATE_KEY = 'shadow:psd115'
