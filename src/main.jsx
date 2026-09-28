import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'

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
