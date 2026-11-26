/**
 * Σημειώσεις μαθημάτων (content/courses/<courseId>/notes/*.md). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseNote, groupCourseNotes } from '../src/pages/routing/courseNotes.js'
import { registry } from '../src/core/academic/data/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const P = (course, file) => `../../../content/courses/${course}/notes/${file}`

/** Όλα τα αρχεία σημειώσεων στον δίσκο, με τη μορφή διαδρομής που δίνει το import.meta.glob. */
function filesOnDisk() {
  const files = {}
  const coursesDir = path.join(root, 'content/courses')
  for (const course of fs.readdirSync(coursesDir)) {
    const dir = path.join(coursesDir, course, 'notes')
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.md')) files[P(course, f)] = fs.readFileSync(path.join(dir, f), 'utf8')
  }
  return files
}

describe('courseNotes', () => {
  test('parseNote: courseId, id, καθαρός τίτλος, σώμα χωρίς τον τίτλο', () => {
    const n = parseNote(P('psd999', '01-intro.md'), '# PSD999 · 1η Συνάντηση — Σημειώσεις\n\n## Α\nκείμενο\n')
    assert.deepEqual(n, { courseId: 'psd999', id: '01-intro', title: '1η Συνάντηση', body: '## Α\nκείμενο' })
  })
  test('parseNote: CRLF, BOM και backslashes (Windows)', () => {
    const n = parseNote('C:\\x\\content\\courses\\psd999\\notes\\02-b.md', '\uFEFF# Τίτλος\r\n\r\nσώμα\r\n')
    assert.deepEqual([n.courseId, n.id, n.title, n.body], ['psd999', '02-b', 'Τίτλος', 'σώμα'])
  })
  test('parseNote: απορρίπτει αρχείο χωρίς τίτλο ή σε λάθος διαδρομή', () => {
    assert.throws(() => parseNote(P('psd999', 'a.md'), 'χωρίς τίτλο'))
    assert.throws(() => parseNote('../../../content/courses/psd999/a.md', '# Τ\n'))
    assert.throws(() => parseNote(P('psd999', 'Bad Name.md'), '# Τ\n'))
  })
  test('groupCourseNotes: ανά μάθημα, ταξινόμηση κατά id', () => {
    const g = groupCourseNotes({ [P('psd999', '02-b.md')]: '# Β\n', [P('psd999', '01-a.md')]: '# Α\n', [P('psd888', '01-x.md')]: '# Χ\n' })
    assert.deepEqual(g.psd999.map((n) => n.title), ['Α', 'Β'])
    assert.deepEqual(g.psd888.map((n) => n.id), ['01-x'])
  })

  test('τα πραγματικά αρχεία: έγκυρα, μόνο για μαθήματα του registry, με περιεχόμενο', () => {
    const g = groupCourseNotes(filesOnDisk())
    assert.ok((g.psd215 ?? []).length >= 2, 'σημειώσεις PSD215')
    const courseIds = new Set(registry.courses.map((c) => c.id))
    for (const [courseId, notes] of Object.entries(g)) {
      assert.ok(courseIds.has(courseId), `άγνωστο μάθημα ${courseId}`)
      for (const n of notes) {
        assert.ok(n.title.length > 0 && !n.title.includes('PSD'), `${courseId}/${n.id}: τίτλος «${n.title}»`)
        assert.match(n.body, /^## /m, `${courseId}/${n.id}: χωρίς ενότητες ##`)
      }
    }
  })
})
