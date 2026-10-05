/**
 * Tests του frozen legacy baseline (Phase 1E-2). Run: npm test
 *
 * Fixtures:
 *  - progress-export.production-2026-10-05.json — AUTHORITATIVE (πραγματικό production export, v2, αμετάβλητο)
 *  - progress-export.production-2026-09-28.json — ιστορικό (v1), για συμβατότητα
 *  - progress-export.sample.json                — συνθετικό (v1)
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { newEventId } from '../src/core/progress/events.js'
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../src/core/progress/progressStore.js'
import {
  buildLegacyBaseline,
  LEGACY_BASELINE_KEY,
  legacySourceHash,
  MIGRATION_MARKER_KEY,
  visibleProgress,
} from '../src/core/progress/legacyBaseline.js'
import { sha256Hex } from '../src/core/progress/sha256.js'
import { LEGACY_BASELINE_MIGRATION_ENABLED, migrateLegacyBaseline } from '../src/utils/progressMigration.js'
import { TXN_KEY } from '../src/utils/progressTransaction.js'
import { validateExport } from '../src/utils/progressValidate.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = (name) => path.join(root, 'tests/fixtures', name)
const readFixture = (name) => JSON.parse(fs.readFileSync(fixturePath(name), 'utf8'))

const PROD = 'progress-export.production-2026-10-05.json'
const HISTORICAL = 'progress-export.production-2026-09-28.json'
const SAMPLE = 'progress-export.sample.json'
/** Αποτύπωμα του αρχείου (bytes) και source hash του legacy payload του. Αλλαγή στο fixture → αποτυγχάνει. */
const PROD_FILE_SHA256 = 'e922a7f636153a635f7dea521faabc14cda452f34fdab6764c941e2a04a07737'
const PROD_SOURCE_HASH = 'sha256:57a13dadacaac44f3d1f7545add213cdbe9618862c99209385b46bfd8e6bde3f'

const T0 = Date.UTC(2026, 9, 6, 10, 0, 0)
const fixed = (t) => () => t
const noBackup = () => {}

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init))
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
}
const legacyOnly = (dump) => Object.fromEntries(Object.entries(dump).filter(([k]) => k.startsWith('psd115-')))
const migrate = (storage, now = T0) => migrateLegacyBaseline({ storage, now: fixed(now), enabled: true, backup: noBackup })

/** Ό,τι δείχνει ΣΗΜΕΡΑ το legacy σύστημα (ίδια λογική με storage.loadProgress + τα checklists ανά κλειδί). */
function legacyVisible(keys) {
  const raw = keys['psd115-w1-study']
  const d = raw ? JSON.parse(raw) : {}
  return {
    quizAnswered: d.quizAnswered ?? 0,
    quizCorrect: d.quizCorrect ?? 0,
    byCategory: d.byCategory ?? {},
    flashcardSeenIds: d.flashcardSeenIds ?? [],
    wrongBook: d.wrongBook ?? [],
  }
}

describe('authoritative production fixture (2026-10-05)', () => {
  const data = readFixture(PROD)
  test('το αρχείο είναι αμετάβλητο (SHA-256 των bytes)', () => {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(fixturePath(PROD))).digest('hex'), PROD_FILE_SHA256)
  })
  test('επιβεβαίωση από το ίδιο το αρχείο: v2, άδειο νέο store, χωρίς migration, έγκυρο', () => {
    assert.equal(data.format, 'psd115-progress-export')
    assert.equal(data.version, 2)
    assert.equal(data.source, 'psd115.vercel.app')
    assert.deepEqual(data.progressStore, {})
    assert.equal(data.migration.marker, null)
    assert.equal(Object.keys(data.keys).length, 12)
    assert.ok(validateExport(data).ok)
  })
  test('source hash του fixture = αναμενόμενο', () => {
    assert.equal(legacySourceHash(data.keys), PROD_SOURCE_HASH)
  })
})

