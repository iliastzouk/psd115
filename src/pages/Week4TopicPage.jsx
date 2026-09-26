import { useMemo } from 'react'
import { Navigate, useOutletContext, useParams } from 'react-router-dom'
import Week4TopicLesson from '../components/Week4TopicLesson.jsx'
import { getWeek4TopicBySlug } from '../data/week4/index.js'

export default function Week4TopicPage() {
  const { slug } = useParams()
  const topic = getWeek4TopicBySlug(slug ?? '')
  const { lessonResetKey, markFlashSeen, flashcards } = useOutletContext()

  const topicFlashcards = useMemo(
    () => (topic ? flashcards.filter((c) => c.categoryId === topic.categoryId) : []),
    [flashcards, topic],
  )

  if (!topic) return <Navigate to="/week/4" replace />

  return (
    <Week4TopicLesson
      key={`${lessonResetKey}-${topic.slug}`}
      topic={topic}
      topicFlashcards={topicFlashcards}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
