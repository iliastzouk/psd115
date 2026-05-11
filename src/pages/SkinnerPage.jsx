import { useOutletContext } from 'react-router-dom'
import SkinnerLesson from '../components/SkinnerLesson.jsx'

export default function SkinnerPage() {
  const { lessonResetKey, markFlashSeen, skinnerFlashcardsOnly } = useOutletContext()
  return (
    <SkinnerLesson
      key={lessonResetKey}
      skinnerFlashcards={skinnerFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
