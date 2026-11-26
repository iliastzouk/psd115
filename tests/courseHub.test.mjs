/**
 * Φάση 6c — δεδομένα της αρχικής μαθημάτων (src/core/routing/courseHub.js): pure, γενικά, χωρίς κανένα μάθημα στον
 * κώδικα. Τα εξάμηνα, τα μαθήματα και οι εγγραφές έρχονται από το registry· η διαθεσιμότητα ΜΟΝΟ από τον κατάλογο
 * περιεχομένου (`hasContent`). «Υπάρχει υλικό μελέτης» = καταχωρισμένο περιεχόμενο, ΟΧΙ πληρότητα / ετοιμότητα.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COURSE_STATUS_LABEL, COURSE_STATUS_NOTE, courseHub } from '../src/core/routing/courseHub.js'
import { registry } from '../src/core/academic/data/index.js'
import { getContentCourse } from '../src/core/routing/catalog.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const UNKNOWN = 'unknown'
const course = (id, code = id.toUpperCase(), title = `Τίτλος ${id}`) => ({ id, code, title })
const enr = (courseId, termId, exams = UNKNOWN) => ({ id: `${courseId}@${termId}`, courseId, termId, exams })
const final = (date) => [{ kind: 'final', date }]

/** Συνθετικό registry: κανένα πραγματικό μάθημα. */
function synthetic({ current = 'y' } = {}) {
  return {
    terms: [
      { id: 'x', label: 'Term X', current: current === 'x' },
      { id: 'y', label: 'Term Y', current: current === 'y' },
      { id: 'z', label: 'Term Z', current: current === 'z' },
    ],
    courses: [course('demo-a'), course('demo-b'), course('demo-c'), course('demo-d'), course('demo-lone')],
    enrollments: [
      enr('demo-a', 'x'),
      enr('demo-b', 'y', final('2027-01-20')),
      enr('demo-c', 'y', final(UNKNOWN)),
      enr('demo-a', 'y'),
      enr('demo-d', 'z', [{ kind: 'midterm', date: '2027-03-01' }]),
      enr('ghost', 'y'),
    ],
  }
}
const withContent = (...ids) => (id) => ids.includes(id)
const ids = (section) => section.courses.map((c) => c.courseId)

describe('courseHub · συνθετικό registry (κανένα πραγματικό μάθημα)', () => {
  test('πρώτα το τρέχον εξάμηνο, μετά τα επόμενα (αύξουσα σειρά), μετά τα προηγούμενα (νεότερο πρώτο)', () => {
    const hub = courseHub(synthetic({ current: 'y' }), withContent())
    assert.deepEqual(hub.sections.map((s) => [s.termId, s.role]), [['y', 'current'], ['z', 'upcoming'], ['x', 'past'], [null, 'unassigned']])
    assert.equal(hub.sections[0].label, 'Term Y')
  })
  test('μαθήματα με τη σειρά των εγγραφών του registry· εγγραφή σε μάθημα εκτός registry → αγνοείται', () => {
    const hub = courseHub(synthetic(), withContent())
    assert.deepEqual(ids(hub.sections[0]), ['demo-b', 'demo-c', 'demo-a'])
    assert.ok(!hub.sections.flatMap(ids).includes('ghost'))
  })
  test('μάθημα σε δύο εξάμηνα → εμφανίζεται και στα δύο', () => {
    const hub = courseHub(synthetic(), withContent())
    assert.ok(ids(hub.sections.find((s) => s.termId === 'x')).includes('demo-a'))
    assert.ok(ids(hub.sections.find((s) => s.termId === 'y')).includes('demo-a'))
  })
  test('μάθημα χωρίς καμία εγγραφή → ξεχωριστή ενότητα «χωρίς εξάμηνο», στο τέλος', () => {
    const hub = courseHub(synthetic(), withContent())
    const last = hub.sections.at(-1)
    assert.deepEqual([last.termId, last.role, ids(last)], [null, 'unassigned', ['demo-lone']])
  })
  test('χωρίς τρέχον εξάμηνο → κανένα «current»· όλα τα εξάμηνα, νεότερο πρώτο', () => {
    const reg = synthetic({ current: null })
    const hub = courseHub(reg, withContent())
    assert.deepEqual(hub.sections.filter((s) => s.termId).map((s) => [s.termId, s.role]), [['z', 'term'], ['y', 'term'], ['x', 'term']])
    assert.equal(hub.current, null)
  })
  test('εξάμηνο χωρίς εγγραφές → δεν εμφανίζεται', () => {
    const reg = synthetic()
    reg.enrollments = reg.enrollments.filter((e) => e.termId !== 'z')
    assert.ok(!courseHub(reg, withContent()).sections.some((s) => s.termId === 'z'))
  })
  test('κατάσταση ΜΟΝΟ από τον κατάλογο περιεχομένου: has-content / no-content', () => {
    const hub = courseHub(synthetic(), withContent('demo-c'))
    const byId = Object.fromEntries(hub.sections[0].courses.map((c) => [c.courseId, c.status]))
    assert.deepEqual(byId, { 'demo-b': 'no-content', 'demo-c': 'has-content', 'demo-a': 'no-content' })
  })
  test('εγγραφή μαθήματος: κωδικός, τίτλος, διαδρομή /:courseId, τελική εξέταση μόνο με έγκυρη γνωστή ημερομηνία', () => {
    const hub = courseHub(synthetic(), withContent())
    const [b, c, a] = hub.sections[0].courses
    assert.deepEqual(b, { courseId: 'demo-b', code: 'DEMO-B', title: 'Τίτλος demo-b', status: 'no-content', path: '/demo-b', examDate: '2027-01-20' })
    assert.equal(c.examDate, null, 'άγνωστη ημερομηνία')
    assert.equal(a.examDate, null, 'χωρίς εξετάσεις (unknown)')
    assert.equal(hub.sections.find((s) => s.termId === 'z').courses[0].examDate, null, 'μόνο η τελική εξέταση')
  })
  test('ούτε το registry ούτε τα αποτελέσματα αλλάζουν· το αποτέλεσμα είναι frozen', () => {
    const reg = synthetic()
    const before = JSON.stringify(reg)
    const hub = courseHub(reg, withContent('demo-a'))
    assert.equal(JSON.stringify(reg), before)
    assert.ok(Object.isFrozen(hub) && Object.isFrozen(hub.sections) && Object.isFrozen(hub.sections[0].courses[0]))
  })
})

