/**
 * Φάση 6b (K6): patterns των legacy κλειδιών προόδου, κοινά για τον έλεγχο του production bundle (smoke:progress) και
 * του `src/` (tests). Δεν απαγορεύεται το κοινό prefix `psd115-w`: το `psd115-w1-theme` είναι ρύθμιση και επιτρέπεται ΜΟΝΟ
 * ως ακριβές quoted κλειδί· το `psd115-disclaimer-v1` δεν πιάνεται από κανένα pattern. Το `psd115-progress-export` είναι
 * όνομα μορφής αρχείου (απόρριψη παλιών exports) και επίσης δεν πιάνεται.
 */
export const LEGACY_KEY_RE = /psd115-w(?!1-theme(?=['"`]))|psd115-backup-|migration:psd115|legacy-baseline:psd115|shadow:psd115/
/** Τα κλειδιά ρυθμίσεων που ΠΡΕΠΕΙ να υπάρχουν (αλλιώς ο έλεγχος θα ήταν κενός). */
export const SETTINGS_KEY_RES = [/['"`]psd115-w1-theme['"`]/, /['"`]psd115-disclaimer-v1['"`]/]
