import { Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Home from './pages/Home.jsx'
import LegacyRedirect from './pages/routing/LegacyRedirect.jsx'
import NotFound from './pages/routing/NotFound.jsx'
import {
  DocPage,
  StudyContent,
  StudyFrame,
  TopicContent,
  TopicFrame,
  UnitFrame,
  UnitHome,
} from './pages/routing/frames.jsx'
import { CoursePage, ProgressPage, TermPage } from './pages/routing/registryPages.jsx'

/**
 * Canonical routing (Phase 1C-B) — βλ. src/core/routing/paths.js για το URL contract.
 * Οι παλιές διαδρομές /week/... επιλύονται ΜΟΝΟ μέσω του ρητού legacy πίνακα (LegacyRedirect).
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/week/*" element={<LegacyRedirect />} />
        <Route path="/terms/:termId" element={<TermPage />} />
        <Route path="/study/:tool" element={<StudyFrame />}>
          <Route index element={<StudyContent />} />
        </Route>
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/:courseId" element={<CoursePage />} />
        <Route path="/:courseId/units/:unitId" element={<UnitFrame />}>
          <Route index element={<UnitHome />} />
        </Route>
        <Route path="/:courseId/topics/:topicId" element={<TopicFrame />}>
          <Route index element={<TopicContent />} />
        </Route>
        <Route path="/:courseId/docs/:docId" element={<DocPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
