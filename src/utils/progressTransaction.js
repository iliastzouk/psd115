/**
 * Η application-level συναλλαγή ζει στο core (`src/core/progress/transaction.js`) από το 1E-4c-2, ώστε να τη χρησιμοποιεί
 * και το progressStore. Εδώ μένει μόνο το re-export για τους υπάρχοντες καλούντες (import/reset/migration/backend/main).
 */
export * from '../core/progress/transaction.js'
