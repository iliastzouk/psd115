/**
 * Κλειδιά state του νέου progress store (μία πηγή). Χωρίς εξαρτήσεις.
 */
export const LEGACY_BASELINE_KEY = 'legacy-baseline:psd115'
export const MIGRATION_MARKER_KEY = 'migration:psd115-v1'
/** Reset μετά το migration: τα παράγωγα αγνοούν το baseline και τα events πριν από το `at`. */
export const RESET_MARKER_KEY = 'progress-reset:psd115'
/** Shadow mode (1E-3): { enabled, activatedAt, failures, recentFailures[] }. */
export const SHADOW_STATE_KEY = 'shadow:psd115'
