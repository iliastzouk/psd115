/**
 * Phase 1B: το περιεχόμενο μετά από κάθε μετακίνηση πρέπει να είναι ΤΑΥΤΟΣΗΜΟ με το baseline
 * (tests/fixtures/content-baseline.json, γραμμένο πριν από το migration).
 * Όχι μόνο ίδιοι αριθμοί: ίδια σύνολα IDs, ίδιο περιεχόμενο ανά item (hash), ίδια σειρά,
 * ίδιες διαδρομές, και ίδια exports σε κάθε module περιεχομένου (τα αρχικά 46 του src/data).
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

  test('κάθε αρχικό module περιεχομένου εκθέτει τα ίδια exports με ίδιο περιεχόμενο', () => {
    assert.deepEqual(diffInventories(baseline, current), [])
  })
})

const root = new URL('..', import.meta.url).pathname
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}/${d.name}`) : [`${dir}/${d.name}`]))

describe('Δομή μετά το migration', () => {
  test('Phase 1C-A: τα adapters του src/data αφαιρέθηκαν και κανείς δεν εισάγει από εκεί', () => {
    assert.equal(fs.existsSync(`${root}src/data`), false)
    const files = [...walk(`${root}src`), ...walk(`${root}scripts`), ...walk(`${root}tests`).filter((f) => !f.includes('/fixtures/'))]
    for (const f of files) {
      const code = fs.readFileSync(f, 'utf8')
      assert.doesNotMatch(code, /from '(\.\.?\/)+data\/|imp\(['`]src\/data\/|import\(['`](\.\.\/)+src\/data\//, f)
    }
  })

  test('το baseline καλύπτει ακριβώς τα 46 αρχικά modules, τώρα από το content/', () => {
    assert.equal(Object.keys(current.modules).length, 46)
    assert.deepEqual(Object.keys(current.modules).sort(), Object.keys(baseline.modules).sort())
  })

  test('το content/ δεν εξαρτάται από τον κώδικα της εφαρμογής', () => {
    for (const f of walk(`${root}content`)) {
      for (const [, spec] of fs.readFileSync(f, 'utf8').matchAll(/from '([^']+)'/g)) {
        assert.ok(spec.startsWith('./') || spec.startsWith('../'), `${f}: ${spec}`)
        assert.ok(new URL(spec, `file://${f}`).pathname.startsWith(`${root}content/`), `${f} → ${spec}`)
      }
    }
  })

  test('course.js: ίδιο id με το registry, units συνεπή με decks και πηγές', async () => {
    const { course } = await import('../content/courses/psd115/course.js')
    const { sources } = await import('../content/courses/psd115/sources.js')
    const { PPT_DECK_REGISTRY } = await import('../content/courses/psd115/pptDeckRegistry.js')
    const { registry } = await import('../src/core/academic/data/index.js')
    assert.ok(registry.courses.some((c) => c.id === course.id))
    assert.deepEqual(course.provenance, { origin: 'legacy', reviewed: false })
    const unitIds = course.units.map((u) => u.id)
    assert.equal(new Set(unitIds).size, unitIds.length)
    for (const u of course.units) {
      assert.ok(fs.existsSync(`${root}content/courses/psd115/units/${u.id}`), u.id)
      assert.ok(PPT_DECK_REGISTRY[u.deck], u.deck)
    }
    for (const s of sources) {
      assert.ok(unitIds.includes(s.unit), s.id)
      assert.ok(fs.existsSync(`${root}public/${s.path}`), s.path)
      assert.equal(PPT_DECK_REGISTRY[course.units.find((u) => u.id === s.unit).deck].pdfPath, s.path)
    }
  })
})

describe('Αρχεία προόδου των tests (fixtures)', () => {
  // Φάση 6b: τα παλιά exports (psd115-progress-export) αφαιρέθηκαν. Ελέγχεται η ακεραιότητα του δείγματος της νέας
  // μορφής απέναντι στο περιεχόμενο, και ότι το συνθετικό παλιό αρχείο απορρίπτεται με σαφές μήνυμα.
  const fixture = (name) => JSON.parse(fs.readFileSync(`${root}tests/fixtures/${name}`, 'utf8'))
  const local = (item) => {
    assert.ok(item.startsWith('psd115/'), item)
    return item.slice('psd115/'.length)
  }
  test('study-progress.sample.json: κάθε καταγραφή, λάθος και checklist αναφέρει πραγματικό ID περιεχομένου', async () => {
    const { getContentCourse } = await import('../src/core/routing/catalog.js')
    const { quizQuestions } = await import('../content/courses/psd115/questions.js')
    const topicIds = getContentCourse('psd115').topics.map((t) => t.id)
    const sample = fixture('study-progress.sample.json')
    assert.equal(sample.format, 'study-progress')
    for (const ev of sample.events) {
      const id = local(ev.item)
      if (ev.kind === 'flip') assert.ok(current.ids.flashcards.includes(id), id)
      else if (ev.kind === 'answer') assert.ok(current.ids.quizQuestions.includes(id), id)
      else assert.fail(`απρόβλεπτο kind ${ev.kind}`)
    }
    for (const w of sample.state['progress:wrongbook:psd115'].entries) {
      const id = local(w.item)
      assert.ok(current.ids.quizQuestions.includes(id), id)
      assert.equal(w.group, quizQuestions.find((q) => q.id === id).categoryId, `${id}: ομάδα`)
      assert.ok(current.ids.categories.includes(w.group), w.group)
    }
    for (const topicId of Object.keys(sample.state['progress:checklists:psd115'].topics)) assert.ok(topicIds.includes(topicId), topicId)
  })
  test('legacy-export.minimal.json: συνθετικό παλιό αρχείο → απόρριψη με σαφές μήνυμα, χωρίς εγγραφή', async () => {
    const { planImport } = await import('../src/utils/studyProgressBackup.js')
    const { studyContentAdapters } = await import('../src/core/progress/adapters/studyContent.js')
    const data = fixture('legacy-export.minimal.json')
    assert.deepEqual(Object.keys(data.keys), ['psd115-w1-study'], 'ελάχιστο, χωρίς δεδομένα παραγωγής')
    const writes = []
    const storage = { getItem: () => null, setItem: (k) => writes.push(k), removeItem: (k) => writes.push(k), key: () => null, length: 0 }
    assert.throws(() => planImport(data, { storage, adapters: studyContentAdapters() }), (e) => e.name === 'ImportRejected' && /παλιά μορφή/.test(e.message))
    assert.deepEqual(writes, [])
  })
  test('τα παλιά exports δεν υπάρχουν πια στα fixtures', () => {
    const names = fs.readdirSync(`${root}tests/fixtures`)
    assert.deepEqual(names.filter((n) => n.startsWith('progress-export.')), [])
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
