/**
 * Φάση 6a — μητρώο IDs περιεχομένου (J4): τα ids δεν επαναχρησιμοποιούνται, ώστε τα orphan events να μη μετρήσουν ποτέ
 * σε νέο περιεχόμενο. scripts/id-ledger.mjs + validate:content.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { checkLedger, checkLedgerHistory, readLedger, withNewIds } from '../scripts/id-ledger.mjs'
import { STUDY_CONTENT } from '../src/core/study/content.js'

const content = { courseId: 'demo', cards: ['c1', 'c2'], questions: ['q1'] }
const ledger = (ids) => ({ courseId: 'demo', version: 1, ids })
const base = () => ({ c1: { type: 'card', status: 'active' }, c2: { type: 'card', status: 'active' }, q1: { type: 'question', status: 'active' } })

describe('μητρώο ↔ περιεχόμενο', () => {
  test('το μητρώο του PSD115 υπάρχει και ταιριάζει με το περιεχόμενο (όλα active)', () => {
    const c = STUDY_CONTENT.psd115
    const l = readLedger('psd115')
    assert.deepEqual(checkLedger(l, { courseId: 'psd115', cards: c.flashcards.map((x) => x.id), questions: c.quizQuestions.map((x) => x.id) }), [])
    assert.equal(Object.keys(l.ids).length, c.flashcards.length + c.quizQuestions.length)
    assert.ok(Object.values(l.ids).every((e) => e.status === 'active'))
  })
  test('έγκυρο', () => assert.deepEqual(checkLedger(ledger(base()), content), []))
  test('νέο id χωρίς ρητή εγγραφή → σφάλμα· το --add το προσθέτει ως active χωρίς να αλλάξει τα υπόλοιπα', () => {
    const more = { ...content, cards: [...content.cards, 'c3'] }
    assert.match(checkLedger(ledger(base()), more).join(), /νέο id «c3»/)
    const next = withNewIds(ledger({ ...base(), q9: { type: 'question', status: 'retired' } }), more)
    assert.deepEqual(next.ids.c3, { type: 'card', status: 'active' })
    assert.deepEqual(next.ids.q9, { type: 'question', status: 'retired' })
  })
  test('αφαίρεση χωρίς retired → σφάλμα· με retired → έγκυρο', () => {
    const fewer = { ...content, cards: ['c1'] }
    assert.match(checkLedger(ledger(base()), fewer).join(), /χωρίς να σημειωθεί retired/)
    assert.deepEqual(checkLedger(ledger({ ...base(), c2: { type: 'card', status: 'retired' } }), fewer), [])
  })
  test('retired id που εμφανίζεται ξανά στο περιεχόμενο → σφάλμα', () => {
    assert.match(checkLedger(ledger({ ...base(), c2: { type: 'card', status: 'retired' } }), content).join(), /retired/)
  })
  test('αλλαγή τύπου → σφάλμα· ίδιο id σε κάρτα ΚΑΙ ερώτηση → σφάλμα', () => {
    assert.match(checkLedger(ledger({ ...base(), q1: { type: 'card', status: 'active' } }), content).join(), /άλλαξε τύπο/)
    assert.match(checkLedger(ledger(base()), { ...content, questions: ['q1', 'c1'] }).join(), /και card και question/)
  })
  test('άκυρη μορφή μητρώου → σφάλμα', () => {
    assert.equal(checkLedger(null, content).length, 1)
    assert.equal(checkLedger({ ...ledger(base()), courseId: 'other' }, content).length, 1)
    assert.ok(checkLedger(ledger({ ...base(), c1: { type: 'card', status: 'maybe' } }), content).length)
  })
})

describe('ιστορικό: το μητρώο είναι append-only', () => {
  test('id που χάνεται από το μητρώο → σφάλμα', () => {
    const { c2, ...rest } = base()
    assert.match(checkLedgerHistory(ledger(base()), ledger(rest)).join(), /αφαιρέθηκε από το μητρώο/)
    assert.ok(c2)
  })
  test('retired → active → σφάλμα· active → retired → έγκυρο', () => {
    const retired = { ...base(), c2: { type: 'card', status: 'retired' } }
    assert.match(checkLedgerHistory(ledger(retired), ledger(base())).join(), /ήταν retired/)
    assert.deepEqual(checkLedgerHistory(ledger(base()), ledger(retired)), [])
  })
  test('αλλαγή τύπου στο μητρώο → σφάλμα', () => {
    assert.match(checkLedgerHistory(ledger(base()), ledger({ ...base(), q1: { type: 'card', status: 'active' } })).join(), /άλλαξε τύπο/)
  })
})
