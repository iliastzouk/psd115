/**
 * Phase 1E-4b — ProgressService (legacy mode): ένα snapshot, καμία εγγραφή στο boot, ίδιες legacy εγγραφές,
 * degraded αντί για «μηδενικά», ένα reset key, guards.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { quizQuestions, flashcards } from '../content/courses/psd115/questions.js'
import { createProgressService, WRONG_BOOK_LIMIT } from '../src/core/progress/progressService.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { buildProgressSnapshot, legacyToSnapshot } from '../src/core/progress/snapshot.js'
import { resetStateKey } from '../src/core/progress/namespaces.js'
import { RESET_MARKER_KEY, MIGRATION_MARKER_KEY } from '../src/core/progress/keys.js'
import { buildLegacyBaseline } from '../src/core/progress/legacyBaseline.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'
import { resetProgressSafely } from '../src/utils/progressBackup.js'
import { STATE_KEY } from '../src/core/progress/progressStore.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8')).keys
const PROD = fixture('progress-export.production-2026-10-05.json')
const SAMPLE = fixture('progress-export.sample.json')

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init))
  const log = []
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      log.push(['set', k])
      m.set(k, String(v))
    },
    removeItem(k) {
      log.push(['remove', k])
      m.delete(k)
    },
    dump: () => Object.fromEntries(m),
    log,
  }
}

let uidN = 0
function boot(entries, opts = {}) {
  const storage = fakeStorage(entries)
  const service = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(storage), newUid: () => `uid-${++uidN}`, ...opts })
  return { storage, service, course: () => service.getSnapshot().courses.psd115 }
}
/** Ό,τι δείχνει το storage τώρα (runtime ανάγνωση) — πρέπει να ταυτίζεται με τη μνήμη του service. */
const storageView = (storage) => legacyToSnapshot(Object.fromEntries(Object.entries(storage.dump()).filter(([k]) => k.startsWith('psd115-') && !k.startsWith('psd115-backup-'))), { content, mode: 'runtime' })
const study = (storage) => JSON.parse(storage.getItem('psd115-w1-study'))

/** Το ΠΑΛΙΟ handleSelectOption (πριν το 1E-4b) ως pure reducer — αναφορά για την ισοδυναμία. */
function legacyAnswer(p, q, idx, uid) {
  const correct = idx === q.correctIndex
  const cat = q.categoryId
  const prev = p.byCategory[cat] || { correct: 0, wrong: 0 }
  const wrongBook = [...p.wrongBook]
  if (!correct) {
    wrongBook.push({ uid, id: q.id, categoryId: cat, question: q.question, explanation: q.explanation, userLabel: q.options[idx], correctLabel: q.options[q.correctIndex] })
    while (wrongBook.length > 60) wrongBook.shift()
  }
  return {
    ...p,
    quizAnswered: p.quizAnswered + 1,
    quizCorrect: p.quizCorrect + (correct ? 1 : 0),
    byCategory: { ...p.byCategory, [cat]: { ...prev, correct: prev.correct + (correct ? 1 : 0), wrong: prev.wrong + (correct ? 0 : 1) } },
    wrongBook,
  }
}
const answer = (service, q, idx) =>
  service.answerQuestion({
    questionId: q.id,
    ok: idx === q.correctIndex,
    wrong: { question: q.question, explanation: q.explanation, userLabel: q.options[idx], correctLabel: q.options[q.correctIndex] },
  })

describe('1E-4b · boot: σύγχρονη ανάγνωση, ΚΑΜΙΑ εγγραφή', () => {
  for (const [name, keys] of [['production', PROD], ['sample', SAMPLE], ['άδειο', {}]]) {
    test(name, () => {
      const { storage, service } = boot(keys)
      assert.equal(service.getSnapshot().status, 'ready')
      assert.deepEqual(storage.log, []) // ούτε setItem ούτε removeItem
      assert.deepEqual(storage.dump(), keys)
      assert.deepEqual(service.getSnapshot().courses.psd115, legacyToSnapshot(keys, { content, mode: 'runtime' }).snapshot)
    })
  }

  test('production: οι τιμές είναι ήδη εκεί (όχι μηδενικά)', () => {
    const s = boot(PROD).course()
    assert.equal(s.quizAnswered, 1)
    assert.equal(s.flashcardSeenIds.length, 21)
    assert.equal(s.wrongBook.length, 1)
    assert.equal(Object.keys(s.checklists).length, 10)
  })
})

