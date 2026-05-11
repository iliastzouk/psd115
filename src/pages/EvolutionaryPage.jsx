import { useOutletContext } from 'react-router-dom'
import EvolutionaryLesson from '../components/EvolutionaryLesson.jsx'

export default function EvolutionaryPage() {
  const { lessonResetKey, markFlashSeen, evolutionaryFlashcardsOnly } = useOutletContext()
  return (
    <EvolutionaryLesson
      key={lessonResetKey}
      evolutionaryFlashcards={evolutionaryFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
