/**
 * Λίστα διαδρομών του snapshot σελίδων (Φάση 6d, Δ3), από τον κατάλογο περιεχομένου με σταθερή σειρά: αρχική μαθημάτων,
 * αρχική του μαθήματος, units (κατά `order`), θέματα (σειρά του καταλόγου), εργαλεία μελέτης, έγγραφα, πρόοδος.
 * Pure: χρησιμοποιείται από το scripts/snapshot-pages.mjs και από το tests/pageSnapshot.test.mjs.
 */
import { getContentCourse } from '../src/core/routing/catalog.js'
import * as P from '../src/core/routing/paths.js'

export const SNAPSHOT_TOOLS = Object.freeze(['quiz', 'flashcards', 'exam', 'review'])

/** @param {string} courseId @returns {string[]} */
export function snapshotRoutes(courseId) {
  const entry = getContentCourse(courseId)
  if (!entry) throw new Error(`Κανένα περιεχόμενο για ${courseId}`)
  const units = [...entry.course.units].sort((a, b) => a.order - b.order)
  const r = ['/', P.coursePath(courseId)]
  for (const u of units) r.push(P.unitPath(courseId, u.id))
  for (const t of entry.topics) r.push(P.topicPath(courseId, t.id))
  r.push(P.studyPath('quiz', courseId))
  for (const u of units) for (const tool of SNAPSHOT_TOOLS) r.push(P.studyPath(tool, `unit:${courseId}/${u.id}`))
  for (const d of entry.docs) r.push(P.documentPath(courseId, d.id))
  r.push(P.progressPath(courseId))
  for (const u of units) r.push(P.progressPath(`unit:${courseId}/${u.id}`))
  return r
}