describe('source hash', () => {
  const keys = readFixture(PROD).keys
  test('SHA-256 σε pure JS = node:crypto', () => {
    for (const s of ['', 'abc', JSON.stringify(keys), 'ελληνικά 🙂'.repeat(100)]) {
      assert.equal(sha256Hex(s), crypto.createHash('sha256').update(s).digest('hex'))
    }
  })
  test('ντετερμινιστικό: ανεξάρτητο από σειρά κλειδιών και exportedAt', () => {
    const reversed = Object.fromEntries(Object.entries(keys).reverse())
    assert.equal(legacySourceHash(reversed), PROD_SOURCE_HASH)
    const other = { ...readFixture(PROD), exportedAt: '2030-01-01T00:00:00.000Z' }
    assert.equal(legacySourceHash(other.keys), PROD_SOURCE_HASH)
  })
  test('οποιαδήποτε αλλαγή στο payload αλλάζει το hash', () => {
    assert.notEqual(legacySourceHash({ ...keys, 'psd115-w1-theme': 'dark' }), PROD_SOURCE_HASH)
    const { ['psd115-w1-theme']: _, ...without } = keys
    assert.notEqual(legacySourceHash(without), PROD_SOURCE_HASH)
  })
})

describe('baseline του production fixture', () => {
  const data = readFixture(PROD)
  const r = buildLegacyBaseline(data.keys, { now: fixed(T0) })
  const study = JSON.parse(data.keys['psd115-w1-study'])

  test('έγκυρο, χωρίς προειδοποιήσεις', () => {
    assert.equal(r.ok, true, JSON.stringify(r.errors))
    assert.deepEqual(r.warnings, [])
  })
  test('ακριβές σχήμα και τιμές', () => {
    const b = r.baseline
    assert.deepEqual(Object.keys(b), ['format', 'version', 'courseId', 'sourceHash', 'capturedAt', 'raw', 'progress'])
    assert.equal(b.format, 'legacy-baseline')
    assert.equal(b.version, 1)
    assert.equal(b.courseId, 'psd115')
    assert.equal(b.sourceHash, PROD_SOURCE_HASH)
    assert.equal(b.capturedAt, new Date(T0).toISOString())
    assert.deepEqual(b.raw, data.keys, 'το raw snapshot είναι αυτούσιο (όλα τα 12 κλειδιά)')
    assert.equal(b.progress.quizAnswered, 1)
    assert.equal(b.progress.quizCorrect, 0)
    assert.deepEqual(b.progress.byCategory, { 'w2-variables': { correct: 0, wrong: 1 } })
    assert.equal(b.progress.flashcardSeenIds.length, 21)
    assert.deepEqual(b.progress.flashcardSeenIds, study.flashcardSeenIds, 'ίδιο σύνολο και σειρά')
    assert.equal(b.progress.wrongBook.length, 1)
  })
  test('wrongBook: ολόκληρες οι εγγραφές, πεδίο προς πεδίο', () => {
    assert.deepEqual(r.baseline.progress.wrongBook, study.wrongBook)
    const w = r.baseline.progress.wrongBook[0]
    assert.equal(w.uid, 'bdf43c65-272e-4c5b-8219-cd9983bbf9db')
    assert.equal(w.id, 'q-w2-var-4')
    assert.equal(w.categoryId, 'w2-variables')
    assert.equal(w.userLabel, 'Τυχαία σχέση')
    assert.equal(w.correctLabel, 'Τέλεια θετική συσχέτιση')
  })
  test('checklists: 9 legacy κλειδιά → 10 θέματα με canonical topicId, ίδιες τιμές', () => {
    const c = r.baseline.progress.checklists
    const expected = {
      definition: ['psd115-w1-definition-checklist', 5],
      functionalism: ['psd115-w1-functionalism-checklist', 5],
      humanistic: ['psd115-w1-humanistic-checklist', 5],
      pavlov: ['psd115-w1-pavlov-checklist', 9],
      psychoanalysis: ['psd115-w1-psychoanalysis-checklist', 7],
      wundt: ['psd115-w1-wundt-checklist', 5],
      'research-methods-overview': ['psd115-w2-checklists#overview', 3],
      empiricism: ['psd115-w2-checklists#empiricism', 4],
      'neurobiology-overview': ['psd115-w3-checklists#overview', 2],
      'sensation-perception-overview': ['psd115-w4-checklists#overview', 2],
    }
    assert.deepEqual(Object.keys(c).sort(), Object.keys(expected).sort())
    for (const [topicId, [legacyKey, n]] of Object.entries(expected)) {
      assert.equal(c[topicId].legacyKey, legacyKey, topicId)
      const [key, slug] = legacyKey.split('#')
      const raw = JSON.parse(data.keys[key])
      assert.deepEqual(c[topicId].items, slug ? raw[slug] : raw, topicId)
      assert.equal(c[topicId].items.length, n, topicId)
    }
    assert.equal(Object.keys(data.keys).filter((k) => /checklist/.test(k)).length, 9)
  })
  test('marker', () => {
    assert.deepEqual(r.marker, {
      version: 1,
      at: new Date(T0).toISOString(),
      sourceHash: PROD_SOURCE_HASH,
      baselineKey: LEGACY_BASELINE_KEY,
      baselineVersion: 1,
    })
  })
})

