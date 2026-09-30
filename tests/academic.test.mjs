/**
 * Tests του academic registry (Phase 1A). Run: npm test
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { toGlobalId, parseGlobalId, isGlobalId } from '../src/core/academic/ids.js'
import {
  UNKNOWN,
  validateProgram,
  validateTerms,
  validateCourses,
  validateEnrollments,
  validateRegistry,
} from '../src/core/academic/schema.js'
import * as sel from '../src/core/academic/selectors.js'
import { registry } from '../src/core/academic/data/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const clone = (x) => structuredClone(x)

const course = (over = {}) => ({ id: 'psd999', code: 'PSD999', title: 'Τεστ', curriculumSemester: 3, kind: 'required', status: 'active', ...over })
const term = (over = {}) => ({ id: '2027S', label: 'Spring 2027', start: UNKNOWN, end: UNKNOWN, current: false, ...over })
const enr = (over = {}) => ({
  id: 'psd999@2027S',
  courseId: 'psd999',
  termId: '2027S',
  enrolledCode: 'PSD999',
  instructor: UNKNOWN,
  exams: [],
  status: 'in-progress',
  grade: null,
  ...over,
})
const mini = (enrollments, courses = [course()], terms = [term({ id: '2026F' }), term()]) => ({
  program: { id: 'p', name: 'Ψ', institution: 'X', totalSemesters: UNKNOWN },
  terms,
  courses,
  enrollments,
})

describe('Global IDs', () => {
  test('έγκυρο global ID', () => {
    assert.equal(toGlobalId('psd115', 'q-w2-overview-1'), 'psd115/q-w2-overview-1')
    assert.deepEqual(parseGlobalId('psd115/fc-pavlov-1'), { courseId: 'psd115', localId: 'fc-pavlov-1' })
    assert.equal(isGlobalId('psd115/exam-def-dev'), true)
  })
  test('άκυρο global ID', () => {
    for (const g of ['', 'q-w2-overview-1', 'PSD115/q-1', 'psd115/', '/q-1', 'psd115/ q', 'psd 115/q', 42, null]) {
      assert.equal(isGlobalId(g), false, String(g))
    }
    assert.throws(() => toGlobalId('PSD115', 'q-1'))
    assert.throws(() => toGlobalId('psd115', ''))
  })
  test('σταθερό namespace μαθήματος: χωρίς term/έτος', () => {
    for (const e of registry.enrollments) {
      const g = toGlobalId(e.courseId, 'q-1')
      assert.ok(!g.includes(e.termId), g)
    }
  })
  test('τα υπάρχοντα local IDs μένουν αυτούσια', async () => {
    const { flashcards, quizQuestions, CATEGORIES } = await import('../content/courses/psd115/questions.js')
    const ids = [...flashcards, ...quizQuestions, ...CATEGORIES].map((x) => x.id)
    assert.ok(ids.length > 400)
    for (const id of ids) assert.equal(parseGlobalId(toGlobalId('psd115', id)).localId, id)
  })
})

describe('Program', () => {
  test('έγκυρο program / unknown totalSemesters', () => {
    assert.deepEqual(validateProgram(registry.program), [])
    assert.equal(registry.program.totalSemesters, UNKNOWN)
    assert.deepEqual(validateProgram({ ...registry.program, totalSemesters: 8 }), [])
  })
  test('κακοσχηματισμένο program απορρίπτεται', () => {
    for (const bad of [null, {}, { ...registry.program, name: '' }, { ...registry.program, totalSemesters: 0 }, { ...registry.program, totalSemesters: null }, { ...registry.program, totalSemesters: '8' }]) {
      assert.ok(validateProgram(bad).length > 0, JSON.stringify(bad))
    }
  })
})

describe('Terms', () => {
  test('έγκυρο term, και με unknown ημερομηνίες', () => {
    assert.deepEqual(validateTerms([term()]), [])
    assert.deepEqual(validateTerms([term({ start: '2027-01-20', end: '2027-05-30' })]), [])
  })
  test('διπλό term απορρίπτεται', () => {
    assert.ok(validateTerms([term(), term()]).some((e) => e.includes('διπλό')))
  })
  test('άκυρη ημερομηνία / άκυρο ID απορρίπτονται', () => {
    for (const t of [term({ start: '2027-02-30' }), term({ end: '20-01-2027' }), term({ start: '' }), term({ start: null }), term({ id: '2026F-x' }), term({ id: 'F2026' })]) {
      assert.ok(validateTerms([t]).length > 0, JSON.stringify(t))
    }
  })
  test('start μετά το end απορρίπτεται', () => {
    assert.ok(validateTerms([term({ start: '2027-06-01', end: '2027-01-01' })]).length > 0)
  })
  test('το πολύ ένα current term', () => {
    const errs = validateTerms([term({ id: '2026F', current: true }), term({ current: true })])
    assert.ok(errs.some((e) => e.includes('το πολύ ένα')))
  })
  test('η σειρά του πίνακα πρέπει να συμφωνεί με γνωστές ημερομηνίες', () => {
    const later = term({ id: '2027F', start: '2027-09-01' })
    const earlier = term({ id: '2027S', start: '2027-01-20' })
    assert.deepEqual(validateTerms([earlier, later]), [])
    assert.ok(validateTerms([later, earlier]).length > 0)
  })
})

describe('Courses', () => {
  test('έγκυρο υποχρεωτικό / επιλογής / unknown εξάμηνο', () => {
    assert.deepEqual(validateCourses([course()]), [])
    assert.deepEqual(validateCourses([course({ kind: 'elective', curriculumSemester: null })]), [])
    assert.deepEqual(validateCourses([course({ kind: UNKNOWN, curriculumSemester: UNKNOWN })]), [])
  })
  test('null εξάμηνο μόνο σε ρητά elective (null ≠ unknown)', () => {
    assert.ok(validateCourses([course({ kind: 'required', curriculumSemester: null })]).length > 0)
    assert.ok(validateCourses([course({ kind: UNKNOWN, curriculumSemester: null })]).length > 0)
  })
  test('εξάμηνο εκτός ορίων προγράμματος απορρίπτεται', () => {
    assert.ok(validateCourses([course({ curriculumSemester: 9 })], { totalSemesters: 8 }).length > 0)
    assert.ok(validateCourses([course({ curriculumSemester: 0 })]).length > 0)
  })
  test('διπλό course ID / διπλός κωδικός απορρίπτονται', () => {
    assert.ok(validateCourses([course(), course({ code: 'PSD998' })]).some((e) => e.includes('courses.id')))
    assert.ok(validateCourses([course(), course({ id: 'psd998' })]).some((e) => e.includes('courses.code')))
    assert.ok(
      validateCourses([course({ alternateCodes: ['PSD998'] }), course({ id: 'psd998', code: 'PSD998' })]).some((e) => e.includes('courses.code')),
      'εναλλακτικός κωδικός που συγκρούεται με άλλο μάθημα',
    )
  })
  test('PSD124 είναι εναλλακτικός κωδικός του psd125, όχι ξεχωριστό μάθημα', () => {
    assert.equal(sel.getCourseById(registry, 'psd124'), null)
    assert.equal(sel.getCourseByCode(registry, 'PSD124').id, 'psd125')
    assert.equal(registry.courses.filter((c) => c.title === 'Κοινωνική Ψυχολογία').length, 1)
  })
})

describe('Enrollments', () => {
  const v = (list, courses, terms) => {
    const r = mini(list, courses, terms)
    return validateEnrollments(r.enrollments, r)
  }
  test('έγκυρη εγγραφή', () => {
    assert.deepEqual(v([enr({ exams: [{ kind: 'final', date: '2027-06-10', time: '18:00-20:30', scope: UNKNOWN }] })]), [])
  })
  test('άγνωστο term επιτρέπεται ρητά· ανύπαρκτο term όχι', () => {
    assert.deepEqual(v([enr({ termId: UNKNOWN })]), [])
    assert.ok(v([enr({ termId: '2019F' })]).length > 0)
    assert.ok(v([enr({ termId: null })]).length > 0, 'null δεν σημαίνει unknown')
  })
  test('ανύπαρκτο μάθημα απορρίπτεται', () => {
    assert.ok(v([enr({ courseId: 'psd000' })]).some((e) => e.includes('ανύπαρκτο μάθημα')))
  })
  test('διπλό enrollment ID απορρίπτεται', () => {
    assert.ok(v([enr(), enr({ termId: '2026F' })]).some((e) => e.includes('διπλό')))
  })
  test('επανάληψη (retake): δύο εγγραφές ίδιου μαθήματος σε διαφορετικά terms', () => {
    const list = [enr({ id: 'a', termId: '2026F', status: 'failed', grade: UNKNOWN, instructor: 'Α' }), enr({ id: 'b', instructor: 'Β' })]
    assert.deepEqual(v(list), [])
    const r = mini(list)
    assert.deepEqual(sel.getEnrollmentsForCourse(r, 'psd999').map((e) => e.id), ['a', 'b'])
  })
  test('grade: null ↔ δεν εκδόθηκε· unknown ↔ δεν επιβεβαιώθηκε', () => {
    assert.ok(v([enr({ status: 'in-progress', grade: 'A' })]).length > 0, 'βαθμός σε μάθημα σε εξέλιξη')
    assert.ok(v([enr({ status: 'passed', grade: null })]).length > 0, 'passed χωρίς βαθμό')
    assert.deepEqual(v([enr({ status: 'passed', grade: UNKNOWN })]), [])
    assert.deepEqual(v([enr({ status: 'passed', grade: 'B+' })]), [])
    assert.deepEqual(v([enr({ status: UNKNOWN, grade: UNKNOWN })]), [])
    assert.ok(v([enr({ status: UNKNOWN, grade: null })]).length > 0, 'status unknown με grade null')
  })
  test('enrolledCode: κωδικός του μαθήματος, εναλλακτικός, ή unknown', () => {
    const c = [course({ alternateCodes: ['PSD998'] })]
    assert.deepEqual(v([enr({ enrolledCode: 'PSD998' })], c), [])
    assert.deepEqual(v([enr({ enrolledCode: UNKNOWN })], c), [])
    assert.ok(v([enr({ enrolledCode: 'PSD111' })], c).length > 0)
  })
  test('άκυρη δομή εξετάσεων απορρίπτεται', () => {
    for (const exams of [null, {}, [{ kind: 'quiz', date: UNKNOWN, time: UNKNOWN, scope: UNKNOWN }], [{ kind: 'final', date: '2027-13-01', time: UNKNOWN, scope: UNKNOWN }], [{ kind: 'final', date: UNKNOWN, time: '6pm', scope: UNKNOWN }]]) {
      assert.ok(v([enr({ exams })]).length > 0, JSON.stringify(exams))
    }
  })
})

describe('Selectors', () => {
  test('τρέχον term: μόνο το ρητά δηλωμένο, αλλιώς null', () => {
    assert.equal(sel.getCurrentTerm(registry).id, '2026F')
    assert.equal(sel.getCurrentTerm({ ...registry, terms: registry.terms.map((t) => ({ ...t, current: false })) }), null)
  })
  test('αναζήτηση μαθήματος', () => {
    assert.equal(sel.getCourseById(registry, 'psd200').code, 'PSD200')
    assert.equal(sel.getCourseById(registry, 'nope'), null)
    assert.deepEqual(sel.getCourses(registry, { curriculumSemester: 3 }).map((c) => c.id).sort(), ['psd200', 'psd210', 'psd215'])
  })
  test('εγγραφές μαθήματος / term', () => {
    assert.deepEqual(sel.getEnrollmentsForCourse(registry, 'psd115').map((e) => e.id), ['psd115@2026S'])
    assert.equal(sel.getEnrollments(registry, { termId: '2026F' }).length, 5)
  })
  test('ολοκληρωμένα vs εκκρεμή vs χωρίς επιβεβαίωση (τρέχοντα δεδομένα)', () => {
    assert.deepEqual(sel.getCompletedCourses(registry), [])
    assert.deepEqual(sel.getOutstandingCourses(registry).map((c) => c.id).sort(), ['psd110', 'psd125', 'psd200', 'psd210', 'psd215'])
    assert.deepEqual(sel.getUnconfirmedCourses(registry).map((c) => c.id), ['psd115'], 'PSD115: ούτε πέρασε ούτε χρωστιέται')
  })
  test('«υπάρχει στον κατάλογο» ≠ «εκκρεμεί»', () => {
    const r = mini([], [course()])
    assert.equal(sel.getCourseStanding(r, 'psd999'), 'none')
    assert.deepEqual(sel.getOutstandingCourses(r), [])
  })
  test('passed υπερισχύει μιας παλιότερης failed· withdrawn μόνο του δεν εκκρεμεί', () => {
    const r = mini([enr({ id: 'a', termId: '2026F', status: 'failed', grade: UNKNOWN }), enr({ id: 'b', status: 'passed', grade: UNKNOWN })])
    assert.equal(sel.getCourseStanding(r, 'psd999'), 'completed')
    const w = mini([enr({ status: 'withdrawn', grade: null })])
    assert.equal(sel.getCourseStanding(w, 'psd999'), 'none')
    const f = mini([enr({ status: 'failed', grade: UNKNOWN })])
    assert.equal(sel.getCourseStanding(f, 'psd999'), 'outstanding')
  })
  test('οι selectors δεν αλλάζουν το registry', () => {
    const before = clone(registry)
    sel.getEnrollmentsForCourse(registry, 'psd110')
    sel.getOutstandingCourses(registry)
    sel.getCourses(registry, { kind: UNKNOWN })
    assert.deepEqual(registry, before)
  })
})

describe('Registry data', () => {
  test('ολόκληρο το registry είναι έγκυρο', () => {
    assert.deepEqual(validateRegistry(registry), { ok: true, errors: [] })
  })
  test('καμία μαντεψιά: τα μη επιβεβαιωμένα είναι ρητά unknown', () => {
    assert.equal(registry.program.totalSemesters, UNKNOWN)
    for (const c of registry.courses) assert.equal(c.kind, UNKNOWN, c.id)
    const e = Object.fromEntries(registry.enrollments.map((x) => [x.id, x]))
    assert.equal(e['psd115@2026S'].status, UNKNOWN)
    assert.equal(e['psd115@2026S'].grade, UNKNOWN)
    assert.equal(e['psd125@2026F'].enrolledCode, UNKNOWN)
    assert.equal(e['psd125@2026F'].exams, UNKNOWN)
    for (const id of ['psd200@2026F', 'psd210@2026F', 'psd215@2026F']) assert.equal(e[id].instructor, UNKNOWN, id)
    for (const t of registry.terms) assert.deepEqual([t.start, t.end], [UNKNOWN, UNKNOWN], t.id)
    // Δεν υπάρχουν επινοημένες προηγούμενες προσπάθειες PSD110/PSD125.
    assert.equal(sel.getEnrollmentsForCourse(registry, 'psd110').length, 1)
    assert.equal(sel.getEnrollmentsForCourse(registry, 'psd125').length, 1)
  })
})

describe('Isolation', () => {
  test('το registry δεν αγγίζει localStorage (psd115-* / study-progress-*)', async () => {
    const touched = []
    const trap = new Proxy({}, { get: (_t, k) => (touched.push(String(k)), () => null) })
    const prev = globalThis.localStorage
    globalThis.localStorage = trap
    try {
      validateRegistry(registry)
      sel.getOutstandingCourses(registry)
      sel.getCurrentTerm(registry)
    } finally {
      if (prev === undefined) delete globalThis.localStorage
      else globalThis.localStorage = prev
    }
    assert.deepEqual(touched, [])
  })

  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))

  test('το registry δεν εισάγει το progress layer ή browser storage', () => {
    for (const f of walk(path.join(root, 'src/core/academic'))) {
      const src = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(src, /localStorage|utils\/storage|core\/progress|useStudySession|from 'react/, path.relative(root, f))
    }
  })

  // Phase 1A guard: η εφαρμογή ΔΕΝ καταναλώνει ακόμα το registry. Αφαιρείται όταν γίνει η σύνδεση (Phase 1C).
  test('μόνο το routing/term surface εισάγει το src/core/academic· κανένα component μελέτης/περιεχομένου/προόδου', () => {
    const allowed = [
      `${path.sep}core${path.sep}academic${path.sep}`,
      `${path.sep}core${path.sep}routing${path.sep}`,
      `${path.sep}pages${path.sep}routing${path.sep}`,
    ]
    const appFiles = walk(path.join(root, 'src')).filter((f) => !allowed.some((a) => f.includes(a)))
    assert.ok(appFiles.length > 20)
    for (const f of appFiles) {
      assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /core\/academic/, path.relative(root, f))
    }
  })
})
