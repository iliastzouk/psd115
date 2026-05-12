import { useMemo } from 'react'
import { Navigate, useOutletContext, useParams } from 'react-router-dom'
import Week2TopicLesson from '../components/Week2TopicLesson.jsx'
import { getWeek2TopicBySlug } from '../data/week2/index.js'

export default function Week2TopicPage() {
  const { slug } = useParams()
  const topic = getWeek2TopicBySlug(slug ?? '')
  const { lessonResetKey, markFlashSeen, flashcards } = useOutletContext()

  const topicFlashcards = useMemo(
    () => (topic ? flashcards.filter((c) => c.categoryId === topic.categoryId) : []),
    [flashcards, topic],
  )

  if (!topic) return <Navigate to="/week/2" replace />

  return (
    <Week2TopicLesson
      key={`${lessonResetKey}-${topic.slug}`}
      topic={topic}
      topicFlashcards={topicFlashcards}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
