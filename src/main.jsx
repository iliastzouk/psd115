import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import { recoverInterrupted } from './utils/progressTransaction.js'

// Αν μια εισαγωγή/επαναφορά διακόπηκε στη μέση (π.χ. κλείσιμο tab), ολοκληρώνεται ή αναιρείται
// ΠΡΙΝ φορτώσει η εφαρμογή την πρόοδο. Χωρίς διακοπή: μόνο μία ανάγνωση, καμία εγγραφή.
try {
  const recovery = recoverInterrupted(window.localStorage)
  if (recovery.status !== 'none') console.warn('[progress] ανάκτηση μετά από διακοπή:', recovery)
} catch {
  /* χωρίς localStorage: τίποτα να ανακτηθεί */
}

// Μόνο σε `npm run dev`: στην κονσόλα `psd115Progress.validate()` για έλεγχο της αποθηκευμένης προόδου,
// και `studyProgress.store` / `studyProgress.persist()` για τη νέα (ακόμα αχρησιμοποίητη) υποδομή του Phase 0B.
if (import.meta.env.DEV) {
  import('./utils/progressBackup.js').then((m) => {
    window.psd115Progress = { validate: m.validateStoredProgress, snapshot: m.buildExport }
  })
  Promise.all([import('./core/progress/progressStore.js'), import('./core/progress/persist.js')]).then(([s, p]) => {
    window.studyProgress = { store: s.getProgressStore(), persist: p.requestPersistentStorage }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </>
  </StrictMode>,
)
