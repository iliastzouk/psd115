import { useMemo } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { unitPath } from '../core/routing/paths.js'
import Week4TopicLesson from '../components/Week4TopicLesson.jsx'
import { getWeek4TopicBySlug } from '../../content/courses/psd115/units/k4/index.js'

/** @param {{ slug: string }} props — legacySlug του επιλυμένου topic (routing/psd115Ui.jsx) */
export default function Week4TopicPage({ slug }) {
  const topic = getWeek4TopicBySlug(slug ?? '')
  const { lessonResetKey, markFlashSeen, flashcards } = useOutletContext()

  const topicFlashcards = useMemo(
    () => (topic ? flashcards.filter((c) => c.categoryId === topic.categoryId) : []),
    [flashcards, topic],
  )

  if (!topic) return <Navigate to={unitPath('psd115', 'k4')} replace />

  return (
    <Week4TopicLesson
      key={`${lessonResetKey}-${topic.slug}`}
      topic={topic}
      topicFlashcards={topicFlashcards}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
