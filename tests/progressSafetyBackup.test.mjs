/**
 * Φάση 6b — safety backup (createSafetyBackup) ανά σημείο αποτυχίας, όπως είναι ΣΗΜΕΡΑ ο κώδικας:
 *   σύγκρουση ονόματος (getItem) → setItem → επαλήθευση (getItem) → download → κλάδεμα (best-effort)
 *
 *   α1 setItem αποτυγχάνει        → BackupError· το νέο κλειδί σβήνεται best-effort (discard)
 *   α2 επαλήθευση αποτυγχάνει     → BackupError· το ίδιο
 *   α3 download αποτυγχάνει       → το ΑΡΧΙΚΟ σφάλμα· το νέο επαληθευμένο backup μένει· κανένα κλάδεμα
 *   α4 έλεγχος σύγκρουσης πετάει  → το ΑΡΧΙΚΟ σφάλμα· τίποτα δεν γράφεται
 *   β  κλάδεμα αποτυγχάνει        → κανένα σφάλμα· το νέο backup μένει· σταματά στην ΠΡΩΤΗ αποτυχημένη διαγραφή
 * Σε κάθε α: η πρόοδος (reset / import) ΔΕΝ αλλάζει και τα παλιά backups μένουν όλα.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { TXN_KEY } from '../src/core/progress/transaction.js'
import {
  BACKUP_KEY_PREFIX,
  BackupError,
  MAX_LOCAL_BACKUPS,
  applyImport,
  buildStoreExport,
  createSafetyBackup,
  exportProgressToFile,
  listLocalBackups,
  planImport,
  resetCourseSafely,
} from '../src/utils/studyProgressBackup.js'
import { ALL_ADAPTERS, EVENTS_KEY, STATE_KEY, T0, answer, fakeStorage, flip, service, storeWith } from './helpers/progressFixtures.mjs'

const adapters = ALL_ADAPTERS
const iso = (ms) => new Date(ms).toISOString()
const NOW = T0 + 10_000
const oldKey = (n) => `${BACKUP_KEY_PREFIX}${iso(T0 - (100 - n) * 1000)}`
const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })
const isBackup = (op) => op.slice(op.indexOf(':') + 1).startsWith(BACKUP_KEY_PREFIX)

/** Storage με πρόοδο στο demo-a και `n` παλιά backups (παλαιότερο πρώτο). */
function withBackups(n) {
  const s = storeWith({ events: [answer('demo-a', 'a-q1', { ok: 0 }), flip('demo-a', 'a-c1')], state: { 'progress:reset:demo-b': { at: iso(T0 - 50) } } })
  const old = Array.from({ length: n }, (_, i) => oldKey(i))
  for (const k of old) s.setItem(k, JSON.stringify({ format: 'study-progress-raw', version: 1, reason: 'old', keys: { k } }))
  const oldValues = Object.fromEntries(old.map((k) => [k, s.getItem(k)]))
  s.writes.length = 0
  s.ops.length = 0
  s.reads.length = 0
  return { s, old, oldValues }
}
const progressOf = (s) => ({ events: s.getItem(EVENTS_KEY), state: s.getItem(STATE_KEY), txn: s.getItem(TXN_KEY) })
const newKeys = (s, old) => listLocalBackups(s).filter((k) => !old.includes(k))
const recordingDownload = (s, { fail } = {}) => (data, filename) => {
  s.ops.push('download')
  if (fail) throw fail
  return { data, filename }
}
const doReset = (s, download) => resetCourseSafely({ courseId: 'demo-a', adapters, storage: s, download, now: () => NOW })
const importFile = () => ({ format: 'study-progress', version: 1, exportedAt: iso(T0), events: [answer('demo-b', 'b-q1')], state: {} })
const doImport = (s, download) => {
  const data = importFile()
  return applyImport(planImport(data, { storage: s, adapters }), data, { storage: s, adapters, download, now: () => NOW })
}
const ACTIONS = { reset: doReset, import: doImport }

/** Οι ενέργειες του backup με τη σειρά τους (χωρίς τις αναγνώσεις του buildRawExport και του store). */
const backupOps = (s) => s.ops.filter((op) => op === 'download' || isBackup(op))

