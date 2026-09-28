/**
 * Phase 1B: το περιεχόμενο μετά από κάθε μετακίνηση πρέπει να είναι ΤΑΥΤΟΣΗΜΟ με το baseline
 * (tests/fixtures/content-baseline.json, γραμμένο πριν από το migration).
 * Όχι μόνο ίδιοι αριθμοί: ίδια σύνολα IDs, ίδιο περιεχόμενο ανά item (hash), ίδια σειρά,
 * ίδιες διαδρομές, και ίδια exports σε κάθε module του src/data.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildInventory, diffInventories, BASELINE_PATH } from '../scripts/content-inventory.mjs'

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
const current = await buildInventory()

describe('Content identity vs baseline', () => {
  test('ακριβείς αριθμοί: 49 / 198 / 208 / 87 / 187', () => {
    assert.deepEqual(current.counts, { categories: 49, flashcards: 198, quizQuestions: 208, openEnded: 87, slideRefs: 187 })
    assert.deepEqual(current.counts, baseline.counts)
  })

  for (const key of ['categories', 'flashcards', 'quizQuestions', 'openEnded', 'slideRefs']) {
    test(`SET(${key}) before === after`, () => {
      assert.deepEqual(current.ids[key], baseline.ids[key])
      assert.equal(new Set(current.ids[key]).size, current.ids[key].length, 'διπλά IDs')
    })
  }

  test('ίδιο περιεχόμενο ανά item (κείμενο, επιλογές, σωστή απάντηση, κατηγορία, front/back)', () => {
    assert.deepEqual(current.itemHashes, baseline.itemHashes)
  })

  test('ίδιες διαδρομές και slugs θεμάτων', () => {
    assert.deepEqual(current.routes, baseline.routes)
  })

  test('ίδια σειρά πινάκων', () => {
    assert.deepEqual(current.order, baseline.order)
  })

  test('κάθε module του src/data εκθέτει τα ίδια exports με ίδιο περιεχόμενο', () => {
    assert.deepEqual(diffInventories(baseline, current), [])
  })
})

describe('Ο συγκριτής πιάνει κάθε είδος αλλαγής', () => {
  const clone = () => structuredClone(baseline)

  test('ταυτόσημα → καμία διαφορά', () => {
    assert.deepEqual(diffInventories(baseline, clone()), [])
  })
  test('ίδιο πλήθος αλλά αλλαγμένο ID (αφαίρεση + προσθήκη)', () => {
    const b = clone()
    b.ids.quizQuestions[0] = 'q-renamed'
    const d = diffInventories(baseline, b)
    assert.ok(d.some((x) => x.includes('λείπουν')) && d.some((x) => x.includes('νέα')), d.join('\n'))
  })
  test('διπλό ID', () => {
    const b = clone()
    b.ids.flashcards.push(b.ids.flashcards[0])
    assert.ok(diffInventories(baseline, b).some((x) => x.includes('διπλά')))
  })
  test('αλλαγή περιεχομένου με ίδιο ID', () => {
    const b = clone()
    const id = Object.keys(b.itemHashes.quizQuestions)[0]
    b.itemHashes.quizQuestions[id] = '0000000000000000'
    assert.ok(diffInventories(baseline, b).some((x) => x.includes(id)))
  })
  test('χαμένη αναφορά διαφάνειας', () => {
    const b = clone()
    b.ids.slideRefs.pop()
    assert.ok(diffInventories(baseline, b).length > 0)
  })
  test('χαμένο ή αλλαγμένο export module', () => {
    const b = clone()
    const mod = Object.keys(b.modules)[0]
    const name = Object.keys(b.modules[mod])[0]
    delete b.modules[mod][name]
    assert.ok(diffInventories(baseline, b).some((x) => x.includes(name)))
  })
  test('αλλαγμένη διαδρομή', () => {
    const b = clone()
    b.routes.week2TopicSlugs = [...b.routes.week2TopicSlugs].reverse()
    assert.ok(diffInventories(baseline, b).some((x) => x.includes('routes')))
  })
})