describe('1E-4b · ένα snapshot (ταυτότητα, immutability, notify)', () => {
  test('getSnapshot() === getSnapshot() μέχρι την αλλαγή· μετά νέο αντικείμενο, το παλιό αμετάβλητο', () => {
    const { service } = boot(PROD)
    const a = service.getSnapshot()
    assert.equal(service.getSnapshot(), a)
    const frozen = JSON.stringify(a)
    assert.ok(Object.isFrozen(a) && Object.isFrozen(a.courses.psd115) && Object.isFrozen(a.courses.psd115.flashcardSeenIds))
    service.markCardSeen(flashcards.find((c) => !a.courses.psd115.flashcardSeenIds.includes(`psd115/${c.id}`)).id)
    const b = service.getSnapshot()
    assert.notEqual(a, b)
    assert.equal(service.getSnapshot(), b)
    assert.equal(JSON.stringify(a), frozen)
    assert.throws(() => {
      a.courses.psd115.quizAnswered = 99
    })
  })

  test('notify μόνο σε πραγματική αλλαγή· no-op → καμία εγγραφή, κανένα notify, ίδιο αντικείμενο', () => {
    const { storage, service, course } = boot(PROD)
    let calls = 0
    const unsubscribe = service.subscribe(() => (calls += 1))
    const before = service.getSnapshot()
    const seen = course().flashcardSeenIds[0].split('/')[1]
    assert.equal(service.markCardSeen(seen), false)
    assert.equal(service.removeWrong('no-such-uid'), false)
    assert.equal(service.setChecklist('pavlov', course().checklists.pavlov.items), false)
    assert.equal(calls, 0)
    assert.deepEqual(storage.log, [])
    assert.equal(service.getSnapshot(), before)
    service.markCardSeen(flashcards.find((c) => !course().flashcardSeenIds.includes(`psd115/${c.id}`)).id)
    assert.equal(calls, 1)
    unsubscribe()
    service.clearWrongBook()
    assert.equal(calls, 1)
  })
})

describe('1E-4b · ισοδυναμία ενεργειών με το παλιό σύστημα (legacy keys)', () => {
  const q = quizQuestions.find((x) => x.categoryId === 'pavlov' && x.options.length > 1)
  const wrongIdx = q.correctIndex === 0 ? 1 : 0

  test('σωστή + λάθος απάντηση: ίδιο psd115-w1-study με τον παλιό reducer, μία εγγραφή ανά απάντηση', () => {
    const { storage, service } = boot(PROD)
    let expected = JSON.parse(PROD['psd115-w1-study'])
    answer(service, q, q.correctIndex)
    expected = legacyAnswer(expected, q, q.correctIndex)
    answer(service, q, wrongIdx)
    expected = legacyAnswer(expected, q, wrongIdx, `uid-${uidN}`)
    assert.deepEqual(study(storage), expected)
    assert.deepEqual(storage.log, [['set', 'psd115-w1-study'], ['set', 'psd115-w1-study']])
    assert.deepEqual(storageView(storage).snapshot, service.getSnapshot().courses.psd115) // μνήμη ≡ storage
  })

  test(`wrongBook: όριο ${WRONG_BOOK_LIMIT} (τα παλαιότερα φεύγουν πρώτα), όπως πριν`, () => {
    const { storage, service } = boot({})
    for (let i = 0; i < WRONG_BOOK_LIMIT + 5; i++) answer(service, q, wrongIdx)
    const wb = study(storage).wrongBook
    assert.equal(wb.length, WRONG_BOOK_LIMIT)
    assert.equal(wb[0].uid, `uid-${uidN - WRONG_BOOK_LIMIT + 1}`)
  })

  test('κάρτα: νέα → +1 στο τέλος· ίδια ξανά → τίποτα', () => {
    const { storage, service } = boot(PROD)
    const card = flashcards.find((c) => !JSON.parse(PROD['psd115-w1-study']).flashcardSeenIds.includes(c.id))
    service.markCardSeen(card.id)
    service.markCardSeen(card.id)
    assert.deepEqual(study(storage).flashcardSeenIds, [...JSON.parse(PROD['psd115-w1-study']).flashcardSeenIds, card.id])
    assert.equal(storage.log.length, 1)
  })

  test('wrongBook: αφαίρεση μίας εγγραφής / καθάρισμα', () => {
    const { storage, service, course } = boot(PROD)
    service.removeWrong(course().wrongBook[0].uid)
    assert.deepEqual(study(storage).wrongBook, [])
    const s2 = boot(PROD)
    s2.service.clearWrongBook()
    assert.deepEqual(study(s2.storage).wrongBook, [])
  })

  test('checklist Εβδ. 1: γράφεται ΜΟΝΟ το δικό του κλειδί, ίδια μορφή', () => {
    const { storage, service } = boot(PROD)
    service.setChecklist('pavlov', [true, false, false, false, false, false, false, false, false])
    assert.deepEqual(storage.log, [['set', 'psd115-w1-pavlov-checklist']])
    assert.equal(storage.getItem('psd115-w1-pavlov-checklist'), '[true,false,false,false,false,false,false,false,false]')
  })

  test('checklist Εβδ. 2: το κοινό κλειδί κρατά τα άλλα θέματα· νέο θέμα προστίθεται', () => {
    const { storage, service } = boot(PROD)
    service.setChecklist('observation', [true, true])
    assert.deepEqual(storage.log, [['set', 'psd115-w2-checklists']])
    assert.deepEqual(JSON.parse(storage.getItem('psd115-w2-checklists')), { ...JSON.parse(PROD['psd115-w2-checklists']), observation: [true, true] })
  })

  test('μετά από κάθε ενέργεια: μνήμη ≡ storage (ένα snapshot, καμία δεύτερη αλήθεια)', () => {
    const { storage, service, course } = boot(SAMPLE)
    const steps = [
      () => answer(service, q, q.correctIndex),
      () => answer(service, q, wrongIdx),
      () => service.markCardSeen(flashcards[3].id),
      () => service.removeWrong(course().wrongBook[0].uid),
      () => service.setChecklist('research-methods-overview', [false, true, true]),
      () => service.setChecklist('pavlov', [false, false, true]),
      () => service.clearWrongBook(),
    ]
    for (const step of steps) {
      step()
      assert.deepEqual(storageView(storage).snapshot, course())
    }
  })
})

