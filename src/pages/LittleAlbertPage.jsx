import { useOutletContext } from 'react-router-dom'
import LittleAlbertLesson from '../components/LittleAlbertLesson.jsx'

export default function LittleAlbertPage() {
  const { lessonResetKey, markFlashSeen, littleAlbertFlashcardsOnly } = useOutletContext()
  return (
    <LittleAlbertLesson
      key={lessonResetKey}
      littleAlbertFlashcards={littleAlbertFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
