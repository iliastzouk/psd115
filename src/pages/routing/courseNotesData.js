/**
 * Φορτώνει (στο build, μέσω Vite) όλα τα `content/courses/<courseId>/notes/*.md` ως κείμενο.
 */
import { groupCourseNotes } from './courseNotes.js'

const files = import.meta.glob('../../../content/courses/*/notes/*.md', { query: '?raw', import: 'default', eager: true })

const NOTES = groupCourseNotes(files)

/** @param {string} courseId */
export const getCourseNotes = (courseId) => (Object.hasOwn(NOTES, courseId) ? NOTES[courseId] : [])
