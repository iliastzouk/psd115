import { useMemo } from 'react'
import { Navigate, useOutletContext, useParams } from 'react-router-dom'
import Week3TopicLesson from '../components/Week3TopicLesson.jsx'
import { getWeek3TopicBySlug } from '../data/week3/index.js'

export default function Week3TopicPage() {
  const { slug } = useParams()
  const topic = getWeek3TopicBySlug(slug ?? '')
  const { lessonResetKey, markFlashSeen, flashcards } = useOutletContext()

  const topicFlashcards = useMemo(
    () => (topic ? flashcards.filter((c) => c.categoryId === topic.categoryId) : []),
    [flashcards, topic],
  )

  if (!topic) return <Navigate to="/week/3" replace />

  return (
    <Week3TopicLesson
      key={`${lessonResetKey}-${topic.slug}`}
      topic={topic}
      topicFlashcards={topicFlashcards}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