describe('1E-4b · άγνωστα / orphan / κατεστραμμένα δεδομένα', () => {
  test('άγνωστο psd115-* κλειδί: ready (warning) και δεν αγγίζεται ποτέ', () => {
    const { storage, service } = boot({ ...PROD, 'psd115-extra-unknown': 'keep-me' })
    assert.equal(service.getSnapshot().status, 'ready')
    assert.match(service.getSnapshot().issues.join(), /psd115-extra-unknown/)
    answer(service, quizQuestions[0], quizQuestions[0].correctIndex)
    service.setChecklist('pavlov', Array(9).fill(true))
    assert.ok(!storage.log.some(([, k]) => k === 'psd115-extra-unknown'))
    assert.equal(storage.getItem('psd115-extra-unknown'), 'keep-me')
  })

  test('orphan slug μέσα σε εβδομαδιαίο κλειδί: διατηρείται όταν γράφεται το κλειδί', () => {
    const keys = { ...PROD, 'psd115-w2-checklists': JSON.stringify({ overview: [true], 'gone-topic': [true, true] }) }
    const { storage, service } = boot(keys)
    assert.equal(service.getSnapshot().status, 'ready')
    service.setChecklist('empiricism', [true])
    assert.deepEqual(JSON.parse(storage.getItem('psd115-w2-checklists')), { 'gone-topic': [true, true], overview: [true], empiricism: [true] })
  })

  test('κάρτα/ερώτηση που δεν υπάρχει πια στο περιεχόμενο: κρατιέται', () => {
    const s = JSON.parse(PROD['psd115-w1-study'])
    const keys = { ...PROD, 'psd115-w1-study': JSON.stringify({ ...s, flashcardSeenIds: [...s.flashcardSeenIds, 'fc-removed-1'] }) }
    const { storage, service, course } = boot(keys)
    assert.equal(service.getSnapshot().status, 'ready')
    assert.ok(course().flashcardSeenIds.includes('psd115/fc-removed-1'))
    service.markCardSeen(flashcards.find((c) => !s.flashcardSeenIds.includes(c.id)).id)
    assert.ok(study(storage).flashcardSeenIds.includes('fc-removed-1'))
  })

  const corrupt = {
    'μη έγκυρο JSON': { ...PROD, 'psd115-w1-study': '{oops' },
    'λάθος τύπος': { ...PROD, 'psd115-w1-study': JSON.stringify({ quizAnswered: 'πολλά' }) },
    'checklist όχι boolean': { ...PROD, 'psd115-w1-pavlov-checklist': '[1,0]' },
    'εβδομαδιαίο όχι αντικείμενο': { ...PROD, 'psd115-w2-checklists': '[true]' },
  }
  for (const [label, keys] of Object.entries(corrupt)) {
    test(`κατεστραμμένα (${label}) → degraded, καμία εγγραφή, ποτέ μηδενικά στο storage`, () => {
      const { storage, service } = boot(keys)
      const st = service.getSnapshot()
      assert.equal(st.status, 'degraded')
      assert.ok(st.issues.length > 0)
      assert.equal(answer(service, quizQuestions[0], quizQuestions[0].correctIndex), false)
      assert.equal(service.markCardSeen(flashcards[0].id), false)
      assert.equal(service.setChecklist('pavlov', [true]), false)
      assert.equal(service.clearWrongBook(), false)
      assert.deepEqual(storage.log, [])
      assert.deepEqual(storage.dump(), keys) // byte-for-byte
    })
  }

  test('αμφίβολη ανάκτηση συναλλαγής ή αδύνατη ανάγνωση → degraded', () => {
    assert.equal(boot(PROD, { recovery: { status: 'failed' } }).service.getSnapshot().status, 'degraded')
    assert.equal(boot(PROD, { recovery: { status: 'corrupt-marker' } }).service.getSnapshot().status, 'degraded')
    assert.equal(boot(PROD, { recovery: { status: 'completed' } }).service.getSnapshot().status, 'ready')
    const s = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(undefined) })
    assert.equal(s.getSnapshot().status, 'degraded')
  })

  test('αποτυχία εγγραφής (quota): η μελέτη συνεχίζει όπως πριν, με προειδοποίηση', () => {
    const warnings = []
    const storage = fakeStorage(PROD)
    storage.setItem = () => {
      throw new Error('quota')
    }
    const service = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(storage), warn: (...a) => warnings.push(a.join(' ')) })
    answer(service, quizQuestions[0], quizQuestions[0].correctIndex)
    assert.equal(service.getSnapshot().courses.psd115.quizAnswered, 2)
    assert.match(warnings.join(), /quota/)
  })
})