describe('conservation: legacy visible == baseline visible', () => {
  for (const name of [PROD, HISTORICAL, SAMPLE]) {
    test(name, () => {
      const keys = readFixture(name).keys
      const r = buildLegacyBaseline(keys, { now: fixed(T0) })
      assert.equal(r.ok, true, JSON.stringify(r.errors))
      const v = visibleProgress({ baseline: r.baseline })
      const l = legacyVisible(keys)
      assert.equal(v.quizAnswered, l.quizAnswered)
      assert.equal(v.quizCorrect, l.quizCorrect)
      assert.deepEqual(v.byCategory, l.byCategory, 'πλήρες byCategory')
      assert.deepEqual(v.flashcardSeenIds, l.flashcardSeenIds)
      assert.deepEqual(v.wrongBook, l.wrongBook)
      for (const [topicId, c] of Object.entries(v.checklists)) {
        const [key, slug] = c.legacyKey.split('#')
        const raw = JSON.parse(keys[key])
        assert.deepEqual(c.items, slug ? raw[slug] : raw, `${name}: ${topicId}`)
      }
    })
  }
  test('production fixture: συγκεκριμένες τιμές', () => {
    const v = visibleProgress({ baseline: buildLegacyBaseline(readFixture(PROD).keys, { now: fixed(T0) }).baseline })
    assert.equal(v.quizAnswered, 1)
    assert.equal(v.quizCorrect, 0)
    assert.equal(v.wrongBook.length, 1)
    assert.equal(v.flashcardSeenIds.length, 21)
    assert.equal(Object.keys(v.checklists).length, 10)
  })
})

