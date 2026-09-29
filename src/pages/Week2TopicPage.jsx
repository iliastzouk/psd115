import { useMemo } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { unitPath } from '../core/routing/paths.js'
import Week2TopicLesson from '../components/Week2TopicLesson.jsx'
import { getWeek2TopicBySlug } from '../../content/courses/psd115/units/k2/index.js'

/** @param {{ slug: string }} props — legacySlug του επιλυμένου topic (routing/psd115Ui.jsx) */
export default function Week2TopicPage({ slug }) {
  const topic = getWeek2TopicBySlug(slug ?? '')
  const { lessonResetKey, markFlashSeen, flashcards } = useOutletContext()

  const topicFlashcards = useMemo(
    () => (topic ? flashcards.filter((c) => c.categoryId === topic.categoryId) : []),
    [flashcards, topic],
  )

  if (!topic) return <Navigate to={unitPath('psd115', 'k2')} replace />

  return (
    <Week2TopicLesson
      key={`${lessonResetKey}-${topic.slug}`}
      topic={topic}
      topicFlashcards={topicFlashcards}
      onMarkFlashSeen={markFlashSeen}
    />
  )
}
