/**
 * Κατάλογος περιεχομένου για το routing: ποια μαθήματα έχουν περιεχόμενο και ποιες units / topics /
 * έγγραφα υπάρχουν. Όλα προκύπτουν από ρητά δεδομένα του content/ — ποτέ από pathname.
 */
import { course as psd115Course } from '../../../content/courses/psd115/course.js'
import { topics as psd115Topics } from '../../../content/courses/psd115/topics.js'
import { sources as psd115Sources } from '../../../content/courses/psd115/sources.js'

const CONTENT_COURSES = Object.freeze({
  psd115: { course: psd115Course, topics: psd115Topics, docs: psd115Sources },
})

export const contentCourseIds = () => Object.keys(CONTENT_COURSES)
export const getContentCourse = (courseId) => (Object.hasOwn(CONTENT_COURSES, courseId) ? CONTENT_COURSES[courseId] : null)
export const getUnit = (courseId, unitId) => getContentCourse(courseId)?.course.units.find((u) => u.id === unitId) ?? null
export const getTopic = (courseId, topicId) => getContentCourse(courseId)?.topics.find((t) => t.id === topicId) ?? null
export const getDoc = (courseId, docId) => getContentCourse(courseId)?.docs.find((d) => d.id === docId) ?? null
export const getUnitTopics = (courseId, unitId) => getContentCourse(courseId)?.topics.filter((t) => t.unit === unitId) ?? []

const TOPIC_ID_RE = /^[a-z0-9][a-z0-9-]*$/

/**
 * Έλεγχος του ρητού πίνακα θεμάτων ενός μαθήματος.
 * @param {{ course: { id: string, units: { id: string }[] }, topics: { id: string, unit: string, legacySlug: string }[],
 *           unitSlugs: Record<string, string[]> }} input  unitSlugs = τα slugs που υπάρχουν στο περιεχόμενο κάθε unit
 * @returns {string[]} σφάλματα (κενό = έγκυρο)
 */
export function checkTopicMap({ course, topics, unitSlugs }) {
  const errors = []
  const unitIds = new Set(course.units.map((u) => u.id))
  const ids = new Set()
  const paths = new Set()
  const covered = new Set()
  for (const t of topics) {
    const w = `topic «${t?.id}»`
    if (typeof t?.id !== 'string' || !TOPIC_ID_RE.test(t.id)) errors.push(`${w}: άκυρο id`)
    if (ids.has(t.id)) errors.push(`${w}: διπλό topicId`)
    ids.add(t.id)
    const canonical = `/${course.id}/topics/${t.id}`
    if (paths.has(canonical)) errors.push(`${w}: διπλό canonical path ${canonical}`)
    paths.add(canonical)
    if (!unitIds.has(t.unit)) errors.push(`${w}: χωρίς έγκυρη unit («${t.unit}»)`)
    else if (!(unitSlugs[t.unit] ?? []).includes(t.legacySlug)) errors.push(`${w}: χωρίς legacy αντιστοίχιση («${t.unit}/${t.legacySlug}»)`)
    const key = `${t.unit}/${t.legacySlug}`
    if (covered.has(key)) errors.push(`${w}: το ${key} αντιστοιχεί σε δύο topics`)
    covered.add(key)
  }
  for (const [unit, slugs] of Object.entries(unitSlugs)) {
    for (const slug of slugs) if (!covered.has(`${unit}/${slug}`)) errors.push(`θέμα ${unit}/${slug}: λείπει από τον πίνακα θεμάτων`)
  }
  return errors
}