describe('migration πάνω σε storage (fake)', () => {
  const keys = readFixture(PROD).keys

  test('ανενεργό από προεπιλογή: χωρίς enabled → καμία ανάγνωση/εγγραφή', async () => {
    assert.equal(LEGACY_BASELINE_MIGRATION_ENABLED, false)
    const s = fakeStorage({ ...keys })
    const before = s.dump()
    assert.deepEqual(await migrateLegacyBaseline({ storage: s, backup: noBackup }), { status: 'disabled' })
    assert.deepEqual(s.dump(), before)
  })

  test('migrated: legacy αμετάβλητο, μηδέν events, state = baseline + marker μόνο', async () => {
    const s = fakeStorage({ ...keys })
    let backups = 0
    const r = await migrateLegacyBaseline({ storage: s, now: fixed(T0), enabled: true, backup: () => (backups += 1) })
    assert.equal(r.status, 'migrated')
    assert.equal(r.sourceHash, PROD_SOURCE_HASH)
    assert.equal(backups, 1, 'safety backup πριν από την εγγραφή')
    const d = s.dump()
    assert.deepEqual(legacyOnly(d), keys, 'τα psd115-* byte-για-byte ίδια')
    assert.equal(d[EVENTS_KEY], undefined, 'κανένα κλειδί events')
    assert.equal(d[TXN_KEY], undefined)
    const state = JSON.parse(d[STATE_KEY])
    assert.deepEqual(Object.keys(state).sort(), [LEGACY_BASELINE_KEY, MIGRATION_MARKER_KEY].sort())
    assert.equal(state[MIGRATION_MARKER_KEY].sourceHash, PROD_SOURCE_HASH)
    assert.deepEqual(state[LEGACY_BASELINE_KEY], buildLegacyBaseline(keys, { now: fixed(T0) }).baseline)
  })

  test('no fake history: query() = [] και το μόνο timestamp είναι του migration', async () => {
    const s = fakeStorage({ ...keys })
    await migrate(s)
    const store = createProgressStore({ storage: s })
    assert.deepEqual(await store.query(), [])
    for (const kind of ['answer', 'flip', 'self']) assert.deepEqual(await store.query({ kind }), [])
    const state = JSON.parse(s.getItem(STATE_KEY))
    const iso = new Date(T0).toISOString()
    assert.equal(state[MIGRATION_MARKER_KEY].at, iso)
    assert.equal(state[LEGACY_BASELINE_KEY].capturedAt, iso)
    // Κανένα άλλο timestamp-τύπου πεδίο μέσα στο baseline εκτός από το capturedAt.
    const json = JSON.stringify(state[LEGACY_BASELINE_KEY].progress)
    assert.doesNotMatch(json, /"(t|at|time|timestamp|capturedAt)":/)
  })

  test('idempotency: ίδια πηγή → no-op (ίδιο baseline, ίδιο marker, κανένα event)', async () => {
    const s = fakeStorage({ ...keys })
    await migrate(s, T0)
    const after1 = s.dump()
    const r2 = await migrate(s, T0 + 86_400_000)
    assert.deepEqual(r2, { status: 'already-migrated', sourceHash: PROD_SOURCE_HASH })
    assert.deepEqual(s.dump(), after1)
    assert.equal(visibleProgress({ baseline: JSON.parse(s.getItem(STATE_KEY))[LEGACY_BASELINE_KEY] }).quizAnswered, 1)
  })

  test('conflict: marker με διαφορετικό source hash → ρητή άρνηση, καμία εγγραφή', async () => {
    const s = fakeStorage({ ...keys })
    await migrate(s)
    s.setItem('psd115-w1-theme', 'dark') // η legacy πηγή άλλαξε μετά το migration
    const before = s.dump()
    const r = await migrate(s, T0 + 1000)
    assert.equal(r.status, 'conflict')
    assert.match(r.errors[0], /διαφορετικό source hash/)
    assert.deepEqual(s.dump(), before)
  })

  test('conflict: baseline χωρίς marker → ρητή άρνηση', async () => {
    const s = fakeStorage({ ...keys, [STATE_KEY]: JSON.stringify({ [LEGACY_BASELINE_KEY]: { sourceHash: 'x' } }) })
    const before = s.dump()
    const r = await migrate(s)
    assert.equal(r.status, 'conflict')
    assert.match(r.errors[0], /baseline χωρίς σημάδι/)
    assert.deepEqual(s.dump(), before)
  })

  test('διατηρεί άλλα κλειδιά state που υπάρχουν ήδη', async () => {
    const s = fakeStorage({ ...keys, [STATE_KEY]: JSON.stringify({ other: 1 }) })
    await migrate(s)
    assert.equal(JSON.parse(s.getItem(STATE_KEY)).other, 1)
  })

  test('ιστορικό (28/9) και sample (v1): έγκυρες είσοδοι migration', async () => {
    for (const name of [HISTORICAL, SAMPLE]) {
      const k = readFixture(name).keys
      const s = fakeStorage({ ...k })
      assert.equal((await migrate(s)).status, 'migrated', name)
      assert.deepEqual(legacyOnly(s.dump()), k, name)
    }
  })
})

