/**
 * Φάση 6c — η εφαρμογή ως εφαρμογή πολλών μαθημάτων: αρχική μαθημάτων στη `/`, επικεφαλίδα / footer / τίτλος με το όνομα
 * της εφαρμογής, μενού «Μαθήματα» / «Προηγούμενα», και καμία επίδραση στην πρόοδο ή στις σελίδες που δεν έχουν μάθημα
 * (αρχική, εξάμηνα, Not Found, παλιά redirects).
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_NAME, courseHeader, courseMenu } from '../src/layouts/courseNav.js'
import { courseHub } from '../src/core/routing/courseHub.js'
import { activeCourseId, courseUnits } from '../src/core/routing/navigation.js'
import { resolveLocation } from '../src/core/routing/resolve.js'
import { registry } from '../src/core/academic/data/index.js'
import { getContentCourse } from '../src/core/routing/catalog.js'
import { studyCourse } from '../src/core/study/session.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8')
const HUB_PAGE = 'src/pages/routing/CourseHubPage.jsx'
const at = (url) => {
  const [p, q = ''] = url.split('?')
  return resolveLocation(p, q && `?${q}`)
}

describe('όνομα εφαρμογής (Δ1)', () => {
  test('APP_NAME = «Exam Prep by Ilias Tzoukas»· τίτλος του browser ίδιος', () => {
    assert.equal(APP_NAME, 'Exam Prep by Ilias Tzoukas')
    assert.match(src('index.html'), /<title>Exam Prep by Ilias Tzoukas<\/title>/)
  })
  test('κανένα «<κωδικός> Exam Prep» στο src/ ή στο index.html (το όνομα δεν δένεται σε μάθημα)', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of [...walk(path.join(root, 'src')), path.join(root, 'index.html')]) {
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /PSD\d{3} Exam Prep|\{header\.code\} Exam Prep|code\} Exam Prep/, path.relative(root, f))
    }
  })
})

describe('επικεφαλίδα (courseHeader)', () => {
  test('χωρίς μάθημα: όνομα εφαρμογής, κανένας κωδικός, μόνο «Αρχική» → / (τα μαθήματα στο μενού)', () => {
    assert.deepEqual(courseHeader(null), { appName: APP_NAME, code: null, title: null, homePath: '/', nav: [{ to: '/', end: true, short: 'Αρχική', long: 'Αρχική' }] })
  })
  test('PSD115: αρχική του μαθήματος /psd115 και οι εβδομάδες του', () => {
    const h = courseHeader('psd115')
    assert.equal(h.appName, APP_NAME)
    assert.equal(h.code, 'PSD115')
    assert.equal(h.homePath, '/psd115')
    assert.deepEqual(h.nav[0], { to: '/psd115', end: true, short: 'Αρχική', long: 'Αρχική μαθήματος' })
    assert.deepEqual(h.nav.slice(1).map((n) => n.to), courseUnits('psd115').map((u) => u.path))
  })
  test('μάθημα χωρίς περιεχόμενο: κωδικός και τίτλος από το registry, καμία εβδομάδα', () => {
    const h = courseHeader('psd200')
    assert.deepEqual([h.code, h.homePath, h.nav.length], ['PSD200', '/psd200', 1])
  })
})

describe('σελίδες χωρίς μάθημα: αρχική, εξάμηνα, Not Found, παλιά redirects', () => {
  for (const url of ['/', '/terms/2026F', '/terms/2026S', '/nope', '/psd999', '/week/9', '/week/1', '/study/today?scope=term:2026F']) {
    test(`${url} → επικεφαλίδα της εφαρμογής· χωρίς υλικό, χωρίς καταγραφή, χωρίς επαναφορά μαθήματος`, () => {
      const id = activeCourseId(at(url))
      assert.equal(id, null)
      assert.equal(courseHeader(id).code, null)
      const course = studyCourse(id, () => true)
      assert.deepEqual([course.status, course.canRecord, course.courseId], ['no-content', false, null])
    })
  }
  test('Not Found ΜΕΣΑ σε μάθημα κρατά το μάθημα (επικεφαλίδα και εβδομάδες του)', () => {
    assert.equal(courseHeader(activeCourseId(at('/psd115/units/k9'))).code, 'PSD115')
    assert.equal(courseHeader(activeCourseId(at('/psd200/units/k1'))).code, 'PSD200')
  })
  test('τα παλιά redirects οδηγούν στις ίδιες διαδρομές του PSD115 (όχι στη /)', async () => {
    const { LEGACY_ROUTES } = await import('../src/core/routing/legacy.js')
    assert.equal(LEGACY_ROUTES.size, 69)
    for (const to of LEGACY_ROUTES.values()) assert.ok(to.startsWith('/psd115/') || to.startsWith('/study/'), to)
  })
  test('Not Found: το link της αρχικής οδηγεί στη λίστα μαθημάτων (/) και λέγεται «Μαθήματα»', () => {
    assert.match(src('src/pages/routing/NotFound.jsx'), /\{ to: '\/', label: 'Μαθήματα' \}/)
  })
})

describe('μενού (Δ4)', () => {
  const hub = courseHub(registry, (id) => Boolean(getContentCourse(id)))
  test('«Μαθήματα» = τρέχον εξάμηνο· «Προηγούμενα» = παλαιότερα εξάμηνα', () => {
    const menu = courseMenu(hub)
    assert.deepEqual(menu.map((s) => s.title), ['Μαθήματα', 'Προηγούμενα'])
    assert.deepEqual(menu[0].items.map((i) => i.to).sort(), ['/psd110', '/psd125', '/psd200', '/psd210', '/psd215'])
    assert.deepEqual(menu[1].items, [{ to: '/psd115', courseId: 'psd115', label: 'PSD115 — Ψυχολογία ΙΙ' }])
  })
  test('επόμενα εξάμηνα και μαθήματα χωρίς εξάμηνο → στα «Μαθήματα»· άδειες ενότητες δεν εμφανίζονται', () => {
    const menu = courseMenu({
      current: { termId: 'y' },
      sections: [
        { termId: 'z', role: 'upcoming', courses: [{ courseId: 'b', code: 'B', title: 'Bt', path: '/b' }] },
        { termId: null, role: 'unassigned', courses: [{ courseId: 'c', code: 'C', title: 'Ct', path: '/c' }] },
      ],
    })
    assert.deepEqual(menu, [{ title: 'Μαθήματα', items: [{ to: '/b', courseId: 'b', label: 'B — Bt' }, { to: '/c', courseId: 'c', label: 'C — Ct' }] }])
  })
})

describe('η αρχική δεν αγγίζει την πρόοδο ούτε εξαρτάται από συγκεκριμένο μάθημα', () => {
  test('App.jsx: η / αποδίδει την αρχική μαθημάτων· η /:courseId τη σελίδα του μαθήματος', () => {
    const app = src('src/App.jsx')
    assert.match(app, /<Route path="\/" element=\{<CourseHubPage \/>\} \/>/)
    assert.match(app, /<Route path="\/:courseId" element=\{<CoursePage \/>\} \/>/)
  })
  test('αρχική, courseHub, courseNav: κανένας κωδικός μαθήματος στον κώδικα', () => {
    for (const f of [HUB_PAGE, 'src/core/routing/courseHub.js', 'src/layouts/courseNav.js']) {
      assert.doesNotMatch(src(f), /['"`/]psd\d{3}|PSD\d{3}/, f)
    }
  })
  test('η σελίδα της αρχικής: καμία πρόοδος, storage ή backup', () => {
    const code = src(HUB_PAGE)
    assert.doesNotMatch(code, /useProgress|useCourseProgress|getProgressService|progressStore|studyProgressBackup|storeProgressService|localStorage|sessionStorage|useOutletContext/)
    assert.match(code, /appCourseHub\(\)/)
    assert.match(code, /COURSE_STATUS_LABEL/)
    assert.match(code, /COURSE_STATUS_NOTE/)
    assert.match(code, /data-testid="course-hub"/)
  })
  test('η αρχική δεν υπάρχει πια ως «αρχική του PSD115»: κανένα DEFAULT_COURSE_ID στο src/', () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of walk(path.join(root, 'src'))) assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /DEFAULT_COURSE_ID/, path.relative(root, f))
  })
})
