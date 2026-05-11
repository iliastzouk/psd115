import { Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Home from './pages/Home.jsx'
import Week1Layout from './pages/Week1Layout.jsx'
import Week1Home from './pages/Week1Home.jsx'
import DefinitionPage from './pages/DefinitionPage.jsx'
import PhilosophersPage from './pages/PhilosophersPage.jsx'
import WundtPage from './pages/WundtPage.jsx'
import FlashcardsPage from './pages/FlashcardsPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import ExamMode from './pages/ExamMode.jsx'
import ReviewPage from './pages/ReviewPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/week/1" element={<Week1Layout />}>
          <Route index element={<Week1Home />} />
          <Route path="definition" element={<DefinitionPage />} />
          <Route path="philosophers" element={<PhilosophersPage />} />
          <Route path="wundt" element={<WundtPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="exam" element={<ExamMode />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
