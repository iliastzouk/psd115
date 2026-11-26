/**
 * Φάση 6b — μηνύματα αποτυχίας (src/utils/progressFailureMessage.js) και ταξινόμηση quota / other του ενεργού service.
 * Μεταφέρει την κάλυψη των progressBackupSafety (T5) και progressWriteFailure (E2) από τον legacy service.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { describeDegraded, describeProgressFailure, describeWriteFailure } from '../src/utils/progressFailureMessage.js'
import { ProgressTransactionError } from '../src/core/progress/transaction.js'
import { BackupError, PendingTransactionError, ProgressActionError, StaleImportError, ImportRejected } from '../src/utils/studyProgressBackup.js'
import { STATE_KEY, T0, fakeStorage, service } from './helpers/progressFixtures.mjs'

const err = (props) => Object.assign(new Error('x'), props)

describe('describeProgressFailure: «η πρόοδος δεν άλλαξε» ΜΟΝΟ όταν είναι επιβεβαιωμένο', () => {
  for (const action of ['reset', 'import']) {
    test(`${action}: BackupError → ακυρώθηκε, η πρόοδος δεν άλλαξε`, () => {
      assert.match(describeProgressFailure(action, new BackupError('x')), /αντίγραφο ασφαλείας.*ακυρώθηκε.*δεν άλλαξε/)
    })
    for (const outcome of ['not-started', 'rolled-back']) {
      test(`${action}: ${outcome} → η πρόοδος δεν άλλαξε`, () => {
        assert.match(describeProgressFailure(action, new ProgressTransactionError('x', outcome)), /δεν άλλαξε/)
      })
    }
    test(`${action}: rollback-incomplete → «δεν ολοκληρώθηκε με ασφάλεια… επαναφόρτωσε», ΧΩΡΙΣ «δεν άλλαξε»`, () => {
      const m = describeProgressFailure(action, new ProgressTransactionError('x', 'rollback-incomplete'))
      assert.match(m, /δεν ολοκληρώθηκε με ασφάλεια/)
      assert.match(m, /Επαναφόρτωσε τη σελίδα για να επιχειρηθεί ανάκτηση/)
      assert.doesNotMatch(m, /δεν άλλαξε|διατηρήθηκε|θα ανακτηθεί/)
    })
    test(`${action}: εκκρεμές σημάδι → «Εκκρεμεί ανάκτηση»· έλεγχος που δεν έγινε → «δεν μπόρεσε να ελεγχθεί»`, () => {
      assert.match(describeProgressFailure(action, new PendingTransactionError('pending')), /Εκκρεμεί ανάκτηση· επαναφόρτωσε τη σελίδα πριν δοκιμάσεις ξανά/)
      const m = describeProgressFailure(action, new PendingTransactionError('unverifiable'))
      assert.match(m, /δεν μπόρεσε να ελεγχθεί.*ακυρώθηκε/)
      assert.doesNotMatch(m, /Εκκρεμεί ανάκτηση/)
    })
    test(`${action}: ProgressActionError → corrupt: δεν επιτρέπεται· unsupported: δεν έγινε`, () => {
      assert.match(describeProgressFailure(action, new ProgressActionError('x', 'corrupt')), /δεν διαβάζεται με ασφάλεια.*δεν επιτρέπεται.*δεν άλλαξε/)
      assert.match(describeProgressFailure(action, new ProgressActionError('x', 'unsupported')), /δεν έχει πρόοδο.*δεν έγινε/)
    })
    test(`${action}: άγνωστο σφάλμα (π.χ. αποτυχία λήψης) → ΔΕΝ ισχυρίζεται ότι η πρόοδος δεν άλλαξε`, () => {
      for (const e of [new Error('κάτι άλλο'), null, undefined]) assert.doesNotMatch(describeProgressFailure(action, e), /δεν άλλαξε|διατηρήθηκε/)
    })
  }
  test('import: StaleImportError και ImportRejected', () => {
    assert.match(describeProgressFailure('import', new StaleImportError()), /άλλαξε μετά την προεπισκόπηση.*δεν εισήχθη τίποτα/)
    assert.equal(describeProgressFailure('import', new ImportRejected('αιτία')), 'Το αρχείο απορρίφθηκε· η πρόοδος δεν άλλαξε. αιτία')
  })
  test('ακριβής τελική φράση για άγνωστο σφάλμα', () => {
    assert.equal(describeProgressFailure('reset', err({})), 'Η επαναφορά απέτυχε. Επαναφόρτωσε τη σελίδα και έλεγξε την πρόοδό σου πριν δοκιμάσεις ξανά.')
    assert.equal(describeProgressFailure('import', err({})), 'Η εισαγωγή απέτυχε. Επαναφόρτωσε τη σελίδα και έλεγξε την πρόοδό σου πριν δοκιμάσεις ξανά.')
  })
})

describe('describeWriteFailure / describeDegraded: ακριβή κείμενα', () => {
  test('quota / other', () => {
    assert.equal(
      describeWriteFailure('quota'),
      'Η τελευταία αλλαγή δεν αποθηκεύτηκε: ο χώρος αποθήκευσης του browser φαίνεται γεμάτος. Ελευθέρωσε χώρο και επανάλαβε την ενέργεια.',
    )
    assert.equal(
      describeWriteFailure('other'),
      'Η τελευταία αλλαγή δεν αποθηκεύτηκε. Η μελέτη συνεχίζεται, αλλά η αλλαγή αυτή δεν θα επαναληφθεί αυτόματα. Επανέλαβέ την όταν η αποθήκευση λειτουργεί κανονικά.',
    )
  })
  test('ανά αιτία της ασφαλούς λειτουργίας', () => {
    assert.match(describeDegraded('pending'), /δεν ολοκληρώθηκε.*επαναφόρτωσε/)
    assert.match(describeDegraded('unrecoverable'), /δεν μπορεί να ανακτηθεί αυτόματα/)
    assert.match(describeDegraded('no-storage'), /δεν επιτρέπει αποθήκευση/)
    for (const r of ['corrupt', null]) assert.match(describeDegraded(r), /δεν μπορεί να διαβαστεί με ασφάλεια/)
  })
})

describe('ταξινόμηση αποτυχίας εγγραφής από αναγνωρίσιμα στοιχεία του σφάλματος, όχι από κείμενο', () => {
  const CASES = {
    'QuotaExceededError (name)': [err({ name: 'QuotaExceededError' }), 'quota'],
    'Firefox NS_ERROR_DOM_QUOTA_REACHED (name)': [err({ name: 'NS_ERROR_DOM_QUOTA_REACHED' }), 'quota'],
    'DOMException code 22': [err({ name: 'Error', code: 22 }), 'quota'],
    'Firefox code 1014': [err({ name: 'Error', code: 1014 }), 'quota'],
    'κείμενο «quota» χωρίς αναγνωρίσιμο name/code': [new Error('quota exceeded'), 'other'],
    'SecurityError': [err({ name: 'SecurityError' }), 'other'],
  }
  for (const [label, [e, kind]] of Object.entries(CASES)) {
    test(`${label} → ${kind}· ready, false, η αλλαγή δεν εφαρμόζεται`, () => {
      const s = fakeStorage()
      const svc = service(s)
      const before = svc.getSnapshot().courses['demo-a']
      s.hooks.fail = (k) => (k === STATE_KEY ? e : null)
      assert.equal(svc.forCourse('demo-a').setChecklist('a-t1', [true]), false)
      assert.deepEqual(svc.getSnapshot().writeFailure, { at: T0, kind })
      assert.equal(svc.getSnapshot().status, 'ready')
      assert.equal(svc.getSnapshot().courses['demo-a'], before)
    })
  }
})