describe('α · αποτυχία πριν ολοκληρωθεί το backup: η πρόοδος ΔΕΝ αλλάζει, τα παλιά backups μένουν όλα', () => {
  for (const [name, act] of Object.entries(ACTIONS)) {
    test(`α1 ${name}: setItem του νέου backup αποτυγχάνει → BackupError· κανένα νέο κλειδί· τα 3 παλιά ανέπαφα`, () => {
      const { s, old, oldValues } = withBackups(3)
      const before = progressOf(s)
      s.hooks.fail = (k) => (k.startsWith(BACKUP_KEY_PREFIX) ? quota() : null)
      const download = recordingDownload(s)
      assert.throws(() => act(s, download), (e) => e instanceof BackupError && /δεν αποθηκεύτηκε/.test(e.message))
      assert.deepEqual(progressOf(s), before)
      assert.deepEqual(newKeys(s, old), [])
      for (const k of old) assert.equal(s.getItem(k), oldValues[k], k)
      assert.ok(!s.ops.includes('download'), 'καμία λήψη')
    })

    test(`α2 ${name}: η επαλήθευση δεν ταιριάζει → BackupError· το νέο κλειδί σβήνεται· τα 3 παλιά ανέπαφα`, () => {
      const { s, old, oldValues } = withBackups(3)
      const before = progressOf(s)
      const get = s.getItem
      let written = null
      s.hooks.fail = (k) => {
        if (k.startsWith(BACKUP_KEY_PREFIX) && !old.includes(k)) written = k
        return null
      }
      s.getItem = (k) => (k === written ? 'αλλοιωμένο' : get(k))
      assert.throws(() => act(s, recordingDownload(s)), (e) => e instanceof BackupError && /δεν επαληθεύτηκε/.test(e.message))
      s.getItem = get
      assert.ok(written, 'το νέο κλειδί γράφτηκε πριν από την επαλήθευση')
      assert.deepEqual(progressOf(s), before)
      assert.deepEqual(newKeys(s, old), [], 'η διαγραφή του νέου κλειδιού πέτυχε')
      for (const k of old) assert.equal(s.getItem(k), oldValues[k], k)
    })

    test(`α2 ${name}: η επαλήθευση πετάει → BackupError (ίδια συμπεριφορά)`, () => {
      const { s, old } = withBackups(3)
      const before = progressOf(s)
      let reads = 0
      s.hooks.failGet = (k) => (k.startsWith(BACKUP_KEY_PREFIX) && !old.includes(k) && ++reads === 2 ? new Error('read') : null)
      assert.throws(() => act(s, recordingDownload(s)), (e) => e instanceof BackupError && /δεν επαληθεύτηκε/.test(e.message))
      assert.deepEqual(progressOf(s), before)
      assert.deepEqual(newKeys(s, old), [])
    })
  }

  test('α1/α2: το discard είναι best-effort — αν αποτύχει ΚΑΙ η διαγραφή, πάλι BackupError (όχι το σφάλμα της διαγραφής)· το ανεπαλήθευτο κλειδί μπορεί να μείνει', () => {
    const { s, old, oldValues } = withBackups(3)
    const before = progressOf(s)
    const get = s.getItem
    let written = null
    s.hooks.fail = (k) => {
      if (k.startsWith(BACKUP_KEY_PREFIX) && !old.includes(k)) written = k
      return null
    }
    s.getItem = (k) => (k === written ? 'αλλοιωμένο' : get(k))
    s.hooks.failRemove = () => new Error('remove')
    assert.throws(() => doReset(s, recordingDownload(s)), (e) => e instanceof BackupError && /δεν επαληθεύτηκε/.test(e.message))
    s.getItem = get
    assert.deepEqual(progressOf(s), before)
    assert.deepEqual(newKeys(s, old), [written], 'μένει ΜΟΝΟ το νέο, ανεπαλήθευτο κλειδί')
    for (const k of old) assert.equal(s.getItem(k), oldValues[k], k)
  })

  test('α1: setItem αποτυγχάνει ΚΑΙ η διαγραφή αποτυγχάνει → BackupError· εδώ δεν γράφτηκε τίποτα, άρα κανένα νέο κλειδί', () => {
    const { s, old } = withBackups(3)
    s.hooks.fail = (k) => (k.startsWith(BACKUP_KEY_PREFIX) ? quota() : null)
    s.hooks.failRemove = () => new Error('remove')
    assert.throws(() => doReset(s, recordingDownload(s)), BackupError)
    assert.deepEqual(newKeys(s, old), [])
  })

  for (const [name, act] of Object.entries(ACTIONS)) {
    test(`α3 ${name}: η λήψη αποτυγχάνει → το ΑΡΧΙΚΟ σφάλμα (όχι BackupError)· το νέο επαληθευμένο backup μένει· κανένα κλάδεμα`, () => {
      const { s, old, oldValues } = withBackups(3)
      const before = progressOf(s)
      const failure = new Error('download blocked')
      assert.throws(() => act(s, recordingDownload(s, { fail: failure })), (e) => e === failure)
      assert.deepEqual(progressOf(s), before, 'η πρόοδος δεν άλλαξε')
      const [created] = newKeys(s, old)
      assert.ok(created, 'το νέο backup υπάρχει')
      const backup = JSON.parse(s.getItem(created))
      assert.equal(backup.format, 'study-progress-raw')
      assert.deepEqual(backup.keys, { [EVENTS_KEY]: before.events, [STATE_KEY]: before.state, [TXN_KEY]: null }, 'byte-identical με την πρόοδο')
      assert.equal(listLocalBackups(s).length, 4, '3 παλιά + 1 νέο: το κλάδεμα δεν έγινε')
      for (const k of old) assert.equal(s.getItem(k), oldValues[k], k)
      assert.ok(!s.ops.some((op) => op.startsWith('rm:')), 'καμία διαγραφή')
    })
  }

  test('α4: ο έλεγχος σύγκρουσης ονόματος πετάει → το ΑΡΧΙΚΟ σφάλμα· τίποτα δεν γράφεται (ούτε backup ούτε πρόοδος)', () => {
    const { s, old, oldValues } = withBackups(3)
    const before = progressOf(s)
    const failure = new Error('getItem')
    s.hooks.failGet = (k) => (k.startsWith(BACKUP_KEY_PREFIX) && !old.includes(k) ? failure : null)
    assert.throws(() => doReset(s, recordingDownload(s)), (e) => e === failure)
    assert.deepEqual(progressOf(s), before)
    assert.deepEqual(newKeys(s, old), [])
    for (const k of old) assert.equal(s.getItem(k), oldValues[k], k)
    assert.deepEqual(s.writes, [])
  })
})

