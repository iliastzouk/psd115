/**
 * Φάση 6b — η συναλλαγή πολλών κλειδιών (src/core/progress/transaction.js) απευθείας: runTransaction / recoverInterrupted.
 * Μεταφέρει την κάλυψη των progressBackup / progressPendingMarker (που περνούσαν από το legacy re-export).
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ProgressTransactionError, recoverInterrupted, runTransaction, TXN_KEY } from '../src/core/progress/transaction.js'
import { fakeStorage } from './helpers/progressFixtures.mjs'

const quota = () => Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
const marker = (before, after, op = 't') => JSON.stringify({ v: 1, op, startedAt: 'x', before, after })

describe('runTransaction', () => {
  test('επιτυχία: γράφει / σβήνει (null) τους στόχους, επιστρέφει τα κλειδιά που άλλαξαν, χωρίς σημάδι στο τέλος', () => {
    const s = fakeStorage({ a: '1', b: '1', c: 'same' })
    assert.deepEqual(runTransaction(s, { op: 't', targets: { a: '2', b: null, c: 'same' } }), { changed: ['a', 'b'] })
    assert.deepEqual(s.dump(), { a: '2', c: 'same' })
    assert.deepEqual(s.writes, [TXN_KEY, 'a', '-b', `-${TXN_KEY}`], 'πρώτα το σημάδι, τελευταία η διαγραφή του')
  })
  test('το σημάδι κρατά before/after ΜΟΝΟ των κλειδιών που αλλάζουν', () => {
    const s = fakeStorage({ a: '1', b: 'x' })
    let seen = null
    s.hooks.fail = (k) => {
      if (k === 'a') seen = JSON.parse(s.dump()[TXN_KEY])
      return null
    }
    runTransaction(s, { op: 'import', targets: { a: '2', b: 'x' }, now: () => Date.UTC(2026, 0, 1) })
    assert.deepEqual(seen, { v: 1, op: 'import', startedAt: '2026-01-01T00:00:00.000Z', before: { a: '1' }, after: { a: '2' } })
  })
  test('καμία αλλαγή → no-op: καμία εγγραφή (ούτε σημάδι), ακόμα και με εκκρεμές σημάδι', () => {
    const m = marker({ a: '0' }, { a: '1' })
    const s = fakeStorage({ a: '1', b: '2', [TXN_KEY]: m })
    assert.deepEqual(runTransaction(s, { op: 'y', targets: { a: '1', b: '2' } }), { changed: [] })
    assert.deepEqual(s.writes, [])
    assert.equal(s.getItem(TXN_KEY), m)
  })
  test('εκκρεμές σημάδι → not-started ΠΡΙΝ από οποιαδήποτε εγγραφή', () => {
    const s = fakeStorage({ a: '1', [TXN_KEY]: marker({ a: '0' }, { a: '1' }) })
    assert.throws(() => runTransaction(s, { op: 'y', targets: { a: '2', b: null } }), (e) => e instanceof ProgressTransactionError && e.outcome === 'not-started')
    assert.deepEqual(s.writes, [])
  })
  test('το σημάδι δεν χωρά → not-started, τίποτα δεν αλλάζει', () => {
    const s = fakeStorage({ a: '1' })
    s.hooks.fail = (k) => (k === TXN_KEY ? quota() : null)
    assert.throws(() => runTransaction(s, { op: 't', targets: { a: '2' } }), (e) => e.outcome === 'not-started')
    assert.deepEqual(s.dump(), { a: '1' })
  })
  test('αποτυχία στη μέση → rolled-back: όλα στις αρχικές τιμές, χωρίς σημάδι', () => {
    const s = fakeStorage({ a: '1', b: '1' })
    s.hooks.fail = (k) => (k === 'b' ? quota() : null)
    assert.throws(() => runTransaction(s, { op: 't', targets: { a: '2', b: '2' } }), (e) => e.outcome === 'rolled-back' && /δεν άλλαξε τίποτα/.test(e.message))
    assert.deepEqual(s.dump(), { a: '1', b: '1' })
  })
  test('η επαλήθευση αποτυγχάνει (το storage δεν κράτησε την τιμή, χωρίς σφάλμα) → rolled-back', () => {
    const s = fakeStorage({ a: '1' })
    const set = s.setItem
    s.setItem = (k, v) => (k === 'a' && v === '2' ? undefined : set(k, v))
    assert.throws(() => runTransaction(s, { op: 't', targets: { a: '2' } }), (e) => e.outcome === 'rolled-back')
    s.setItem = set
    assert.deepEqual(s.dump(), { a: '1' })
  })
  test('αποτυχία και στο rollback → rollback-incomplete· το σημάδι μένει· η ανάκτηση επαναφέρει', () => {
    const s = fakeStorage({ a: '1', b: '1' })
    let calls = 0
    s.hooks.fail = (k) => (k === 'b' || (k === 'a' && ++calls > 1) ? quota() : null)
    assert.throws(() => runTransaction(s, { op: 't', targets: { a: '2', b: '2' } }), (e) => e.outcome === 'rollback-incomplete' && !/δεν άλλαξε τίποτα/.test(e.message))
    assert.ok(s.getItem(TXN_KEY))
    s.hooks.fail = null
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(s.dump(), { a: '1', b: '1' })
  })
  test('το σημάδι δεν σβήνεται στο τέλος → η αλλαγή ισχύει· η ανάκτηση το βλέπει ως completed', () => {
    const s = fakeStorage({ a: '1' })
    s.hooks.failRemove = (k) => (k === TXN_KEY ? new Error('x') : null)
    assert.deepEqual(runTransaction(s, { op: 't', targets: { a: '2' } }), { changed: ['a'] })
    s.hooks.failRemove = null
    assert.equal(recoverInterrupted(s).status, 'completed')
    assert.deepEqual(s.dump(), { a: '2' })
  })
})

describe('recoverInterrupted', () => {
  test('χωρίς σημάδι: none, καμία εγγραφή (ένα getItem)', () => {
    const s = fakeStorage({ a: '1' })
    s.hooks.fail = () => quota()
    assert.deepEqual(recoverInterrupted(s), { status: 'none' })
    assert.deepEqual(s.reads, [TXN_KEY])
  })
  test('το getItem πετάει → none (ο έλεγχος fail-closed γίνεται στον service)', () => {
    const s = fakeStorage()
    s.hooks.failGet = () => new Error('x')
    assert.deepEqual(recoverInterrupted(s), { status: 'none' })
  })
  test('διακοπή μετά από μισές εγγραφές → rolled-back στα before', () => {
    const s = fakeStorage({ a: '2', b: '1', [TXN_KEY]: marker({ a: '1', b: '1' }, { a: '2', b: '2' }, 'import') })
    assert.deepEqual(recoverInterrupted(s), { status: 'rolled-back', op: 'import' })
    assert.deepEqual(s.dump(), { a: '1', b: '1' })
  })
  test('όλα ήδη after → completed (όχι αναίρεση)', () => {
    const s = fakeStorage({ a: '2', b: '2', [TXN_KEY]: marker({ a: '1', b: '1' }, { a: '2', b: '2' }, 'reset') })
    assert.deepEqual(recoverInterrupted(s), { status: 'completed', op: 'reset' })
    assert.deepEqual(s.dump(), { a: '2', b: '2' })
  })
  test('διαγραφές (null) επαναφέρονται σωστά', () => {
    const s = fakeStorage({ a: '9', b: '1', [TXN_KEY]: marker({ a: null, b: '1' }, { a: '9', b: null }) })
    assert.equal(recoverInterrupted(s).status, 'rolled-back')
    assert.deepEqual(s.dump(), { b: '1' })
  })
  test('η επαναφορά αποτυγχάνει → failed, το σημάδι μένει', () => {
    const s = fakeStorage({ a: '2', b: '1', [TXN_KEY]: marker({ a: '1', b: '1' }, { a: '2', b: '2' }) })
    s.hooks.fail = () => quota()
    assert.equal(recoverInterrupted(s).status, 'failed')
    assert.ok(s.getItem(TXN_KEY))
  })
  test('κατεστραμμένο ή άγνωστο σημάδι → corrupt-marker, κανένα δεδομένο δεν αγγίζεται', () => {
    for (const m of ['{x', JSON.stringify({ v: 99, before: {}, after: {} }), JSON.stringify([]), JSON.stringify({ v: 1, before: [], after: {} })]) {
      const s = fakeStorage({ a: '1', [TXN_KEY]: m })
      assert.equal(recoverInterrupted(s).status, 'corrupt-marker', m)
      assert.deepEqual(s.writes, [])
    }
  })
})
