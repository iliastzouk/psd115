/**
 * Φάση 6a — ProgressService πολλών μαθημάτων πάνω στο νέο store (src/core/progress/storeProgressService.js).
 *
 * Μεταφέρει τις εγγυήσεις του legacy service (1E-4b, Φάσεις 1–3) και προσθέτει J1 (forCourse), J3 (ένα commit / ένα t
 * ανά ενέργεια), J4 (global degraded / unavailable ανά μάθημα), J5 (χρόνοι), απομόνωση μαθημάτων.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { TXN_KEY } from '../src/core/progress/transaction.js'
import { CHECKLISTS_VERSION } from '../src/core/progress/courseProgress.js'
import { EVENTS_KEY, STATE_KEY, T0, answer, fakeStorage, flip, readEvents, readState, service, storeWith, wrongEntry } from './helpers/progressFixtures.mjs'

const wrong = (uid) => ({ uid, question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' })
const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })
const CL_A = 'progress:checklists:demo-a'

describe('εκκίνηση: καμία εγγραφή', () => {
  test('άδειο storage → ready, κενή πρόοδος σε κάθε μάθημα, 0 εγγραφές, κανένα namespace', () => {
    const s = fakeStorage()
    const svc = service(s)
    const st = svc.getSnapshot()
    assert.equal(st.status, 'ready')
    assert.deepEqual(Object.keys(st.courses).sort(), ['demo-a', 'demo-b', 'psd115'])
    for (const c of Object.values(st.courses)) assert.deepEqual([c.quizAnswered, c.flashcardSeenIds, c.wrongBook, c.checklists], [0, [], [], {}])
    assert.deepEqual(s.writes, [])
    assert.deepEqual(s.dump(), {})
  })
  test('με δεδομένα → οι τιμές από την πρώτη ανάγνωση, 0 εγγραφές, τα κλειδιά byte-identical', () => {
    const s = storeWith({ events: [answer('demo-a', 'a-q1'), flip('demo-a', 'a-c1')], state: {} }, { 'psd115-w1-theme': 'dark', 'psd115-w1-study': '{"legacy":1}' })
    const before = s.dump()
    const st = service(s).getSnapshot()
    assert.equal(st.courses['demo-a'].quizAnswered, 1)
    assert.deepEqual(s.writes, [])
    assert.deepEqual(s.dump(), before, 'και τα legacy / ρυθμίσεις ανέγγιχτα')
  })
  test('getSnapshot: ίδιο αντικείμενο μέχρι πραγματική αλλαγή· deep-frozen', () => {
    const svc = service(fakeStorage())
    const a = svc.getSnapshot()
    assert.equal(svc.getSnapshot(), a)
    assert.ok(Object.isFrozen(a) && Object.isFrozen(a.courses['demo-a']) && Object.isFrozen(a.courses['demo-a'].wrongBook))
    svc.forCourse('demo-a').markCardSeen('a-c1')
    assert.notEqual(svc.getSnapshot(), a)
  })
  test('ενέργεια χωρίς αλλαγή (κάρτα που ήδη είδε) → καμία εγγραφή, κανένα notify, ίδιο snapshot', () => {
    const s = fakeStorage()
    const svc = service(s)
    svc.forCourse('demo-a').markCardSeen('a-c1')
    const before = svc.getSnapshot()
    let n = 0
    svc.subscribe(() => n++)
    s.writes.length = 0
    assert.equal(svc.forCourse('demo-a').markCardSeen('a-c1'), false)
    assert.deepEqual([s.writes, n], [[], 0])
    assert.equal(svc.getSnapshot(), before)
  })
})

describe('J1 · forCourse', () => {
  test('μάθημα που δεν εξυπηρετείται → σφάλμα· supports() / courseIds', () => {
    const svc = service(fakeStorage())
    assert.throws(() => svc.forCourse('psd200'), /δεν εξυπηρετείται/)
    assert.throws(() => svc.forCourse(undefined))
    assert.equal(svc.supports('demo-a'), true)
    assert.equal(svc.supports('psd200'), false)
    assert.equal(svc.forCourse('demo-a'), svc.forCourse('demo-a'), 'σταθερό αντικείμενο ενεργειών')
  })
  test('id άλλου μαθήματος ή ανύπαρκτο → false, καμία εγγραφή', () => {
    const s = fakeStorage()
    const a = service(s).forCourse('demo-a')
    assert.equal(a.answerQuestion({ questionId: 'b-q1', ok: true }), false)
    assert.equal(a.answerQuestion({ questionId: 'nope', ok: true }), false)
    assert.equal(a.answerQuestion({ questionId: 'a-c1', ok: true }), false, 'κάρτα ως ερώτηση')
    assert.equal(a.markCardSeen('b-c1'), false)
    assert.equal(a.markCardSeen('a-q1'), false, 'ερώτηση ως κάρτα')
    assert.throws(() => a.setChecklist('b-t1', [true]), /άγνωστο θέμα/)
    assert.deepEqual(s.writes, [])
  })
})

describe('J3 · ενέργειες', () => {
  test('λάθος απάντηση: event + wrongBook στο ΙΔΙΟ commit, με το ΙΔΙΟ t και το uid του handler', () => {
    const s = fakeStorage()
    const svc = service(s, { now: () => T0 + 7 })
    assert.equal(svc.forCourse('demo-a').answerQuestion({ questionId: 'a-q1', ok: false, wrong: wrong('u-1') }), true)
    const [ev] = readEvents(s)
    const [w] = readState(s)['progress:wrongbook:demo-a'].entries
    assert.equal(ev.t, w.t)
    assert.equal(w.uid, 'u-1')
    assert.equal(w.item, ev.item)
    assert.ok(s.writes.includes(TXN_KEY), 'δύο κλειδιά → συναλλαγή')
    assert.equal(s.getItem(TXN_KEY), null)
  })
  test('checklist: ένα t για την αλλαγή, μόνο το θέμα αλλάζει', () => {
    const s = fakeStorage()
    const a = service(s, { now: () => T0 + 3 }).forCourse('demo-a')
    a.setChecklist('a-t1', [true, false])
    a.setChecklist('a-t2', [false, true])
    const topics = readState(s)[CL_A].topics
    assert.deepEqual(topics['a-t1'], { items: [true, false], t: T0 + 3 })
    assert.deepEqual(topics['a-t2'], { items: [false, true], t: T0 + 4 }, 'H+1: αυστηρά αυξανόμενος χρόνος')
    assert.equal(a.setChecklist('a-t1', [true, false]), false, 'ίδιες τιμές → τίποτα')
  })
  test('αφαίρεση / καθαρισμός λαθών', () => {
    const s = fakeStorage()
    const svc = service(s)
    const a = svc.forCourse('demo-a')
    a.answerQuestion({ questionId: 'a-q1', ok: false, wrong: wrong('u1') })
    a.answerQuestion({ questionId: 'a-q2', ok: false, wrong: wrong('u2') })
    assert.equal(a.removeWrong('u1'), true)
    assert.equal(a.removeWrong('u1'), false)
    assert.deepEqual(svc.getSnapshot().courses['demo-a'].wrongBook.map((w) => w.uid), ['u2'])
    assert.equal(a.clearWrongBook(), true)
    assert.equal(a.clearWrongBook(), false)
    assert.equal(svc.getSnapshot().courses['demo-a'].quizAnswered, 2, 'τα events μένουν')
  })
  test('J5: ρολόι που γυρίζει πίσω → αυστηρά αυξανόμενα t· ποτέ πριν από το reset', () => {
    let clock = T0 + 1000
    const s = storeWith({ events: [], state: { 'progress:reset:demo-a': { at: new Date(T0 + 500).toISOString() } } })
    const a = service(s, { now: () => clock }).forCourse('demo-a')
    a.markCardSeen('a-c1')
    clock = T0 // πίσω, πριν από το reset
    a.markCardSeen('a-c2')
    a.answerQuestion({ questionId: 'a-q1', ok: true })
    const ts = readEvents(s).map((e) => e.t)
    assert.deepEqual(ts, [T0 + 1000, T0 + 1001, T0 + 1002])
  })
})

describe('απομόνωση μαθημάτων', () => {
  test('κάθε ενέργεια στο demo-a αφήνει το snapshot του demo-b ΚΑΙ του psd115 αμετάβλητα', () => {
    const svc = service(fakeStorage())
    const b = svc.getSnapshot().courses['demo-b']
    const p = svc.getSnapshot().courses.psd115
    const a = svc.forCourse('demo-a')
    a.answerQuestion({ questionId: 'a-q1', ok: false, wrong: wrong('x') })
    a.markCardSeen('a-c1')
    a.setChecklist('a-t1', [true])
    a.removeWrong('x')
    assert.deepEqual(svc.getSnapshot().courses['demo-b'], b)
    assert.deepEqual(svc.getSnapshot().courses.psd115, p)
    assert.equal(svc.getSnapshot().courses['demo-a'].quizAnswered, 1)
  })
})

describe('J4 · unavailable μόνο για ένα μάθημα', () => {
  const corrupt = () =>
    storeWith({
      events: [answer('demo-a', 'a-q1', { t: T0 }), flip('demo-a', 'a-c1', { t: T0 + 1 })],
      state: { [CL_A]: { version: CHECKLISTS_VERSION, topics: { 'a-t1': { items: 'χαλασμένο' } } }, 'progress:wrongbook:demo-a': { version: 1, entries: [] } },
    })
  test('το demo-a (κατεστραμμένο checklist) είναι unavailable: χωρίς πρόοδο, καμία ενέργεια', () => {
    const s = corrupt()
    const svc = service(s)
    const st = svc.getSnapshot()
    assert.equal(st.status, 'ready')
    assert.ok(st.unavailable['demo-a']?.length)
    assert.equal(st.courses['demo-a'], undefined)
    const a = svc.forCourse('demo-a')
    assert.deepEqual([a.answerQuestion({ questionId: 'a-q2', ok: true }), a.markCardSeen('a-c2'), a.setChecklist('a-t2', [true]), a.clearWrongBook()], [false, false, false, false])
    assert.deepEqual(s.writes, [])
  })
  test('απάντηση, κάρτα, checklist, λάθος στο demo-b → αποθηκεύονται· τα δεδομένα του demo-a μένουν ίδια σε τιμή', () => {
    const s = corrupt()
    const before = { events: readEvents(s).filter((e) => e.item.startsWith('demo-a/')), state: readState(s) }
    const b = service(s).forCourse('demo-b')
    assert.equal(b.answerQuestion({ questionId: 'b-q1', ok: false, wrong: wrong('wb') }), true)
    assert.equal(b.markCardSeen('b-c1'), true)
    assert.equal(b.setChecklist('b-t1', [true]), true)
    assert.equal(b.removeWrong('wb'), true)
    const after = readState(s)
    assert.deepEqual(after[CL_A], before.state[CL_A], 'το κατεστραμμένο namespace αυτούσιο (σε τιμή)')
    assert.deepEqual(after['progress:wrongbook:demo-a'], before.state['progress:wrongbook:demo-a'])
    assert.deepEqual(readEvents(s).filter((e) => e.item.startsWith('demo-a/')), before.events, 'όλα τα events του demo-a, ίδια σειρά και περιεχόμενο')
    const st = service(s).getSnapshot()
    assert.equal(st.courses['demo-b'].quizAnswered, 1)
    assert.ok(st.unavailable['demo-a'])
  })
  test('event λάθος τύπου στο demo-a → unavailable το demo-a, ready το demo-b', () => {
    const st = service(storeWith({ events: [answer('demo-a', 'a-c1')], state: {} })).getSnapshot()
    assert.ok(st.unavailable['demo-a'])
    assert.ok(st.courses['demo-b'])
  })
  test('orphan event → ready με προειδοποίηση, δεν μετρά', () => {
    const st = service(storeWith({ events: [answer('demo-a', 'removed-q')], state: {} })).getSnapshot()
    assert.equal(st.courses['demo-a'].quizAnswered, 0)
    assert.ok(st.warnings.some((w) => w.includes('orphan')))
  })
  test('events μαθήματος χωρίς adapter → opaque: κρατιούνται, προειδοποίηση, όλα τα μαθήματα ready', () => {
    const s = storeWith({ events: [answer('psd210', 'x')], state: {} })
    const svc = service(s)
    assert.ok(svc.getSnapshot().warnings.some((w) => w.startsWith('psd210')))
    svc.forCourse('demo-a').markCardSeen('a-c1')
    assert.equal(readEvents(s)[0].item, 'psd210/x', 'κρατιέται στο log')
  })
})

describe('J4 · global degraded: καμία εγγραφή για κανένα μάθημα', () => {
  const cases = [
    ['events άκυρο JSON', () => fakeStorage({ [EVENTS_KEY]: '{oops' }), 'corrupt'],
    ['state άκυρο JSON', () => fakeStorage({ [STATE_KEY]: '[1' }), 'corrupt'],
    ['state πίνακας', () => fakeStorage({ [STATE_KEY]: '[]' }), 'corrupt'],
    ['event με άκυρο schema', () => storeWith({ events: [{ ...answer('demo-a', 'a-q1'), kind: 'x' }] }), 'corrupt'],
    ['διπλό id με άλλο περιεχόμενο', () => storeWith({ events: [answer('demo-a', 'a-q1', { id: '00000000-0000-4000-8000-000000000999' }), answer('demo-a', 'a-q2', { id: '00000000-0000-4000-8000-000000000999' })] }), 'corrupt'],
    ['item που δεν είναι global id', () => storeWith({ events: [{ ...answer('demo-a', 'a-q1'), item: 'plain' }] }), 'corrupt'],
    ['εκκρεμές σημάδι συναλλαγής', () => fakeStorage({ [TXN_KEY]: '{"v":1}' }), 'pending'],
  ]
  for (const [label, make, reason] of cases) {
    test(label, () => {
      const s = make()
      const before = s.dump()
      const svc = service(s)
      assert.equal(svc.getSnapshot().status, 'degraded')
      assert.equal(svc.getSnapshot().reason, reason)
      assert.deepEqual(svc.getSnapshot().courses, {})
      for (const c of ['demo-a', 'demo-b']) {
        assert.equal(svc.forCourse(c).answerQuestion({ questionId: `${c.at(-1)}-q1`, ok: true }), false)
        assert.equal(svc.forCourse(c).markCardSeen(`${c.at(-1)}-c1`), false)
      }
      assert.deepEqual(s.writes, [])
      assert.deepEqual(s.dump(), before)
    })
  }
  test('ο έλεγχος του σημαδιού πετάει → fail-closed (pending), καμία εξαίρεση προς τον καλούντα', () => {
    const s = fakeStorage()
    const get = s.getItem
    s.getItem = (k) => {
      if (k === TXN_KEY) throw new Error('blocked')
      return get(k)
    }
    assert.equal(service(s).getSnapshot().reason, 'pending')
  })
  test('μη ασφαλής ανάκτηση στην εκκίνηση → unrecoverable', () => {
    for (const status of ['failed', 'corrupt-marker']) assert.equal(service(fakeStorage(), { recovery: { status } }).getSnapshot().reason, 'unrecoverable')
  })
  test('χωρίς storage → no-storage, η εφαρμογή δεν σπάει', () => {
    assert.equal(service(undefined).getSnapshot().reason, 'no-storage')
  })
  test('σημάδι που εμφανίζεται κατά τη λειτουργία → degraded στην επόμενη ενέργεια, η αλλαγή ΔΕΝ εφαρμόζεται', () => {
    const s = fakeStorage()
    const svc = service(s)
    s.setItem(TXN_KEY, '{"v":1}')
    s.writes.length = 0
    assert.equal(svc.forCourse('demo-a').markCardSeen('a-c1'), false)
    assert.equal(svc.getSnapshot().reason, 'pending')
    assert.deepEqual(s.writes, [])
  })
})

describe('Φάση 2 · αποτυχία εγγραφής χωρίς σημάδι', () => {
  test('η αλλαγή ΔΕΝ εφαρμόζεται· ready· writeFailure· άσχετη επιτυχία δεν το καθαρίζει· η ίδια αλλαγή ξανά → καθαρίζει', () => {
    const s = fakeStorage()
    const svc = service(s)
    const a = svc.forCourse('demo-a')
    s.hooks.fail = (k) => (k === STATE_KEY ? quota() : null)
    assert.equal(a.setChecklist('a-t1', [true]), false)
    assert.equal(svc.getSnapshot().status, 'ready')
    assert.equal(svc.getSnapshot().writeFailure.kind, 'quota')
    assert.equal(svc.getSnapshot().courses['demo-a'].checklists['a-t1'], undefined, 'μνήμη ≡ storage')
    s.hooks.fail = null
    assert.equal(a.markCardSeen('a-c1'), true, 'άσχετη επιτυχής εγγραφή')
    assert.equal(svc.getSnapshot().writeFailure?.kind, 'quota', 'η ειδοποίηση μένει')
    assert.equal(a.setChecklist('a-t1', [true]), true, 'ο χρήστης επαναλαμβάνει')
    assert.equal(svc.getSnapshot().writeFailure, null)
  })
  test('αποτυχημένη απάντηση: καθαρίζει όταν ξαναγίνει απάντηση με το ίδιο αποτέλεσμα στην ίδια ερώτηση', () => {
    const s = fakeStorage()
    const svc = service(s)
    const a = svc.forCourse('demo-a')
    s.hooks.fail = (k) => (k === EVENTS_KEY ? quota() : null)
    assert.equal(a.answerQuestion({ questionId: 'a-q1', ok: true }), false)
    s.hooks.fail = null
    a.answerQuestion({ questionId: 'a-q1', ok: false, wrong: wrong('z') })
    assert.ok(svc.getSnapshot().writeFailure, 'λάθος απάντηση ≠ η σωστή που απέτυχε')
    a.answerQuestion({ questionId: 'a-q1', ok: true })
    assert.equal(svc.getSnapshot().writeFailure, null)
  })
  test('dismissWriteFailure: κρύβει την ειδοποίηση, δεν αλλάζει snapshot ή storage', () => {
    const s = fakeStorage()
    const svc = service(s)
    s.hooks.fail = () => quota()
    svc.forCourse('demo-a').markCardSeen('a-c1')
    s.hooks.fail = null
    const courses = svc.getSnapshot().courses
    const dump = s.dump()
    svc.dismissWriteFailure()
    assert.equal(svc.getSnapshot().writeFailure, null)
    assert.equal(svc.getSnapshot().courses, courses)
    assert.deepEqual(s.dump(), dump)
  })
  test('αποτυχία με rollback που δεν ολοκληρώθηκε (σημάδι μένει) → degraded pending, η αλλαγή δεν εφαρμόζεται', () => {
    const s = fakeStorage()
    const svc = service(s)
    // Γράφεται το σημάδι, αποτυγχάνει το events key ΚΑΙ η αναίρεση (removeItem/setItem του before).
    s.hooks.fail = (k) => (k === STATE_KEY ? quota() : null)
    s.hooks.failRemove = (k) => (k === EVENTS_KEY || k === TXN_KEY ? new Error('nope') : null)
    assert.equal(svc.forCourse('demo-a').answerQuestion({ questionId: 'a-q1', ok: false, wrong: wrong('q') }), false)
    assert.equal(svc.getSnapshot().status, 'degraded')
    assert.equal(svc.getSnapshot().reason, 'pending')
  })
  test('προγραμματιστικό σφάλμα (άκυρο checklist) πετάει, δεν γίνεται writeFailure', () => {
    const svc = service(fakeStorage())
    assert.throws(() => svc.forCourse('demo-a').setChecklist('a-t1', ['x']))
    assert.equal(svc.getSnapshot().writeFailure, null)
  })
})

describe('resync / refresh', () => {
  test('resync: νέα ανάγνωση, notify· καθαρίζει την ειδοποίηση', () => {
    const s = fakeStorage()
    const svc = service(s)
    s.hooks.fail = () => quota()
    svc.forCourse('demo-a').markCardSeen('a-c1')
    s.hooks.fail = null
    s.setItem(EVENTS_KEY, JSON.stringify([answer('demo-a', 'a-q1')]))
    let n = 0
    svc.subscribe(() => n++)
    svc.resync()
    assert.equal(n, 1)
    assert.equal(svc.getSnapshot().writeFailure, null)
    assert.equal(svc.getSnapshot().courses['demo-a'].quizAnswered, 1)
  })
  test('wrongBook entry με t από το store δεν εμφανίζεται πριν από το reset (ίδιος κανόνας με τον υπολογισμό)', () => {
    const R = T0 + 100
    const st = service(storeWith({ events: [], state: { 'progress:reset:demo-a': { at: new Date(R).toISOString() }, 'progress:wrongbook:demo-a': { version: 1, entries: [wrongEntry('demo-a', 'a-q1', { t: R - 1 })] } } })).getSnapshot()
    assert.deepEqual(st.courses['demo-a'].wrongBook, [])
  })
})

describe('Φάση 2 · διάρκεια της ειδοποίησης writeFailure (6b: από το legacy progressWriteFailure)', () => {
  const other = () => new Error('x')
  /** Service με ρολόι που προχωρά, ώστε κάθε αποτυχία να έχει δικό της `at`. */
  const app = () => {
    const s = fakeStorage()
    let t = T0
    const svc = service(s, { now: () => ++t })
    return { s, svc, a: svc.forCourse('demo-a'), b: svc.forCourse('demo-b'), wf: () => svc.getSnapshot().writeFailure }
  }

  test('δύο αποτυχίες σε διαφορετικά στοιχεία, επανάληψη ΜΟΝΟ της μίας → η ειδοποίηση μένει', () => {
    const { s, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    a.markCardSeen('a-c1')
    s.hooks.fail = null
    assert.equal(a.setChecklist('a-t1', [true]), true)
    assert.equal(wf()?.kind, 'quota')
    assert.equal(a.markCardSeen('a-c1'), true)
    assert.equal(wf(), null, 'καθαρίζει μόνο όταν γίνουν ΚΑΙ οι δύο')
  })
  test('διαφορετικού τύπου (quota, other): επανάληψη της 2ης → δείχνει την 1η με το δικό της kind', () => {
    const { s, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = () => other()
    a.markCardSeen('a-c1')
    s.hooks.fail = null
    assert.equal(wf().kind, 'other', 'δείχνει την τελευταία')
    a.markCardSeen('a-c1')
    assert.equal(wf().kind, 'quota')
    a.setChecklist('a-t1', [true])
    assert.equal(wf(), null)
  })
  test('επανάληψη της 1ης (παλαιότερης) → μένει η 2η, με το δικό της kind και at', () => {
    const { s, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = () => other()
    a.markCardSeen('a-c1')
    const second = wf()
    s.hooks.fail = null
    a.setChecklist('a-t1', [true])
    assert.deepEqual(wf(), second)
  })
  test('τρεις αποτυχίες (quota, other, quota), επανάληψη μόνο της 3ης → η ειδοποίηση είναι της 2ης', () => {
    const { s, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = () => other()
    a.markCardSeen('a-c1')
    const second = wf()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t2', [true])
    s.hooks.fail = null
    a.setChecklist('a-t2', [true])
    assert.deepEqual(wf(), second)
  })
  test('άλλη αλλαγή στο ΙΔΙΟ θέμα (όχι η χαμένη) δεν καθαρίζει την ειδοποίηση', () => {
    const { s, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = null
    assert.equal(a.setChecklist('a-t1', [false, true]), true)
    assert.equal(wf()?.kind, 'quota')
  })
  test('dismiss → μια επόμενη (άσχετη) επιτυχία δεν ξαναφέρνει την παλιά· νέα αποτυχία → νέα ειδοποίηση', () => {
    const { s, svc, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    svc.dismissWriteFailure()
    s.hooks.fail = null
    a.markCardSeen('a-c2')
    assert.equal(wf(), null)
    s.hooks.fail = () => other()
    a.markCardSeen('a-c3')
    assert.equal(wf()?.kind, 'other')
    s.hooks.fail = null
    a.markCardSeen('a-c3')
    assert.equal(wf(), null, 'η αλλαγή πριν από το dismiss δεν μετρά πια ως εκκρεμής')
  })
  test('resync (π.χ. μετά από reset) → καμία παλιά εκκρεμότητα, ούτε μετά από επόμενη εγγραφή', () => {
    const { s, svc, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = null
    svc.resync()
    assert.equal(wf(), null)
    a.markCardSeen('a-c1')
    assert.equal(wf(), null)
  })
  test('ενέργεια χωρίς αλλαγή (κάρτα που ήδη είδε / ίδιο checklist) ΔΕΝ καθαρίζει την ειδοποίηση', () => {
    const { s, a, wf } = app()
    a.markCardSeen('a-c1')
    a.setChecklist('a-t2', [true])
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = null
    assert.equal(a.markCardSeen('a-c1'), false)
    assert.equal(a.setChecklist('a-t2', [true]), false)
    assert.equal(wf()?.kind, 'quota')
  })
  test('διαδοχικές αποτυχίες → το writeFailure ανανεώνεται (νέο at, νέο αντικείμενο)', () => {
    const { s, a, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    const first = wf()
    a.setChecklist('a-t2', [true])
    assert.ok(wf().at > first.at)
    assert.notEqual(wf(), first)
  })
  test('removeWrong / clearWrongBook που απέτυχαν: καθαρίζουν όταν επαναληφθούν', () => {
    const { s, a, wf } = app()
    a.answerQuestion({ questionId: 'a-q1', ok: false, wrong: wrong('u1') })
    s.hooks.fail = () => quota()
    assert.equal(a.removeWrong('u1'), false)
    s.hooks.fail = null
    assert.equal(a.markCardSeen('a-c2'), true)
    assert.equal(wf()?.kind, 'quota', 'άσχετη επιτυχία δεν το καθαρίζει')
    assert.equal(a.removeWrong('u1'), true)
    assert.equal(wf(), null)
    a.answerQuestion({ questionId: 'a-q2', ok: false, wrong: wrong('u2') })
    s.hooks.fail = () => quota()
    assert.equal(a.clearWrongBook(), false)
    s.hooks.fail = null
    a.markCardSeen('a-c1')
    assert.equal(wf()?.kind, 'quota', 'άσχετη επιτυχία δεν το καθαρίζει')
    assert.equal(a.clearWrongBook(), true)
    assert.equal(wf(), null)
  })
  test('επιτυχής εγγραφή ΑΛΛΟΥ μαθήματος δεν καθαρίζει την ειδοποίηση· η επανάληψη στο ίδιο μάθημα ναι', () => {
    const { s, a, b, wf } = app()
    s.hooks.fail = () => quota()
    a.setChecklist('a-t1', [true])
    s.hooks.fail = null
    assert.equal(b.setChecklist('b-t1', [true]), true)
    assert.equal(wf()?.kind, 'quota')
    a.setChecklist('a-t1', [true])
    assert.equal(wf(), null)
  })
})
