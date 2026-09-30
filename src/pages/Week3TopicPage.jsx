import { useMemo } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { unitPath } from '../core/routing/paths.js'
import Week3TopicLesson from '../components/Week3TopicLesson.jsx'
import { getWeek3TopicBySlug } from '../../content/courses/psd115/units/k3/index.js'

/** @param {{ slug: string }} props — legacySlug του επιλυμένου topic (routing/psd115Ui.jsx) */
export default function Week3TopicPage({ slug }) {
  const topic = getWeek3TopicBySlug(slug ?? '')
  const { lessonResetKey, markFlashSeen, flashcards } = useOutletContext()

  const topicFlashcards = useMemo(
    () => (topic ? flashcards.filter((c) => c.categoryId === topic.categoryId) : []),
    [flashcards, topic],
  )

  if (!topic) return <Navigate to={unitPath('psd115', 'k3')} replace />

  return (
    <Week3TopicLesson
      key={`${lessonResetKey}-${topic.slug}`}
      topic={topic}
      topicFlashcards={topicFlashcards}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