describe('courseHub · πραγματικό registry', () => {
  const hub = courseHub(registry, (id) => Boolean(getContentCourse(id)))
  test('Fall 2026 (τρέχον) πρώτα, με τα 5 μαθήματά του· μετά Spring 2026 (προηγούμενο) με το PSD115', () => {
    assert.deepEqual(hub.sections.map((s) => [s.termId, s.role]), [['2026F', 'current'], ['2026S', 'past']])
    assert.deepEqual(ids(hub.sections[0]).sort(), ['psd110', 'psd125', 'psd200', 'psd210', 'psd215'])
    assert.deepEqual(ids(hub.sections[1]), ['psd115'])
    assert.equal(hub.current.termId, '2026F')
  })
  test('κατάσταση: υλικό μόνο όπου υπάρχει περιεχόμενο στον κατάλογο (σήμερα μόνο το PSD115)', () => {
    for (const c of hub.sections.flatMap((s) => s.courses)) assert.equal(c.status, getContentCourse(c.courseId) ? 'has-content' : 'no-content', c.courseId)
    assert.equal(hub.sections[1].courses[0].status, 'has-content')
  })
})

describe('κείμενα κατάστασης: ύπαρξη υλικού, ΟΧΙ πληρότητα', () => {
  test('ετικέτες και υποσημείωση', () => {
    assert.deepEqual(COURSE_STATUS_LABEL, { 'has-content': 'Υπάρχει υλικό μελέτης', 'no-content': 'Υλικό σε προετοιμασία' })
    assert.match(COURSE_STATUS_NOTE, /δεν σημαίνει ότι/)
  })
  test('κανένα κείμενο της αρχικής δεν υπονοεί πληρότητα ή ετοιμότητα', () => {
    const texts = [...Object.values(COURSE_STATUS_LABEL)]
    for (const t of texts) assert.doesNotMatch(t, /ολοκληρ|πλήρ|έτοιμ|Διαθέσιμ/i, t)
  })
  test('το module δεν περιέχει κωδικό ή id μαθήματος', () => {
    const code = fs.readFileSync(path.join(root, 'src/core/routing/courseHub.js'), 'utf8')
    assert.doesNotMatch(code, /psd\d{3}/i)
    for (const c of registry.courses) assert.ok(!code.includes(c.id) && !code.includes(c.code), c.id)
  })
})
