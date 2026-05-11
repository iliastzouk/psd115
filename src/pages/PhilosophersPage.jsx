import { useOutletContext } from 'react-router-dom'
import PhilosophersLesson from '../components/PhilosophersLesson.jsx'

export default function PhilosophersPage() {
  const { philosopherFlashcardsOnly, markFlashSeen } = useOutletContext()
  return <PhilosophersLesson philosopherFlashcards={philosopherFlashcardsOnly} onMarkFlashSeen={markFlashSeen} />
}
