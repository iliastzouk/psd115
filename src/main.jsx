import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.jsx'
import { recoverInterrupted } from './core/progress/transaction.js'
import { initSettings } from './utils/settings.js'
import { createStoreProgressService } from './core/progress/storeProgressService.js'
import { studyContentAdapters } from './core/progress/adapters/studyContent.js'
import { installProgressService } from './hooks/useProgress.js'
import { installStorageSync } from './utils/progressSync.js'

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

// 3. ProgressService (Φάση 6a): ΕΝΑ instance για όλα τα μαθήματα με περιεχόμενο, πάνω στο νέο store (`study-progress-*`).
//    Σύγχρονη ανάγνωση πριν από το render· καμία εγγραφή, κανένα namespace δεν δημιουργείται στην εκκίνηση.
const progressService = createStoreProgressService({
  adapters: studyContentAdapters(),
  storage,
  recovery,
  warn: (...a) => console.warn(...a),
})
installProgressService(progressService)
if (progressService.getSnapshot().status !== 'ready') console.warn('[progress] ασφαλής λειτουργία:', progressService.getSnapshot().issues)
// Φάση 3: αλλαγές από άλλο tab → refresh (μόνο ανάγνωση). Κάθε ενέργεια διαβάζει έτσι κι αλλιώς πρώτα το storage.
installStorageSync(progressService, { storage })

// Μόνο σε `npm run dev`: στην κονσόλα `studyProgress.export()` / `studyProgress.status()` για έλεγχο της προόδου.
if (import.meta.env.DEV) {
  import('./utils/studyProgressBackup.js').then((m) => {
    window.studyProgress = { export: () => m.buildStoreExport({ storage }), raw: () => m.buildRawExport({ storage }), status: () => m.storeStatus(storage).status }
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
