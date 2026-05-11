import { useOutletContext } from 'react-router-dom'
import OtherBranchesLesson from '../components/OtherBranchesLesson.jsx'

export default function OtherBranchesPage() {
  const { lessonResetKey, markFlashSeen, otherBranchesFlashcardsOnly } = useOutletContext()
  return (
    <OtherBranchesLesson
      key={lessonResetKey}
      otherBranchesFlashcards={otherBranchesFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