describe('baseline + πραγματικό μελλοντικό event (χωρίς διπλομέτρηση)', () => {
  test('μία νέα απάντηση: quizAnswered 1 → 2, ένα πραγματικό event', async () => {
    const keys = readFixture(PROD).keys
    const s = fakeStorage({ ...keys })
    await migrate(s, T0)
    const T1 = T0 + 3_600_000
    const store = createProgressStore({ storage: s, now: fixed(T1) })
    await store.append({ id: newEventId(), t: T1, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 1, ctx: 'quiz' })

    const events = await store.query()
    assert.equal(events.length, 1)
    assert.equal(events[0].item, 'psd115/q-w2-var-1')
    assert.equal(events[0].ctx, 'quiz')
    assert.equal(events[0].t, T1, 'πραγματικός χρόνος του event, όχι του migration')

    const baseline = JSON.parse(s.getItem(STATE_KEY))[LEGACY_BASELINE_KEY]
    const v = visibleProgress({ baseline, events })
    assert.equal(v.quizAnswered, 2)
    assert.equal(v.quizCorrect, 1)
    assert.deepEqual(v.byCategory, { 'w2-variables': { correct: 1, wrong: 1 } })
    assert.equal(v.wrongBook.length, 1, 'το wrongBook δεν παράγεται από answer events')
    assert.deepEqual(baseline.progress.byCategory, { 'w2-variables': { correct: 0, wrong: 1 } }, 'το baseline δεν άλλαξε')
    assert.deepEqual(legacyOnly(s.dump()), keys)
  })
  test('λάθος απάντηση δεν προσθέτει στο wrongBook (state, όχι projection)', () => {
    const baseline = buildLegacyBaseline(readFixture(PROD).keys, { now: fixed(T0) }).baseline
    const ev = { id: newEventId(), t: T0 + 1, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 0, ctx: 'quiz' }
    const v = visibleProgress({ baseline, events: [ev] })
    assert.equal(v.quizAnswered, 2)
    assert.equal(v.wrongBook.length, 1)
  })
  test('κάρτες: ήδη μελετημένη δεν ξαναμετριέται· νέα προστίθεται (21 → 22)', () => {
    const baseline = buildLegacyBaseline(readFixture(PROD).keys, { now: fixed(T0) }).baseline
    const flip = (id) => ({ id: newEventId(), t: T0 + 1, item: `psd115/${id}`, kind: 'flip', ctx: 'flash' })
    assert.equal(visibleProgress({ baseline, events: [flip('fc-def-1')] }).flashcardSeenIds.length, 21)
    assert.equal(visibleProgress({ baseline, events: [flip('fc-def-1'), flip('fc-pavlov-1')] }).flashcardSeenIds.length, 22)
  })
  test('απαντήσεις mini κουίζ (ctx lesson) δεν μετρούν στο κουίζ (ίδιο εύρος με το legacy)', () => {
    const baseline = buildLegacyBaseline(readFixture(PROD).keys, { now: fixed(T0) }).baseline
    const ev = { id: newEventId(), t: T0 + 1, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 1, ctx: 'lesson' }
    assert.equal(visibleProgress({ baseline, events: [ev] }).quizAnswered, 1)
  })
  test('reset marker (σύμβαση): αγνοεί baseline και events πριν από το reset', () => {
    const baseline = buildLegacyBaseline(readFixture(PROD).keys, { now: fixed(T0) }).baseline
    const at = new Date(T0 + 10).toISOString()
    const ev = (t) => ({ id: newEventId(), t, item: 'psd115/q-w2-var-1', kind: 'answer', ok: 1, ctx: 'quiz' })
    const v = visibleProgress({ baseline, events: [ev(T0 + 5), ev(T0 + 20)], reset: { at } })
    assert.equal(v.quizAnswered, 1)
    assert.equal(v.flashcardSeenIds.length, 0)
  })
})

