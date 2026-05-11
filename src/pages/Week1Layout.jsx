import { Outlet, useOutletContext } from 'react-router-dom'
import Week1SubNav from '../components/Week1SubNav.jsx'
import Progress from '../components/Progress.jsx'
import { flashcards, quizQuestions } from '../data/questions.js'

export default function Week1Layout() {
  const ctx = useOutletContext()

  return (
    <div className="space-y-5">
      <Week1SubNav />
      <Progress progress={ctx.progress} totalFlashcards={flashcards.length} totalQuiz={quizQuestions.length} />
      <Outlet context={ctx} />
    </div>
  )
}
