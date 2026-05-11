import { useOutletContext } from 'react-router-dom'
import WundtLesson from '../components/WundtLesson.jsx'

export default function WundtPage() {
  const { lessonResetKey, markFlashSeen, wundtFlashcardsOnly } = useOutletContext()
  return (
    <WundtLesson key={lessonResetKey} wundtFlashcards={wundtFlashcardsOnly} onMarkFlashSeen={markFlashSeen} />
  )
}
