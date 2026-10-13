import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import { recoverInterrupted } from './utils/progressTransaction.js'
import { createLegacyProgressBackend } from './utils/legacyProgressBackend.js'
import { initSettings } from './utils/settings.js'
import { createProgressService } from './core/progress/progressService.js'
import { psd115ProgressAdapter } from './core/progress/adapters/psd115.js'
import { installProgressService } from './hooks/useProgress.js'

const storage = (() => {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
})()

// 1. Αν μια εισαγωγή/επαναφορά διακόπηκε στη μέση (π.χ. κλείσιμο tab), ολοκληρώνεται ή αναιρείται
//    ΠΡΙΝ φορτώσει η εφαρμογή την πρόοδο. Χωρίς διακοπή: μόνο μία ανάγνωση, καμία εγγραφή.
let recovery = { status: 'none' }
try {
  recovery = recoverInterrupted(storage)
  if (recovery.status !== 'none') console.warn('[progress] ανάκτηση μετά από διακοπή:', recovery)
} catch {
  /* χωρίς localStorage: τίποτα να ανακτηθεί */
}

// 2. Ρυθμίσεις (theme/disclaimer): σύγχρονη ανάγνωση, η κλάση dark πριν από το πρώτο paint. Καμία εγγραφή.
initSettings(storage, document.documentElement)

// 3. ProgressService (1E-4b): ΕΝΑ instance, σύγχρονη ανάγνωση της προόδου πριν από το render. Καμία εγγραφή.
const progressService = createProgressService({
  courseId: 'psd115',
  content: psd115ProgressAdapter,
  backend: createLegacyProgressBackend(storage),
  recovery,
  warn: (...a) => console.warn(...a),
})
installProgressService(progressService)
if (progressService.getSnapshot().status !== 'ready') console.warn('[progress] ασφαλής λειτουργία:', progressService.getSnapshot().issues)

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
