import { useOutletContext } from 'react-router-dom'
import NeuroscienceLesson from '../components/NeuroscienceLesson.jsx'

export default function NeurosciencePage() {
  const { lessonResetKey, markFlashSeen, neuroscienceFlashcardsOnly } = useOutletContext()
  return (
    <NeuroscienceLesson
      key={lessonResetKey}
      neuroscienceFlashcards={neuroscienceFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
