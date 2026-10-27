/**
 * markCardSeen: μόνο κάρτες που υπάρχουν στο περιεχόμενο (content.isCard). Άγνωστο cardId → false, καμία εγγραφή,
 * καμία αλλαγή προόδου ή ειδοποίηση — όπως ήδη ο shadow recorder απορρίπτει άγνωστες κάρτες.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProgressService } from '../src/core/progress/progressService.js'
import { psd115ProgressAdapter as content } from '../src/core/progress/adapters/psd115.js'
import { createLegacyProgressBackend } from '../src/utils/legacyProgressBackend.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROD = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/progress-export.production-2026-10-05.json'), 'utf8')).keys
const STUDY = 'psd115-w1-study'

function setup(init = PROD) {
  const m = new Map(Object.entries(init))
  const writes = []
  const s = {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) {
      writes.push(k)
      m.set(k, String(v))
    },
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  }
  const svc = createProgressService({ courseId: 'psd115', content, backend: createLegacyProgressBackend(s), warn: () => {} })
  let notified = 0
  svc.subscribe(() => notified++)
  return { s, svc, writes, notified: () => notified }
}

describe('markCardSeen: έγκυρη κάρτα', () => {
  test('κάρτα του περιεχομένου που δεν έχει ειδωθεί → true, αποθηκεύεται', () => {
    const { s, svc } = setup()
    assert.equal(content.isCard('fc-freud-1'), true)
    assert.equal(svc.markCardSeen('fc-freud-1'), true)
    assert.ok(JSON.parse(s.getItem(STUDY)).flashcardSeenIds.includes('fc-freud-1'))
    assert.ok(svc.getSnapshot().courses.psd115.flashcardSeenIds.includes('psd115/fc-freud-1'))
  })
  test('κάρτα που ήδη είδε → false (no-op), καμία εγγραφή', () => {
    const { svc, writes } = setup()
    svc.markCardSeen('fc-freud-1')
    writes.length = 0
    assert.equal(svc.markCardSeen('fc-freud-1'), false)
    assert.deepEqual(writes, [])
  })
})

describe('markCardSeen: άγνωστη κάρτα → false, τίποτα δεν αλλάζει', () => {
  const UNKNOWN = {
    'ανύπαρκτο id κάρτας': 'fc-pavlov-9',
    'id ερώτησης (όχι κάρτα)': 'q-w2-var-1',
    'global id αντί για local': 'psd115/fc-freud-1',
    'κενό string': '',
    'undefined': undefined,
  }
  for (const [label, id] of Object.entries(UNKNOWN)) {
    test(label, () => {
      const { s, svc, writes, notified } = setup()
      const before = svc.getSnapshot()
      assert.equal(content.isCard(id), false)
      assert.equal(svc.markCardSeen(id), false)
      assert.deepEqual(writes, [], 'καμία εγγραφή στο storage')
      assert.deepEqual(s.dump(), PROD)
      assert.equal(svc.getSnapshot(), before, 'ίδιο state (ούτε πρόοδος ούτε writeFailure)')
      assert.equal(notified(), 0)
    })
  }
  test('μετά από άγνωστη κάρτα, μια έγκυρη αποθηκεύεται κανονικά', () => {
    const { s, svc } = setup()
    svc.markCardSeen('fc-pavlov-9')
    assert.equal(svc.markCardSeen('fc-freud-1'), true)
    const seen = JSON.parse(s.getItem(STUDY)).flashcardSeenIds
    assert.ok(seen.includes('fc-freud-1'))
    assert.ok(!seen.includes('fc-pavlov-9'))
  })
})
