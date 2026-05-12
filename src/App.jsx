import { Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell.jsx'
import Home from './pages/Home.jsx'
import Week1Layout from './pages/Week1Layout.jsx'
import Week1Home from './pages/Week1Home.jsx'
import Week2Layout from './pages/Week2Layout.jsx'
import Week2Home from './pages/Week2Home.jsx'
import Week2TopicPage from './pages/Week2TopicPage.jsx'
import Week3Layout from './pages/Week3Layout.jsx'
import Week3Home from './pages/Week3Home.jsx'
import Week3TopicPage from './pages/Week3TopicPage.jsx'
import Week4Layout from './pages/Week4Layout.jsx'
import Week4Home from './pages/Week4Home.jsx'
import Week4TopicPage from './pages/Week4TopicPage.jsx'
import DefinitionPage from './pages/DefinitionPage.jsx'
import PhilosophersPage from './pages/PhilosophersPage.jsx'
import WundtPage from './pages/WundtPage.jsx'
import FunctionalismPage from './pages/FunctionalismPage.jsx'
import ClinicalPsychologyPage from './pages/ClinicalPsychologyPage.jsx'
import PsychoanalysisPage from './pages/PsychoanalysisPage.jsx'
import HumanisticPsychologyPage from './pages/HumanisticPsychologyPage.jsx'
import BehaviorismPage from './pages/BehaviorismPage.jsx'
import PavlovPage from './pages/PavlovPage.jsx'
import LittleAlbertPage from './pages/LittleAlbertPage.jsx'
import ThorndikePage from './pages/ThorndikePage.jsx'
import SkinnerPage from './pages/SkinnerPage.jsx'
import CognitivePage from './pages/CognitivePage.jsx'
import ChomskyPage from './pages/ChomskyPage.jsx'
import NeurosciencePage from './pages/NeurosciencePage.jsx'
import GestaltPage from './pages/GestaltPage.jsx'
import EvolutionaryPage from './pages/EvolutionaryPage.jsx'
import SocialPsychologyPage from './pages/SocialPsychologyPage.jsx'
import EducationalPsychologyPage from './pages/EducationalPsychologyPage.jsx'
import OtherBranchesPage from './pages/OtherBranchesPage.jsx'
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
          <Route path="functionalism" element={<FunctionalismPage />} />
          <Route path="clinical" element={<ClinicalPsychologyPage />} />
          <Route path="psychoanalysis" element={<PsychoanalysisPage />} />
          <Route path="humanistic" element={<HumanisticPsychologyPage />} />
          <Route path="behaviorism" element={<BehaviorismPage />} />
          <Route path="pavlov" element={<PavlovPage />} />
          <Route path="little-albert" element={<LittleAlbertPage />} />
          <Route path="thorndike" element={<ThorndikePage />} />
          <Route path="skinner" element={<SkinnerPage />} />
          <Route path="cognitive" element={<CognitivePage />} />
          <Route path="chomsky" element={<ChomskyPage />} />
          <Route path="neuroscience" element={<NeurosciencePage />} />
          <Route path="gestalt" element={<GestaltPage />} />
          <Route path="evolutionary" element={<EvolutionaryPage />} />
          <Route path="social-psychology" element={<SocialPsychologyPage />} />
          <Route path="educational-psychology" element={<EducationalPsychologyPage />} />
          <Route path="other-branches" element={<OtherBranchesPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="exam" element={<ExamMode />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
        <Route path="/week/2" element={<Week2Layout />}>
          <Route index element={<Week2Home />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="exam" element={<ExamMode />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path=":slug" element={<Week2TopicPage />} />
        </Route>
        <Route path="/week/3" element={<Week3Layout />}>
          <Route index element={<Week3Home />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="exam" element={<ExamMode />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path=":slug" element={<Week3TopicPage />} />
        </Route>
        <Route path="/week/4" element={<Week4Layout />}>
          <Route index element={<Week4Home />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="exam" element={<ExamMode />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path=":slug" element={<Week4TopicPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
