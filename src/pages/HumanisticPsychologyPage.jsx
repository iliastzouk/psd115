import { useOutletContext } from 'react-router-dom'
import HumanisticPsychologyLesson from '../components/HumanisticPsychologyLesson.jsx'

export default function HumanisticPsychologyPage() {
  const { lessonResetKey, markFlashSeen, humanisticFlashcardsOnly } = useOutletContext()
  return (
    <HumanisticPsychologyLesson
      key={lessonResetKey}
      humanisticFlashcards={humanisticFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