describe('1E-4b · reset (D6: ένα κλειδί)', () => {
  test('writer key === reader key', () => {
    assert.equal(RESET_MARKER_KEY, resetStateKey('psd115'))
    assert.equal(RESET_MARKER_KEY, 'progress:reset:psd115')
  })

  test('το reset που γράφει το resetProgressSafely εφαρμόζεται από τον reader', () => {
    const at = Date.parse('2026-10-06T10:00:00Z')
    const { baseline, marker } = buildLegacyBaseline(PROD, { now: () => at })
    const storage = fakeStorage({ ...PROD, [STATE_KEY]: JSON.stringify({ [MIGRATION_MARKER_KEY]: marker }) })
    resetProgressSafely({ storage, download: () => {}, now: () => at + 5000 })
    const state = JSON.parse(storage.getItem(STATE_KEY))
    assert.ok(state[resetStateKey('psd115')], 'το reset δεν γράφτηκε στο κανονικό κλειδί')
    const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, state })
    assert.ok(r.ok)
    assert.equal(r.snapshot.quizAnswered, 0)
    assert.equal(r.snapshot.flashcardSeenIds.length, 0)
  })

  test('το παλιό κλειδί (progress-reset:psd115) ΔΕΝ γίνεται δεκτό', () => {
    const { baseline } = buildLegacyBaseline(PROD, { now: () => Date.parse('2026-10-06T10:00:00Z') })
    const r = buildProgressSnapshot({ courseId: 'psd115', content, baseline, state: { 'progress-reset:psd115': { at: '2026-10-07T00:00:00.000Z' } } })
    assert.equal(r.snapshot.quizAnswered, 1)
  })

  test("το παλιό string 'progress-reset:' δεν υπάρχει πουθενά στο src/", () => {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    for (const f of walk(path.join(root, 'src'))) assert.ok(!fs.readFileSync(f, 'utf8').includes('progress-reset:'), f)
  })

  test('reset + resync: η μνήμη = ό,τι έμεινε στο storage (κανένα δεύτερο default), checklists άδεια', () => {
    const storage = fakeStorage({ ...PROD, 'psd115-extra-unknown': 'keep-me' })
    const service = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(storage) })
    let calls = 0
    service.subscribe(() => (calls += 1))
    resetProgressSafely({ storage, download: () => {} })
    service.resync()
    const s = service.getSnapshot()
    assert.equal(s.status, 'ready')
    assert.equal(calls, 1)
    assert.equal(s.courses.psd115.quizAnswered, 0)
    assert.deepEqual(s.courses.psd115.checklists, {})
    assert.equal(storage.getItem('psd115-extra-unknown'), 'keep-me')
    assert.equal(storage.getItem('psd115-w1-pavlov-checklist'), null) // κανένα ξανα-γράψιμο checklist μετά το reset
  })
})

