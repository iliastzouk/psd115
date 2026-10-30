/**
 * Φάση 6a — reset ανά μάθημα (J5), import / export / αντικατάσταση (J6), safety backup.
 * src/utils/studyProgressBackup.js + src/core/progress/importMerge.js
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { TXN_KEY } from '../src/core/progress/transaction.js'
import { CHECKLISTS_VERSION, WRONG_BOOK_LIMIT } from '../src/core/progress/courseProgress.js'
import {
  BACKUP_KEY_PREFIX,
  MAX_LOCAL_BACKUPS,
  applyImport,
  buildRawExport,
  buildStoreExport,
  createSafetyBackup,
  exportProgressToFile,
  listLocalBackups,
  planImport,
  resetCourseSafely,
} from '../src/utils/studyProgressBackup.js'
import { describeImportPlan } from '../src/utils/progressFailureMessage.js'
import { ALL_ADAPTERS, EVENTS_KEY, STATE_KEY, T0, answer, fakeStorage, flip, readEvents, readState, service, storeWith, uuid, wrongEntry } from './helpers/progressFixtures.mjs'

const adapters = ALL_ADAPTERS
const noDownload = () => {}
const iso = (ms) => new Date(ms).toISOString()
const RS = (c) => `progress:reset:${c}`
const WB = (c) => `progress:wrongbook:${c}`
const CL = (c) => `progress:checklists:${c}`
const file = (events = [], state = {}) => ({ format: 'study-progress', version: 1, exportedAt: iso(T0), events, state })
const course = (s, c) => service(s).getSnapshot().courses[c]
const reset = (s, c, now = T0) => resetCourseSafely({ courseId: c, adapters, storage: s, download: noDownload, now: () => now })
const doImport = (s, data) => applyImport(planImport(data, { storage: s, adapters }), data, { storage: s, adapters, download: noDownload, now: () => T0 + 1 })
const planOf = (p, c) => p.courses.find((x) => x.courseId === c)
const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })

describe('J5 · reset ανά μάθημα', () => {
  test('μηδενίζει ΜΟΝΟ το μάθημα· events μένουν· άλλα μαθήματα ανέγγιχτα', () => {
    const s = fakeStorage()
    const svc = service(s)
    svc.forCourse('demo-a').answerQuestion({ questionId: 'a-q1', ok: false, wrong: { uid: 'x' } })
    svc.forCourse('demo-a').setChecklist('a-t1', [true])
    svc.forCourse('demo-b').answerQuestion({ questionId: 'b-q1', ok: false, wrong: { uid: 'y' } })
    svc.forCourse('demo-b').setChecklist('b-t1', [true])
    const b = course(s, 'demo-b')
    const eventsBefore = readEvents(s)
    reset(s, 'demo-a', T0 + 10)
    assert.deepEqual(course(s, 'demo-a').quizAnswered, 0)
    assert.deepEqual([course(s, 'demo-a').wrongBook, course(s, 'demo-a').checklists], [[], {}])
    // Και το ΑΠΟΘΗΚΕΥΜΕΝΟ state είναι καθαρό (όχι μόνο κρυμμένο από το R): αν χαθεί ποτέ το όριο, τίποτα δεν επανέρχεται.
    assert.deepEqual(readState(s)[WB('demo-a')], { version: 1, entries: [] })
    assert.deepEqual(readState(s)[CL('demo-a')], { version: CHECKLISTS_VERSION, topics: {} })
    assert.deepEqual(course(s, 'demo-b'), b)
    assert.deepEqual(readEvents(s), eventsBefore, 'append-only: κανένα event δεν σβήνεται')
  })
  test('παράδειγμα του review: checklist με t = 2000 (ρολόι μπροστά), events 1500, now 1600 → at = 2001, τίποτα δεν επιβιώνει', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1', { t: T0 + 1500 })], state: { [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: T0 + 2000 } } } } })
    const { at } = reset(s, 'demo-a', T0 + 1600)
    assert.equal(at, T0 + 2001)
    assert.deepEqual([course(s, 'demo-a').checklists, course(s, 'demo-a').quizAnswered], [{}, 0])
    const svc = service(s, { now: () => T0 + 1600 })
    svc.forCourse('demo-a').setChecklist('a-t1', [false, true])
    assert.equal(readState(s)[CL('demo-a')].topics['a-t1'].t, T0 + 2001, 'νέα αλλαγή: t = max(now, reset, H+1)')
    assert.deepEqual(course(s, 'demo-a').checklists['a-t1'].items, [false, true])
  })
  test('ίδιο με εγγραφή wrongBook από το μέλλον', () => {
    const s = storeWith({ events: [], state: { [WB('demo-a')]: { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { t: T0 + 5000 })] } } })
    assert.equal(reset(s, 'demo-a', T0).at, T0 + 5001)
    assert.deepEqual(course(s, 'demo-a').wrongBook, [])
  })
  test('δύο reset στο ίδιο ms → αυστηρά αυξανόμενα όρια· event στο ίδιο ms με το reset: το παλιό αγνοείται, το νέο μετρά', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1', { t: T0 })], state: {} })
    const r1 = reset(s, 'demo-a', T0).at
    const r2 = reset(s, 'demo-a', T0).at
    assert.deepEqual([r1, r2], [T0 + 1, T0 + 2])
    assert.equal(course(s, 'demo-a').quizAnswered, 0)
    service(s, { now: () => T0 }).forCourse('demo-a').answerQuestion({ questionId: 'a-q2', ok: true })
    assert.equal(readEvents(s).at(-1).t, r2, 'νέο event = όριο → μετρά')
    assert.equal(course(s, 'demo-a').quizAnswered, 1)
  })
  test('ρολόι πίσω ΑΦΟΥ έχουν καταγραφεί events μετά το reset → όλα μετρούν', () => {
    const s = fakeStorage()
    reset(s, 'demo-a', T0 + 100)
    let clock = T0 + 200
    const a = service(s, { now: () => clock }).forCourse('demo-a')
    a.answerQuestion({ questionId: 'a-q1', ok: true })
    a.answerQuestion({ questionId: 'a-q2', ok: true })
    clock = T0
    a.answerQuestion({ questionId: 'a-q3', ok: true })
    a.markCardSeen('a-c1')
    assert.deepEqual(readEvents(s).map((e) => e.t), [T0 + 200, T0 + 201, T0 + 202, T0 + 203])
    assert.equal(course(s, 'demo-a').quizAnswered, 3)
  })
  test('μάθημα unavailable (κατεστραμμένο namespace) → reset το επαναφέρει σε ready· το κατεστραμμένο μένει αυτούσιο στο backup', () => {
    const broken = { version: CHECKLISTS_VERSION, topics: { 'a-t1': 'χαλασμένο' } }
    const s = storeWith({ events: [answer('demo-a', 'a-q1', { t: T0 + 5 })], state: { [CL('demo-a')]: broken } })
    assert.ok(service(s).getSnapshot().unavailable['demo-a'])
    const { backup, at } = reset(s, 'demo-a', T0)
    assert.equal(at, T0 + 6, 'H_c από τα έγκυρα δεδομένα (event t+5)· το χαλασμένο εξαιρείται')
    assert.deepEqual(JSON.parse(backup.data.keys[STATE_KEY])[CL('demo-a')], broken)
    assert.ok(course(s, 'demo-a'), 'ready')
  })
  test('μάθημα unavailable λόγω event λάθους τύπου → reset το κρύβει (t < R), ready, το event μένει στο log', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-c1', { t: T0 })], state: {} })
    reset(s, 'demo-a', T0)
    assert.ok(course(s, 'demo-a'))
    assert.equal(readEvents(s).length, 1)
  })
  test('global degraded ή σημάδι συναλλαγής → απόρριψη, καμία εγγραφή, κανένα backup', () => {
    for (const [s, name] of [
      [fakeStorage({ [EVENTS_KEY]: '{oops' }), 'ProgressActionError'],
      [fakeStorage({ [TXN_KEY]: '{"v":1}' }), 'PendingTransactionError'],
      [fakeStorage({ [TXN_KEY]: 'χαλασμένο' }), 'PendingTransactionError'],
    ]) {
      const before = s.dump()
      assert.throws(() => reset(s, 'demo-a'), (e) => e.name === name)
      assert.deepEqual(s.dump(), before)
    }
  })
  test('χωρίς επαληθευμένο backup (γεμάτο storage) → BackupError, τίποτα δεν αλλάζει', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1')], state: {} })
    const before = s.dump()
    s.hooks.fail = (k) => (k.startsWith(BACKUP_KEY_PREFIX) ? quota() : null)
    assert.throws(() => reset(s, 'demo-a'), (e) => e.name === 'BackupError')
    assert.deepEqual(s.dump(), before)
  })
})

describe('safety backup / export', () => {
  test('raw: τα δύο κλειδιά ΚΑΙ το σημάδι αυτούσια· τοπικά, επαληθευμένο· τα τελευταία 3', () => {
    const s = fakeStorage({ [EVENTS_KEY]: '{oops', [STATE_KEY]: '{}' })
    let downloads = 0
    for (let i = 0; i < MAX_LOCAL_BACKUPS + 2; i++) createSafetyBackup('reset', { storage: s, download: () => downloads++, now: () => T0 + i })
    assert.equal(listLocalBackups(s).length, MAX_LOCAL_BACKUPS)
    assert.equal(downloads, MAX_LOCAL_BACKUPS + 2)
    const data = JSON.parse(s.getItem(listLocalBackups(s).at(-1)))
    assert.deepEqual(data.keys, { [EVENTS_KEY]: '{oops', [STATE_KEY]: '{}', [TXN_KEY]: null })
  })
  test('export: νέα μορφή όταν το store διαβάζεται, raw όταν όχι (κανένα σημάδι / χαλασμένο δεν χάνεται)', () => {
    const ok = storeWith({ events: [answer('demo-a', 'a-q1')], state: {} })
    assert.equal(exportProgressToFile({ storage: ok, download: noDownload }).format, 'study-progress')
    const bad = fakeStorage({ [TXN_KEY]: 'x', [EVENTS_KEY]: '[]' })
    const raw = exportProgressToFile({ storage: bad, download: noDownload })
    assert.equal(raw.format, 'study-progress-raw')
    assert.equal(raw.keys[TXN_KEY], 'x')
    assert.deepEqual(buildRawExport({ storage: bad }).keys, raw.keys)
  })
  test('αντίγραφο που δεν ξαναδιαβάζεται ίδιο → BackupError, το αντίγραφο απομακρύνεται, τίποτα δεν αλλάζει', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1')], state: {} })
    const before = s.dump()
    const set = s.setItem
    s.setItem = (k, v) => set(k, k.startsWith(BACKUP_KEY_PREFIX) ? String(v).slice(0, -1) : v)
    assert.throws(() => createSafetyBackup('reset', { storage: s, download: noDownload }), (e) => e.name === 'BackupError')
    assert.throws(() => reset(s, 'demo-a'), (e) => e.name === 'BackupError')
    assert.deepEqual(s.dump(), before)
  })
  test('ούτε το export ούτε το backup αγγίζουν τα κλειδιά προόδου', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1')], state: {} })
    const ev = s.getItem(EVENTS_KEY)
    const st = s.getItem(STATE_KEY)
    buildStoreExport({ storage: s })
    createSafetyBackup('import', { storage: s, download: noDownload })
    assert.equal(s.getItem(EVENTS_KEY), ev)
    assert.equal(s.getItem(STATE_KEY), st, 'κανένα namespace δεν δημιουργείται')
  })
})

describe('J6 · import: round-trip και συμβατότητα', () => {
  const rich = () => {
    const s = fakeStorage()
    const svc = service(s)
    const a = svc.forCourse('demo-a')
    a.answerQuestion({ questionId: 'a-q1', ok: false, wrong: { uid: 'w1', question: 'Q' } })
    a.markCardSeen('a-c1')
    a.setChecklist('a-t1', [true, false])
    // orphan, self, άλλο ctx, μάθημα χωρίς adapter, opaque state
    const extra = [answer('demo-a', 'removed-q', { t: T0 + 50 }), { ...answer('demo-a', 'a-q2', { t: T0 + 51 }), ctx: 'review' }, { id: uuid(), t: T0 + 52, item: 'demo-a/a-c2', kind: 'self', ctx: 'review' }, answer('psd210', 'x', { t: T0 })]
    s.setItem(EVENTS_KEY, JSON.stringify([...readEvents(s), ...extra]))
    s.setItem(STATE_KEY, JSON.stringify({ ...readState(s), 'progress:wrongbook:psd210': { anything: 1 }, 'future-key': [1, 2] }))
    return s
  }
  test('export → καθαρό storage → import: ίδια πρόοδος, ίδια events, μαζί με orphan / self / άλλο ctx / opaque', () => {
    const src = rich()
    const data = buildStoreExport({ storage: src })
    const dst = fakeStorage()
    const plan = planImport(data, { storage: dst, adapters })
    assert.equal(plan.mode, 'merge')
    assert.equal(plan.requiresConfirmation, false, 'μόνο προσθήκες')
    applyImport(plan, data, { storage: dst, adapters, download: noDownload })
    assert.deepEqual(readEvents(dst), readEvents(src))
    assert.deepEqual(readState(dst), readState(src))
    assert.deepEqual(service(dst).getSnapshot().courses, service(src).getSnapshot().courses)
  })
  test('διπλό import → καμία αλλαγή, preview «καμία αλλαγή»', () => {
    const s = rich()
    const data = buildStoreExport({ storage: s })
    const before = s.dump()
    const plan = planImport(data, { storage: s, adapters })
    assert.ok(plan.courses.every((c) => !c.changed))
    assert.equal(plan.requiresConfirmation, false)
    const { changed } = applyImport(plan, data, { storage: s, adapters, download: noDownload })
    assert.deepEqual(changed, [])
    for (const k of [EVENTS_KEY, STATE_KEY]) assert.equal(s.getItem(k), before[k])
  })
  test('καθαρό export χωρίς namespaces → έγκυρο import', () => {
    const s = fakeStorage()
    const data = file([answer('demo-a', 'a-q1')])
    applyImport(planImport(data, { storage: s, adapters }), data, { storage: s, adapters, download: noDownload })
    assert.equal(course(s, 'demo-a').quizAnswered, 1)
  })
})

describe('J6 · import: απορρίψεις (όλο ή τίποτα)', () => {
  const rejects = (s, data, re) => {
    const before = s.dump()
    assert.throws(() => planImport(data, { storage: s, adapters }), (e) => e.name === 'ImportRejected' && (!re || re.test(e.message)))
    assert.deepEqual(s.dump(), before)
  }
  test('παλιό αρχείο psd115-progress-export → σαφές μήνυμα', () => rejects(fakeStorage(), { format: 'psd115-progress-export', version: 2, keys: {} }, /παλιά μορφή/))
  test('άκυρη μορφή / έκδοση / πεδία', () => {
    for (const bad of [null, [], { ...file(), format: 'x' }, { ...file(), version: 2 }, { ...file(), events: {} }, { ...file(), extra: 1 }]) rejects(fakeStorage(), bad)
  })
  test('άκυρο event / μη global id / διπλό id στο αρχείο', () => {
    const e = answer('demo-a', 'a-q1')
    rejects(fakeStorage(), file([{ ...e, kind: 'x' }]))
    rejects(fakeStorage(), file([{ ...e, item: 'plain' }]))
    rejects(fakeStorage(), file([e, { ...e, ok: 0 }]))
  })
  test('σύγκρουση id με τοπικό event διαφορετικού περιεχομένου', () => {
    const e = answer('demo-a', 'a-q1')
    rejects(storeWith({ events: [e], state: {} }), file([{ ...e, ok: 0 }]), /διαφορετικό περιεχόμενο/)
  })
  test('σύγκρουση uid στο wrongBook', () => {
    const w = wrongEntry('demo-a', 'a-q1', { uid: 'same' })
    rejects(storeWith({ events: [], state: { [WB('demo-a')]: { version: 1, entries: [w] } } }), file([], { [WB('demo-a')]: { version: 1, entries: [{ ...w, question: 'άλλο' }] } }), /uid/)
  })
  test('review #18: ίδιο uid με άλλο περιεχόμενο ΑΛΛΑ και τα δύο πριν από το τελικό reset → ΔΕΝ απορρίπτεται, τίποτα δεν εμφανίζεται', () => {
    const w = wrongEntry('demo-a', 'a-q1', { uid: 'x', t: T0 })
    const s = storeWith({ events: [], state: { [WB('demo-a')]: { version: 1, entries: [w] } } })
    const data = file([], { [RS('demo-a')]: { at: iso(T0 + 10) }, [WB('demo-a')]: { version: 1, entries: [{ ...w, question: 'άλλο κείμενο' }] } })
    const plan = planImport(data, { storage: s, adapters })
    applyImport(plan, data, { storage: s, adapters, download: noDownload })
    assert.deepEqual(course(s, 'demo-a').wrongBook, [])
    assert.deepEqual(readState(s)[WB('demo-a')].entries, [])
  })
  test('τοπικό λάθος ορατό, λάθος του αρχείου με ίδιο uid ΚΡΥΜΜΕΝΟ από το reset → καμία σύγκρουση, μένει το τοπικό', () => {
    const R = T0 + 10
    const w = wrongEntry('demo-a', 'a-q1', { uid: 'z', t: R + 5 })
    const s = storeWith({ events: [], state: { [RS('demo-a')]: { at: iso(R) }, [WB('demo-a')]: { version: 1, entries: [w] } } })
    const data = file([], { [RS('demo-a')]: { at: iso(R) }, [WB('demo-a')]: { version: 1, entries: [{ ...w, t: R - 1, question: 'παλιό' }] } })
    applyImport(planImport(data, { storage: s, adapters }), data, { storage: s, adapters, download: noDownload })
    assert.deepEqual(readState(s)[WB('demo-a')].entries, [w])
  })
  test('ίδιο uid με άλλο περιεχόμενο, το ένα μετά το reset → απορρίπτεται μόνο αν ΚΑΙ τα δύο είναι ορατά', () => {
    const w = wrongEntry('demo-a', 'a-q1', { uid: 'y', t: T0 + 20 })
    rejects(storeWith({ events: [], state: { [WB('demo-a')]: { version: 1, entries: [w] } } }), file([], { [RS('demo-a')]: { at: iso(T0 + 10) }, [WB('demo-a')]: { version: 1, entries: [{ ...w, question: 'άλλο' }] } }), /uid/)
    const s = storeWith({ events: [], state: { [WB('demo-a')]: { version: 1, entries: [{ ...w, t: T0 }] } } })
    const data = file([], { [RS('demo-a')]: { at: iso(T0 + 10) }, [WB('demo-a')]: { version: 1, entries: [{ ...w, question: 'άλλο' }] } })
    applyImport(planImport(data, { storage: s, adapters }), data, { storage: s, adapters, download: noDownload })
    assert.deepEqual(course(s, 'demo-a').wrongBook.map((e) => e.question), ['άλλο'], 'κρατιέται μόνο το ορατό (του αρχείου)')
  })
  test('namespace του αρχείου που υπάρχει αλλά είναι άκυρο', () => rejects(fakeStorage(), file([], { [CL('demo-a')]: { version: 1, topics: {} } })))
  test('λάθος τύπος (answer σε κάρτα) → θα έκανε μη διαθέσιμο ένα υγιές μάθημα', () => rejects(fakeStorage(), file([answer('demo-a', 'a-c1')]), /μη διαθέσιμο/))
  test('σημάδι συναλλαγής (εκκρεμές ή κατεστραμμένο) → κανένα import', () => {
    for (const marker of ['{"v":1}', 'χαλασμένο']) {
      const s = fakeStorage({ [TXN_KEY]: marker })
      const before = s.dump()
      assert.throws(() => planImport(file(), { storage: s, adapters }), (e) => e.name === 'PendingTransactionError')
      assert.deepEqual(s.dump(), before)
    }
  })
  test('ΑΠΟΔΟΧΗ: orphan (υποστηριζόμενο μάθημα), μάθημα χωρίς adapter, μάθημα εκτός registry', () => {
    const s = fakeStorage()
    const data = file([answer('demo-a', 'removed'), answer('psd210', 'x'), answer('no-such-course', 'y')])
    doImport(s, data)
    assert.equal(readEvents(s).length, 3)
  })
})

describe('J6 · reset και import: τίποτα με t < R δεν επανέρχεται', () => {
  const thirty = (t = T0) => Array.from({ length: 30 }, (_, i) => wrongEntry('demo-a', 'a-q1', { uid: `old-${String(i).padStart(2, '0')}`, t: t + i }))
  test('30 λάθη → reset → import του παλιού backup → κενό wrongBook, μετρητές 0, preview «καμία αλλαγή»', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1', { t: T0, ok: 0 })], state: { [WB('demo-a')]: { version: 1, entries: thirty() } } })
    const backup = buildStoreExport({ storage: s })
    reset(s, 'demo-a', T0 + 100)
    const plan = planImport(backup, { storage: s, adapters })
    assert.equal(planOf(plan, 'demo-a').changed, false)
    assert.equal(plan.requiresConfirmation, false)
    applyImport(plan, backup, { storage: s, adapters, download: noDownload })
    assert.deepEqual([course(s, 'demo-a').wrongBook, course(s, 'demo-a').quizAnswered], [[], 0])
    assert.deepEqual(readState(s)[WB('demo-a')].entries, [], 'τα παλιά λάθη δεν ξαναγράφονται ούτε κρυμμένα στο state')
  })
  test('το ίδιο για checklists', () => {
    const s = storeWith({ events: [], state: { [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: T0 } } } } })
    const backup = buildStoreExport({ storage: s })
    reset(s, 'demo-a', T0 + 1)
    doImport(s, backup)
    assert.deepEqual(course(s, 'demo-a').checklists, {})
    assert.deepEqual(readState(s)[CL('demo-a')].topics, {}, 'τα παλιά checklists δεν ξαναγράφονται ούτε κρυμμένα στο state')
  })
  test('ΙΔΙΟ reset αλλά backup με εγγραφές t < R (εσωτερικά ασυνεπές) → δεν εμφανίζονται', () => {
    const R = T0 + 100
    const s = storeWith({ events: [], state: { [RS('demo-a')]: { at: iso(R) } } })
    const data = file([], {
      [RS('demo-a')]: { at: iso(R) },
      [WB('demo-a')]: { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { uid: 'early', t: R - 1 })] },
      [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: R - 1 } } },
    })
    doImport(s, data)
    assert.deepEqual([course(s, 'demo-a').wrongBook, course(s, 'demo-a').checklists], [[], {}])
  })
  test('reset ΜΟΝΟ στο αρχείο, νεότερο από την τοπική πρόοδο → κρύβει τοπικά, απαιτεί επιβεβαίωση· η ακύρωση δεν γράφει', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1', { t: T0 }), flip('demo-a', 'a-c1', { t: T0 })], state: { [WB('demo-a')]: { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { uid: 'local', t: T0 })] } } })
    const before = s.dump()
    const data = file([], { [RS('demo-a')]: { at: iso(T0 + 10) } })
    const plan = planImport(data, { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.equal(plan.requiresConfirmation, true)
    assert.equal(p.events.hidden.length, 2)
    assert.deepEqual(p.cards.hidden, ['demo-a/a-c1'])
    assert.deepEqual(p.wrongBook.removed.map((w) => w.uid), ['local'])
    assert.ok(describeImportPlan(plan).lines.join(' ').includes('ΔΕΝ θα υπολογίζονται'))
    assert.deepEqual(s.dump(), before, 'η προεπισκόπηση (και η ακύρωση) δεν γράφει τίποτα')
  })
  test('διαφορετικά resets, πρόοδος και στις δύο πλευρές μετά το νεότερο → μένουν όσα έχουν t ≥ R και από τις δύο', () => {
    const Rl = T0 + 10
    const Rf = T0 + 20
    const s = storeWith({ events: [], state: { [RS('demo-a')]: { at: iso(Rl) }, [WB('demo-a')]: { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { uid: 'l-old', t: Rl + 1 }), wrongEntry('demo-a', 'a-q1', { uid: 'l-new', t: Rf + 5 })] } } })
    doImport(s, file([], { [RS('demo-a')]: { at: iso(Rf) }, [WB('demo-a')]: { version: 1, entries: [wrongEntry('demo-a', 'a-q2', { uid: 'f-new', t: Rf + 1 })] } }))
    assert.deepEqual(course(s, 'demo-a').wrongBook.map((w) => w.uid), ['f-new', 'l-new'])
    assert.equal(readState(s)[RS('demo-a')].at, iso(Rf))
  })
})

describe('J6 · preview ανά στοιχείο', () => {
  test('review #18: οι λεπτομέρειες δείχνουν τα ίδια τα στοιχεία (id/item καταγραφών, κάρτες, ερωτήσεις λαθών), όχι μόνο πλήθη', () => {
    const hiddenAnswer = answer('demo-a', 'a-q1', { t: T0, ok: 0 })
    const s = storeWith({ events: [hiddenAnswer, flip('demo-a', 'a-c1', { t: T0 })], state: { [WB('demo-a')]: { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { uid: 'local-w', t: T0 })] } } })
    const added = flip('demo-a', 'a-c2', { t: T0 + 50 })
    const plan = planImport(file([added], { [RS('demo-a')]: { at: iso(T0 + 10) } }), { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.deepEqual(p.events.hidden.map((e) => [e.id, e.item, e.kind]).sort(), [[hiddenAnswer.id, 'demo-a/a-q1', 'answer'], [p.events.hidden.find((e) => e.kind === 'flip').id, 'demo-a/a-c1', 'flip']].sort())
    assert.deepEqual(p.events.added.map((e) => e.id), [added.id])
    const d = describeImportPlan(plan).details.find((x) => x.courseId === 'demo-a')
    const text = JSON.stringify(d.sections)
    for (const needle of [hiddenAnswer.id, 'a-q1', 'a-c1', 'a-c2', added.id, 'Q a-q1', 'local-w']) assert.ok(text.includes(needle), needle)
    assert.ok(d.sections.some((x) => /ΔΕΝ θα υπολογίζονται/.test(x.title)))
  })
  test('review #18: orphan και opaque καταγραφές του αρχείου αναφέρονται ως προειδοποιήσεις, ακόμα κι όταν δεν αλλάζουν μετρητές', () => {
    const s = fakeStorage()
    const plan = planImport(file([answer('demo-a', 'removed-q'), answer('psd210', 'x'), answer('psd210', 'y')]), { storage: s, adapters })
    assert.ok(plan.warnings.some((w) => w.startsWith('demo-a:') && w.includes('orphan')), JSON.stringify(plan.warnings))
    assert.ok(plan.warnings.some((w) => w.startsWith('psd210: 2 καταγραφές')), JSON.stringify(plan.warnings))
    const text = describeImportPlan(plan)
    assert.ok(text.warnings.length >= 2)
    assert.ok(text.details.find((x) => x.courseId === 'demo-a').sections.some((x) => /Προειδοποιήσεις/.test(x.title)))
  })
  test('opaque καταγραφές που υπάρχουν ήδη τοπικά δεν ξαναναφέρονται ως νέες', () => {
    const e = answer('psd210', 'x')
    const s = storeWith({ events: [e], state: {} })
    const plan = planImport(file([e]), { storage: s, adapters })
    assert.equal(plan.warnings.filter((w) => w.startsWith('psd210')).length, 0)
  })
  test('η ΜΟΝΗ απώλεια είναι κρυμμένες απαντήσεις (καμία κάρτα / λάθος) → απαιτεί επιβεβαίωση', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1', { t: T0 }), answer('demo-a', 'a-q2', { t: T0 })], state: {} })
    const plan = planImport(file([], { [RS('demo-a')]: { at: iso(T0 + 1) } }), { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.deepEqual([p.events.hidden.length, p.cards.hidden.length, p.wrongBook.removed.length], [2, 0, 0])
    assert.equal(plan.requiresConfirmation, true)
  })
  test('ίδιο reset, checklist διαφορετικό → του αρχείου, με επιβεβαίωση', () => {
    const s = storeWith({ events: [], state: { [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true, false], t: T0 } } } } })
    const data = file([], { [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [false, true], t: T0 } } } })
    const plan = planImport(data, { storage: s, adapters })
    assert.equal(plan.requiresConfirmation, true)
    assert.deepEqual(planOf(plan, 'demo-a').checklists, [{ topicId: 'a-t1', before: [true, false], after: [false, true] }])
    applyImport(plan, data, { storage: s, adapters, download: noDownload })
    assert.deepEqual(course(s, 'demo-a').checklists['a-t1'].items, [false, true])
  })
  test('30 λάθη αντικαθίστανται από 30 άλλα (όριο 60 με νεότερα) → 30 αφαιρέσεις ΚΑΙ 30 προσθήκες, όχι «30 → 30»', () => {
    const local = Array.from({ length: WRONG_BOOK_LIMIT }, (_, i) => wrongEntry('demo-a', 'a-q1', { uid: `l${String(i).padStart(2, '0')}`, t: T0 + i }))
    const newer = Array.from({ length: 30 }, (_, i) => wrongEntry('demo-a', 'a-q1', { uid: `f${String(i).padStart(2, '0')}`, t: T0 + 1000 + i }))
    const s = storeWith({ events: [], state: { [WB('demo-a')]: { version: 1, entries: local } } })
    const plan = planImport(file([], { [WB('demo-a')]: { version: 1, entries: newer } }), { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.equal(p.wrongBook.added.length, 30)
    assert.equal(p.wrongBook.removed.length, 30)
    assert.equal(plan.requiresConfirmation, true)
  })
  test('ίδιο πλήθος καρτών αλλά άλλες κάρτες → εντοπίζεται', () => {
    const s = storeWith({ events: [flip('demo-a', 'a-c1', { t: T0 })], state: {} })
    const plan = planImport(file([flip('demo-a', 'a-c2', { t: T0 + 5 })], { [RS('demo-a')]: { at: iso(T0 + 1) } }), { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.deepEqual([p.cards.added, p.cards.hidden], [['demo-a/a-c2'], ['demo-a/a-c1']])
    assert.equal(plan.requiresConfirmation, true)
  })
  test('opaque κλειδί με διαφορετική τιμή → του αρχείου, με επιβεβαίωση', () => {
    const s = storeWith({ events: [], state: { 'future-key': 1 } })
    const plan = planImport(file([], { 'future-key': 2 }), { storage: s, adapters })
    assert.deepEqual(plan.opaque, [{ key: 'future-key', change: 'changed' }])
    assert.equal(plan.requiresConfirmation, true)
  })
})

describe('J6 · αποκατάσταση μαθήματος unavailable', () => {
  const brokenCl = { [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': 'χαλασμένο' } } }
  test('έγκυρο namespace στο αρχείο → αντικατάσταση, preview + επιβεβαίωση, μετά ready', () => {
    const s = storeWith({ events: [], state: brokenCl })
    const data = file([], { [CL('demo-a')]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: [true], t: T0 } } } })
    const plan = planImport(data, { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.deepEqual([p.statusBefore, p.statusAfter], ['unavailable', 'ready'])
    assert.deepEqual(p.replacedCorrupt, [CL('demo-a')])
    assert.equal(plan.requiresConfirmation, true)
    const { backup } = applyImport(plan, data, { storage: s, adapters, download: noDownload })
    assert.deepEqual(JSON.parse(backup.data.keys[STATE_KEY])[CL('demo-a')], brokenCl[CL('demo-a')], 'η κατεστραμμένη τιμή στο backup')
    assert.deepEqual(course(s, 'demo-a').checklists['a-t1'].items, [true])
  })
  test('το αρχείο δεν έχει το namespace (απόν = κενό) → αντικατάσταση με κενό, με επιβεβαίωση', () => {
    const s = storeWith({ events: [], state: brokenCl })
    const plan = planImport(file(), { storage: s, adapters })
    assert.equal(plan.requiresConfirmation, true)
    applyImport(plan, file(), { storage: s, adapters, download: noDownload })
    assert.deepEqual(course(s, 'demo-a').checklists, {})
  })
  test('unavailable λόγω λάθους τύπου + αρχείο με νεότερο reset που το κρύβει → unavailable → ready, το event μένει', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-c1', { t: T0 })], state: {} })
    const data = file([], { [RS('demo-a')]: { at: iso(T0 + 1) } })
    const plan = planImport(data, { storage: s, adapters })
    const p = planOf(plan, 'demo-a')
    assert.deepEqual([p.statusBefore, p.statusAfter], ['unavailable', 'ready'])
    assert.equal(plan.requiresConfirmation, true)
    applyImport(plan, data, { storage: s, adapters, download: noDownload })
    assert.ok(course(s, 'demo-a'))
    assert.equal(readEvents(s).length, 1)
  })
  test('αρχείο που δεν κρύβει το προβληματικό event → παραμένει unavailable, το import προχωρά για τα υπόλοιπα', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-c1', { t: T0 + 5 })], state: {} })
    const data = file([answer('demo-b', 'b-q1')], { [RS('demo-a')]: { at: iso(T0) } })
    const plan = planImport(data, { storage: s, adapters })
    assert.equal(planOf(plan, 'demo-a').remainsUnavailable, true)
    applyImport(plan, data, { storage: s, adapters, download: noDownload })
    const st = service(s).getSnapshot()
    assert.ok(st.unavailable['demo-a'])
    assert.equal(st.courses['demo-b'].quizAnswered, 1)
  })
})

describe('J6 · αντικατάσταση (το τοπικό store δεν διαβάζεται)', () => {
  test('κατεστραμμένο JSON → mode replace, πάντα επιβεβαίωση, raw backup των αυτούσιων τιμών', () => {
    const s = fakeStorage({ [EVENTS_KEY]: '{oops', [STATE_KEY]: '{}' })
    const data = file([answer('demo-a', 'a-q1')])
    const plan = planImport(data, { storage: s, adapters })
    assert.deepEqual([plan.mode, plan.requiresConfirmation], ['replace', true])
    const { backup } = applyImport(plan, data, { storage: s, adapters, download: noDownload })
    assert.equal(backup.data.keys[EVENTS_KEY], '{oops')
    assert.equal(service(s).getSnapshot().courses['demo-a'].quizAnswered, 1)
  })
  test('αρχείο που δεν δίνει έγκυρη πρόοδο → απόρριψη, τίποτα δεν αλλάζει', () => {
    const s = fakeStorage({ [EVENTS_KEY]: '{oops' })
    assert.throws(() => planImport(file([answer('demo-a', 'a-c1')]), { storage: s, adapters }), (e) => e.name === 'ImportRejected')
    assert.equal(s.getItem(EVENTS_KEY), '{oops')
  })
})

describe('J6 · η προεπισκόπηση δεν παλιώνει (αποτύπωμα)', () => {
  test('αλλαγή από άλλο tab ανάμεσα σε προεπισκόπηση και επιβεβαίωση → StaleImportError, 0 εγγραφές', () => {
    const s = fakeStorage()
    const data = file([answer('demo-a', 'a-q1')])
    const plan = planImport(data, { storage: s, adapters })
    service(s).forCourse('demo-b').markCardSeen('b-c1') // άλλο tab
    const before = s.dump()
    s.writes.length = 0
    assert.throws(() => applyImport(plan, data, { storage: s, adapters, download: noDownload }), (e) => e.name === 'StaleImportError')
    assert.deepEqual(s.writes, [])
    assert.deepEqual(s.dump(), before)
    doImport(s, data) // νέα προεπισκόπηση → εφαρμόζεται
    assert.equal(course(s, 'demo-a').quizAnswered, 1)
  })
  test('σημάδι που εμφανίζεται πριν από την εφαρμογή → PendingTransactionError, 0 εγγραφές', () => {
    const s = fakeStorage()
    const data = file([answer('demo-a', 'a-q1')])
    const plan = planImport(data, { storage: s, adapters })
    s.setItem(TXN_KEY, '{"v":1}')
    s.writes.length = 0
    assert.throws(() => applyImport(plan, data, { storage: s, adapters, download: noDownload }), (e) => e.name === 'PendingTransactionError')
    assert.deepEqual(s.writes, [])
  })
  test('τροποποιημένο αρχείο μετά την προεπισκόπηση → StaleImportError', () => {
    const s = fakeStorage()
    const data = file([answer('demo-a', 'a-q1')])
    const plan = planImport(data, { storage: s, adapters })
    data.events.push(answer('demo-a', 'a-q2'))
    assert.throws(() => applyImport(plan, data, { storage: s, adapters, download: noDownload }), (e) => e.name === 'StaleImportError')
  })
  test('αποτυχία backup → τίποτα δεν εισάγεται', () => {
    const s = fakeStorage()
    const data = file([answer('demo-a', 'a-q1')])
    const plan = planImport(data, { storage: s, adapters })
    s.hooks.fail = (k) => (k.startsWith(BACKUP_KEY_PREFIX) ? quota() : null)
    assert.throws(() => applyImport(plan, data, { storage: s, adapters, download: noDownload }), (e) => e.name === 'BackupError')
    assert.equal(s.getItem(EVENTS_KEY), null)
  })
})
