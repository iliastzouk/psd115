/**
 * Ανάκαμψη (PR #9): reset / import πάνω σε αλλοιωμένα (degraded) δεδομένα.
 *   T1  το safety backup κρατά τα raw byte-identical, ακόμα και αλλοιωμένα (αρχείο + τοπικό αντίγραφο)
 *   T2  αποτυχία λήψης αρχείου → reset/import ακυρώνονται, τίποτα δεν αλλάζει
 *   T3  τοπικό αντίγραφο που δεν γράφεται ή δεν επαληθεύεται → reset/import ακυρώνονται, τίποτα δεν αλλάζει
 *   T4  αποτυχία της συναλλαγής reset/import → τα αλλοιωμένα raw επανέρχονται byte-identical
 *   T5  import: ο ίδιος reader με την εφαρμογή, ΠΡΙΝ από backup ή εγγραφή· αλλοιωμένο backup δεν γίνεται δεκτό
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BackupError, buildExport, createSafetyBackup, importWithBackup, readImportFile, resetProgressSafely } from '../src/utils/progressBackup.js'
import { validateExport } from '../src/utils/progressValidate.js'
import { TXN_KEY } from '../src/utils/progressTransaction.js'
import { legacyToSnapshot } from '../src/core/progress/snapshot.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures', name), 'utf8'))
const PROD = fixture('progress-export.production-2026-10-05.json').keys
const FIXTURES = ['progress-export.production-2026-10-05.json', 'progress-export.production-2026-09-28.json', 'progress-export.sample.json']
const CORRUPT = { ...PROD, 'psd115-w1-study': '{oops', 'psd115-w1-pavlov-checklist': '[1,0' }

function fakeStorage(init = {}, { failSet, failRemove, lieOnRead } = {}) {
  const m = new Map(Object.entries(init))
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    // lieOnRead: η επανάγνωση ενός κλειδιού που ΓΡΑΦΤΗΚΕ επιστρέφει άλλο περιεχόμενο (αποτυχία επαλήθευσης).
    getItem: (k) => (m.has(k) && lieOnRead?.(k) ? 'corrupted-copy' : m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      if (failSet?.(k)) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
      m.set(k, String(v))
    },
    removeItem(k) {
      if (failRemove?.(k)) throw new Error('remove failed')
      m.delete(k)
    },
    dump: () => Object.fromEntries(m),
  }
}
const progressOnly = (dump) => Object.fromEntries(Object.entries(dump).filter(([k]) => !k.startsWith('psd115-backup-')))
const backupKeys = (dump) => Object.keys(dump).filter((k) => k.startsWith('psd115-backup-'))
const exportFile = (keys) => ({ format: 'psd115-progress-export', version: 2, exportedAt: '2026-10-13T10:00:00.000Z', keys, progressStore: {}, migration: { markerKey: 'migration:psd115-v1', marker: null } })

describe('T1 · το backup κρατά τα raw byte-identical (και αλλοιωμένα)', () => {
  test('αρχείο λήψης και τοπικό αντίγραφο', () => {
    const s = fakeStorage(CORRUPT)
    let downloaded = null
    const r = createSafetyBackup('reset', { storage: s, download: (d) => (downloaded = d) })
    for (const [k, v] of Object.entries(CORRUPT)) {
      assert.equal(downloaded.keys[k], v, `λήψη: ${k}`)
      assert.equal(JSON.parse(s.getItem(r.key)).keys[k], v, `τοπικό: ${k}`)
    }
    assert.equal(s.getItem(r.key), JSON.stringify(downloaded))
  })

  test('το reset πάνω σε αλλοιωμένα: πρώτα επαληθευμένο backup με τα raw, μετά διαγραφή', () => {
    const s = fakeStorage(CORRUPT)
    let downloaded = null
    resetProgressSafely({ storage: s, download: (d) => (downloaded = d) })
    assert.equal(downloaded.keys['psd115-w1-study'], '{oops')
    const [local] = backupKeys(s.dump())
    assert.equal(JSON.parse(s.getItem(local)).keys['psd115-w1-pavlov-checklist'], '[1,0')
    assert.equal(s.getItem('psd115-w1-study'), null)
  })
})

describe('T2 · αποτυχία λήψης → ακύρωση, τίποτα δεν αλλάζει', () => {
  const blocked = () => {
    throw new Error('download blocked')
  }
  test('reset', () => {
    const s = fakeStorage(CORRUPT)
    assert.throws(() => resetProgressSafely({ storage: s, download: blocked }), /download blocked/)
    assert.deepEqual(s.dump(), CORRUPT)
  })
  test('import', () => {
    const s = fakeStorage(CORRUPT)
    assert.throws(() => importWithBackup(exportFile(PROD), { storage: s, download: blocked }), /download blocked/)
    assert.deepEqual(s.dump(), CORRUPT)
  })
})

describe('T3 · τοπικό αντίγραφο που δεν γράφεται ή δεν επαληθεύεται → ακύρωση', () => {
  const cases = {
    'αποτυχία εγγραφής (quota)': { failSet: (k) => k.startsWith('psd115-backup-') },
    'επανάγνωση διαφορετική': { lieOnRead: (k) => k.startsWith('psd115-backup-') },
  }
  for (const [label, opts] of Object.entries(cases)) {
    test(`reset: ${label} → BackupError, πρόοδος ανέγγιχτη, κανένα μισό αντίγραφο`, () => {
      const s = fakeStorage(CORRUPT, opts)
      assert.throws(() => resetProgressSafely({ storage: s, download: () => {} }), (e) => e instanceof BackupError)
      assert.deepEqual(progressOnly(s.dump()), CORRUPT)
      assert.deepEqual(backupKeys(s.dump()), [])
      assert.equal(s.getItem(TXN_KEY), null)
    })
    test(`import: ${label} → BackupError, πρόοδος ανέγγιχτη`, () => {
      const s = fakeStorage(CORRUPT, opts)
      assert.throws(() => importWithBackup(exportFile(PROD), { storage: s, download: () => {} }), (e) => e instanceof BackupError)
      assert.deepEqual(progressOnly(s.dump()), CORRUPT)
      assert.deepEqual(backupKeys(s.dump()), [])
    })
  }

  test('επιτυχία: το backup υπάρχει και ταυτίζεται byte-for-byte πριν από την αλλαγή', () => {
    const s = fakeStorage(PROD)
    const r = createSafetyBackup('reset', { storage: s, download: () => {} })
    assert.equal(r.storedLocally, true)
    assert.equal(s.getItem(r.key), JSON.stringify(r.data))
  })
})

describe('T4 · αποτυχία συναλλαγής → τα αλλοιωμένα raw επανέρχονται byte-identical', () => {
  test('reset: η διαγραφή αποτυγχάνει στο 2ο κλειδί', () => {
    const s = fakeStorage(CORRUPT, { failRemove: (k) => k === 'psd115-w1-pavlov-checklist' })
    assert.throws(() => resetProgressSafely({ storage: s, download: () => {} }), (e) => e.outcome === 'rolled-back')
    assert.deepEqual(progressOnly(s.dump()), CORRUPT)
    assert.equal(s.getItem(TXN_KEY), null)
    assert.equal(backupKeys(s.dump()).length, 1) // το επαληθευμένο backup μένει
  })
  test('import: η εγγραφή αποτυγχάνει στο 2ο κλειδί', () => {
    const s = fakeStorage(CORRUPT, { failSet: (k) => k === 'psd115-w1-pavlov-checklist' })
    assert.throws(() => importWithBackup(exportFile(PROD), { storage: s, download: () => {} }), (e) => e.outcome === 'rolled-back')
    assert.deepEqual(progressOnly(s.dump()), CORRUPT)
    assert.equal(s.getItem(TXN_KEY), null)
  })
})

describe('T5 · import: ίδιος reader με την εφαρμογή, πριν από backup ή εγγραφή', () => {
  const study = JSON.parse(PROD['psd115-w1-study'])
  const withStudy = (patch) => ({ ...PROD, 'psd115-w1-study': JSON.stringify({ ...study, ...patch }) })
  const CASES = {
    'άγνωστο πεδίο στο study': withStudy({ extra: 1 }),
    'quizCorrect > quizAnswered': withStudy({ quizCorrect: 9 }),
    'διπλή κάρτα': withStudy({ flashcardSeenIds: [study.flashcardSeenIds[0], study.flashcardSeenIds[0]] }),
    'wrongBook χωρίς userLabel': withStudy({ wrongBook: [{ ...study.wrongBook[0], userLabel: undefined }] }),
    'wrongBook διπλό uid': withStudy({ wrongBook: [study.wrongBook[0], study.wrongBook[0]] }),
    'byCategory λάθος σχήμα': withStudy({ byCategory: { 'w2-variables': { correct: 0, wrong: 1, x: 2 } } }),
    'αλλοιωμένο backup από degraded mode': CORRUPT,
  }
  for (const [label, keys] of Object.entries(CASES)) {
    test(`${label} → απόρριψη στην επιλογή αρχείου ΚΑΙ στο import, χωρίς backup ή εγγραφή`, async () => {
      const file = exportFile(keys)
      assert.equal(validateExport(file).ok, false)
      const picked = await readImportFile({ text: async () => JSON.stringify(file) })
      assert.equal(picked.ok, false)
      assert.match(picked.errors.join(), /δεν μπορεί να διαβάσει με ασφάλεια/)
      const s = fakeStorage(PROD)
      let downloads = 0
      assert.throws(() => importWithBackup(file, { storage: s, download: () => (downloads += 1) }), /δεν πέρασε τον έλεγχο/)
      assert.equal(downloads, 0)
      assert.deepEqual(s.dump(), PROD)
    })
  }

  test('κάθε αρχείο που γίνεται δεκτό διαβάζεται από τον runtime reader (fixtures + exports)', () => {
    const files = [...FIXTURES.map((f) => fixture(f)), buildExport('export', fakeStorage(PROD)), buildExport('export', fakeStorage({ ...PROD, 'psd115-extra-unknown': 'keep' }))]
    for (const file of files) {
      assert.equal(validateExport(file).ok, true)
      assert.equal(legacyToSnapshot(file.keys, { content, mode: 'runtime' }).ok, true)
    }
  })

  test('έγκυρο import: επικύρωση → backup → εγγραφή (επαναφέρει έγκυρη πρόοδο πάνω σε αλλοιωμένη)', () => {
    const s = fakeStorage(CORRUPT)
    let downloaded = null
    importWithBackup(exportFile(PROD), { storage: s, download: (d) => (downloaded = d) })
    assert.equal(downloaded.keys['psd115-w1-study'], '{oops') // το backup κράτησε τα αλλοιωμένα raw
    assert.deepEqual(progressOnly(s.dump()), PROD)
    assert.equal(legacyToSnapshot(PROD, { content, mode: 'runtime' }).ok, true)
  })
})
