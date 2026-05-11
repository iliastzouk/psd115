import { useOutletContext } from 'react-router-dom'
import SocialPsychologyLesson from '../components/SocialPsychologyLesson.jsx'

export default function SocialPsychologyPage() {
  const { lessonResetKey, markFlashSeen, socialPsychologyFlashcardsOnly } = useOutletContext()
  return (
    <SocialPsychologyLesson
      key={lessonResetKey}
      socialPsychologyFlashcards={socialPsychologyFlashcardsOnly}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