describe('1E-4b · guards', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
  const rel = (f) => path.relative(root, f)
  const uiFiles = ['src/components', 'src/pages', 'src/layouts', 'src/hooks'].flatMap((d) => walk(path.join(root, d)))
  const INFRA = /utils\/(progressBackup|progressTransaction|progressMigration|legacyProgressBackend)\.js'/
  const INFRA_ALLOWED = new Map([
    ['src/layouts/AppShell.jsx', ['progressBackup']],
    ['src/components/ProgressBackupPanel.jsx', ['progressBackup']],
  ])

  test('components/pages/layouts/hooks: κανένα storage.js, progressStore, localStorage/sessionStorage/indexedDB', () => {
    for (const f of uiFiles) {
      const code = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(code, /utils\/storage\.js'/, rel(f))
      assert.doesNotMatch(code, /core\/progress\/progressStore\.js'/, rel(f))
      assert.doesNotMatch(code, /\b(localStorage|sessionStorage|indexedDB)\b/, rel(f))
    }
  })

  test('υποδομή αποθήκευσης μόνο από AppShell / ProgressBackupPanel (backup/import/reset)', () => {
    for (const f of uiFiles) {
      const code = fs.readFileSync(f, 'utf8')
      const used = [...code.matchAll(/utils\/(progressBackup|progressTransaction|progressMigration|legacyProgressBackend)\.js'/g)].map((m) => m[1])
      if (!used.length) continue
      assert.ok(INFRA.test(code))
      assert.deepEqual(used, INFRA_ALLOWED.get(rel(f)) ?? [], rel(f))
    }
  })

  test('createProgressService / installProgressService: μόνο στο main.jsx', () => {
    for (const f of walk(path.join(root, 'src'))) {
      const r = rel(f)
      const code = fs.readFileSync(f, 'utf8')
      if (r !== 'src/main.jsx' && r !== 'src/core/progress/progressService.js') assert.doesNotMatch(code, /createProgressService\(/, r)
      if (r !== 'src/main.jsx' && r !== 'src/hooks/useProgress.js') assert.doesNotMatch(code, /installProgressService\(/, r)
    }
  })

  test('το ProgressService δεν ξέρει shadow / baseline / storage / React / PSD115', () => {
    const code = fs.readFileSync(path.join(root, 'src/core/progress/progressService.js'), 'utf8')
    assert.doesNotMatch(code, /progressShadow|legacyBaseline|reconcile|progressStore|storage\.js|from 'react'|psd115|localStorage\.|window\./)
  })

  test('το useStudySession: ο shadow recorder ΠΡΙΝ από την αλλαγή στο service, στον ίδιο handler', () => {
    const code = fs.readFileSync(path.join(root, 'src/hooks/useStudySession.js'), 'utf8')
    const quiz = code.slice(code.indexOf('const handleSelectOption'))
    assert.ok(quiz.indexOf('recordQuizAnswer(') < quiz.indexOf('getProgressService().answerQuestion('))
    const card = code.slice(code.indexOf('const markFlashSeen'))
    assert.ok(card.indexOf('recordFlashcardSeen(') < card.indexOf('getProgressService().markCardSeen('))
    assert.doesNotMatch(code, /\b(setProgress|saveProgress|loadProgress)\b/)
  })

  test('install: δεύτερη εγκατάσταση → σφάλμα', async () => {
    const m = await import('../src/hooks/useProgress.js')
    const svc = boot({}).service
    m.installProgressService(svc)
    assert.throws(() => m.installProgressService(svc), /ήδη/)
    assert.equal(m.getProgressService(), svc)
  })
})