describe('σειρά ενεργειών του backup', () => {
  test('σύγκρουση ονόματος → εγγραφή → επαλήθευση → λήψη → κλάδεμα (μόνο οι ενέργειες του backup, όχι οι αναγνώσεις της προόδου)', () => {
    const { s, old } = withBackups(3)
    const { key } = createSafetyBackup('reset', { storage: s, download: recordingDownload(s), now: () => NOW })
    assert.deepEqual(backupOps(s), [`get:${key}`, `set:${key}`, `get:${key}`, 'download', `rm:${old[0]}`])
  })
  test('η επαλήθευση ολοκληρώνεται ΠΡΙΝ από τη λήψη· η λήψη ΠΡΙΝ από κάθε διαγραφή', () => {
    const { s } = withBackups(4)
    const { key } = createSafetyBackup('import', { storage: s, download: recordingDownload(s), now: () => NOW })
    const ops = backupOps(s)
    const verify = ops.lastIndexOf(`get:${key}`)
    const download = ops.indexOf('download')
    const firstRemove = ops.findIndex((op) => op.startsWith('rm:'))
    assert.ok(verify > ops.indexOf(`set:${key}`))
    assert.ok(verify < download, 'επαλήθευση πριν από τη λήψη')
    assert.ok(download < firstRemove, 'λήψη πριν από το κλάδεμα')
  })
  test('σύγκρουση στο ίδιο ms → νέο κλειδί με επίθημα, το υπάρχον ΔΕΝ αντικαθίσταται', () => {
    const s = fakeStorage()
    const first = createSafetyBackup('reset', { storage: s, download: () => {}, now: () => NOW }).key
    const value = s.getItem(first)
    const second = createSafetyBackup('reset', { storage: s, download: () => {}, now: () => NOW }).key
    assert.equal(first, `${BACKUP_KEY_PREFIX}${iso(NOW)}`)
    assert.equal(second, `${BACKUP_KEY_PREFIX}${iso(NOW)}-001`)
    assert.equal(s.getItem(first), value)
  })
})