describe('κατεστραμμένα / άκυρα legacy δεδομένα → απόρριψη χωρίς εγγραφές', () => {
  const base = readFixture(PROD).keys
  const study = JSON.parse(base['psd115-w1-study'])
  const withStudy = (patch) => ({ ...base, 'psd115-w1-study': JSON.stringify({ ...study, ...patch }) })
  const cases = [
    ['άκυρο JSON', { ...base, 'psd115-w1-study': '{oops' }, /μη έγκυρο JSON/],
    ['άγνωστο κλειδί προόδου', { ...base, 'psd115-foo': '1' }, /άγνωστο κλειδί προόδου/],
    ['άγνωστο πεδίο study', withStudy({ extra: 1 }), /άγνωστο πεδίο «extra»/],
    ['quizCorrect > quizAnswered', withStudy({ quizCorrect: 5 }), /quizCorrect \(5\) > quizAnswered/],
    ['byCategory άκυρη δομή', withStudy({ byCategory: { 'w2-variables': { correct: -1, wrong: 1 } } }), /byCategory\.w2-variables/],
    ['byCategory άγνωστη κατηγορία', withStudy({ byCategory: { nope: { correct: 0, wrong: 1 } } }), /άγνωστη κατηγορία «nope»/],
    ['flashcardSeenIds άγνωστη κάρτα', withStudy({ flashcardSeenIds: ['fc-nope'] }), /άγνωστη κάρτα «fc-nope»/],
    ['flashcardSeenIds διπλή', withStudy({ flashcardSeenIds: ['fc-def-1', 'fc-def-1'] }), /διπλή κάρτα/],
    ['wrongBook λείπει πεδίο', withStudy({ wrongBook: [{ ...study.wrongBook[0], userLabel: undefined }] }), /userLabel: αναμενόταν string/],
    ['wrongBook άγνωστη ερώτηση', withStudy({ wrongBook: [{ ...study.wrongBook[0], id: 'q-nope' }] }), /άγνωστη ερώτηση «q-nope»/],
    ['wrongBook άγνωστη κατηγορία', withStudy({ wrongBook: [{ ...study.wrongBook[0], categoryId: 'nope' }] }), /άγνωστη κατηγορία «nope»/],
    ['checklist όχι boolean[]', { ...base, 'psd115-w1-pavlov-checklist': '[1,0]' }, /πίνακας true\/false/],
    ['checklist άγνωστο slug (k1)', { ...base, 'psd115-w1-nope-checklist': '[true]' }, /δεν αντιστοιχεί σε θέμα/],
    ['checklist άγνωστο slug (k2)', { ...base, 'psd115-w2-checklists': '{"nope":[true]}' }, /δεν αντιστοιχεί σε θέμα/],
    ['week checklists όχι αντικείμενο', { ...base, 'psd115-w3-checklists': '[true]' }, /αναμενόταν αντικείμενο slug/],
    ['άκυρο theme', { ...base, 'psd115-w1-theme': 'blue' }, /"light" ή "dark"/],
  ]
  for (const [label, entries, re] of cases) {
    test(label, async () => {
      const r = buildLegacyBaseline(entries, { now: fixed(T0) })
      assert.equal(r.ok, false)
      assert.ok(r.errors.some((e) => re.test(e)), r.errors.join(' | '))
      const s = fakeStorage({ ...entries })
      const before = s.dump()
      const m = await migrate(s)
      assert.equal(m.status, 'rejected')
      assert.deepEqual(s.dump(), before, 'καμία εγγραφή')
    })
  }
  test('κατεστραμμένο τρέχον νέο store → απόρριψη, καμία εγγραφή', async () => {
    const s = fakeStorage({ ...base, [STATE_KEY]: '{corrupt' })
    const before = s.dump()
    assert.equal((await migrate(s)).status, 'rejected')
    assert.deepEqual(s.dump(), before)
  })
})

describe('η εφαρμογή δεν εκτελεί migration', () => {
  test('κανένα αρχείο του src δεν καλεί το migrateLegacyBaseline (εκτός από τον ορισμό του)', () => {
    const walk = (dir) =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    const users = walk(path.join(root, 'src'))
      .filter((f) => /migrateLegacyBaseline|progressMigration/.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(root, f))
    assert.deepEqual(users, ['src/utils/progressMigration.js'])
  })
})