describe('β · αποτυχία στο κλάδεμα: best-effort, σταματά στην πρώτη αποτυχημένη διαγραφή', () => {
  test('β1: 3 παλιά + 1 νέο → μία διαγραφή, αποτυγχάνει → καμία εξαίρεση· το νέο backup μένει· μένουν και τα 3 παλιά· το reset ολοκληρώνεται', () => {
    const { s, old, oldValues } = withBackups(3)
    s.hooks.failRemove = (k) => (k.startsWith(BACKUP_KEY_PREFIX) ? new Error('remove') : null)
    const { backup } = doReset(s, recordingDownload(s))
    assert.equal(s.getItem(backup.key), JSON.stringify(backup.data))
    for (const k of old) assert.equal(s.getItem(k), oldValues[k], k)
    assert.equal(s.ops.filter((op) => op.startsWith('rm:') && isBackup(op)).length, 1)
    assert.equal(service(s).getSnapshot().courses['demo-a'].quizAnswered, 0, 'το reset εφαρμόστηκε')
  })
  test('β2: 5 παλιά + 1 νέο → 3 διαγραφές· η 2η αποτυγχάνει → η 1η μένει, η 3η ΔΕΝ επιχειρείται· το νέο backup μένει· το import ολοκληρώνεται', () => {
    const { s, old, oldValues } = withBackups(5)
    let removes = 0
    s.hooks.failRemove = (k) => (k.startsWith(BACKUP_KEY_PREFIX) && ++removes === 2 ? new Error('remove') : null)
    const { backup } = doImport(s, recordingDownload(s))
    assert.deepEqual(s.ops.filter((op) => op.startsWith('rm:') && isBackup(op)), [`rm:${old[0]}`, `rm:${old[1]}`], 'ακριβώς δύο απόπειρες')
    assert.equal(s.getItem(old[0]), null, 'η 1η διαγραφή δεν αναιρείται')
    for (const k of old.slice(1)) assert.equal(s.getItem(k), oldValues[k], k)
    assert.equal(s.getItem(backup.key), JSON.stringify(backup.data))
    assert.equal(listLocalBackups(s).length, 5, 'πάνω από το όριο — ο καθαρισμός είναι best-effort')
    assert.equal(service(s).getSnapshot().courses['demo-b'].quizAnswered, 1, 'το import εφαρμόστηκε')
  })
  test(`χωρίς αποτυχία: μένουν ακριβώς τα ${MAX_LOCAL_BACKUPS} νεότερα`, () => {
    const { s, old } = withBackups(5)
    const { key } = createSafetyBackup('reset', { storage: s, download: () => {}, now: () => NOW })
    assert.deepEqual(listLocalBackups(s), [...old.slice(3), key])
  })
})

describe('K6 · κανένα legacy κλειδί δεν διαβάζεται (καταγραφή getItem)', () => {
  const LEGACY = {
    'psd115-w1-study': JSON.stringify({ quizAnswered: 9, quizCorrect: 9, flashcardSeenIds: ['x'], wrongBook: [] }),
    'psd115-w1-pavlov-checklist': '[true,true]',
    'psd115-w2-checklists': '{"overview":[true]}',
    'psd115-backup-2026-01-01T00:00:00.000Z': '{}',
    'migration:psd115-v1': '{}',
    'psd115-extra-unknown': 'x',
  }
  const ALLOWED = (k) => k === EVENTS_KEY || k === STATE_KEY || k === TXN_KEY || k.startsWith(BACKUP_KEY_PREFIX)
  test('service (δημιουργία, refresh, ενέργειες, resync), export, reset, import: μόνο τα κλειδιά του store, το σημάδι και τα study-progress-backup-*', () => {
    const s = fakeStorage({ ...LEGACY, 'psd115-w1-theme': 'dark', 'psd115-disclaimer-v1': '1' })
    const svc = service(s, { now: () => NOW })
    assert.equal(svc.forCourse('demo-a').answerQuestion({ questionId: 'a-q1', ok: false, wrong: { uid: 'u-1', question: 'Q', explanation: 'E', userLabel: 'A', correctLabel: 'B' } }), true)
    assert.equal(svc.forCourse('psd115').markCardSeen('fc-def-1'), true)
    svc.refresh()
    svc.resync()
    buildStoreExport({ storage: s, now: () => NOW })
    exportProgressToFile({ storage: s, download: () => {}, now: () => NOW })
    doReset(s, () => {})
    doImport(s, () => {})
    assert.ok(s.reads.length > 0)
    assert.deepEqual([...new Set(s.reads.filter((k) => !ALLOWED(k)))], [])
    for (const [k, v] of Object.entries(LEGACY)) assert.equal(s.getItem(k), v, `${k}: αμετάβλητο`)
  })
})
