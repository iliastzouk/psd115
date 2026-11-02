/**
 * Φάση 6d (Δ3) — το snapshot των σελίδων του PSD115 (scripts/snapshot-pages.mjs, baseline στο
 * tests/fixtures/psd115-pages.snapshot.json). Εδώ ελέγχεται χωρίς browser ότι το baseline είναι πλήρες και ότι οι συνθήκες
 * της καταγραφής είναι οι συμφωνημένες· η σύγκριση των σελίδων γίνεται με `npm run snapshot:pages` πάνω στο build.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { snapshotRoutes } from '../scripts/snapshot-routes.mjs'
import { getContentCourse } from '../src/core/routing/catalog.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8')
const baseline = JSON.parse(read('tests/fixtures/psd115-pages.snapshot.json'))
const harness = read('scripts/snapshot-pages.mjs')

describe('λίστα διαδρομών (μέρος του snapshot)', () => {
  const routes = snapshotRoutes('psd115')
  test('το baseline έχει ακριβώς τις διαδρομές του καταλόγου, με την ίδια σειρά', () => {
    assert.deepEqual(baseline.routes, routes)
    assert.deepEqual(baseline.pages.map((p) => p.route), routes)
    assert.equal(new Set(routes).size, routes.length)
  })
  test('σειρά: αρχική μαθημάτων, αρχική μαθήματος, units κατά order, θέματα με τη σειρά του καταλόγου, εργαλεία, έγγραφα, πρόοδος', () => {
    const c = getContentCourse('psd115')
    const units = [...c.course.units].sort((a, b) => a.order - b.order).map((u) => u.id)
    assert.deepEqual(routes.slice(0, 2 + units.length), ['/', '/psd115', ...units.map((u) => `/psd115/units/${u}`)])
    const topics = routes.filter((r) => r.startsWith('/psd115/topics/')).map((r) => r.slice('/psd115/topics/'.length))
    assert.deepEqual(topics, c.topics.map((t) => t.id))
    const kinds = routes.map((r) => r.split(/[/?]/)[r.startsWith('/psd115/') ? 2 : 1] || 'home')
    const firstOf = (k) => kinds.indexOf(k)
    const lastOf = (k) => kinds.lastIndexOf(k)
    assert.ok(lastOf('units') < firstOf('topics') && lastOf('topics') < firstOf('study') && lastOf('study') < firstOf('docs') && lastOf('docs') < firstOf('progress'))
    assert.equal(routes.filter((r) => r.startsWith('/psd115/docs/')).length, c.docs.length)
  })
})

describe('συνθήκες καταγραφής', () => {
  test('ρυθμίσεις: ΜΟΝΟ disclaimer και light theme· κανένα κλειδί προόδου', () => {
    assert.deepEqual(baseline.settings, { 'psd115-disclaimer-v1': '1', 'psd115-w1-theme': 'light' })
    assert.doesNotMatch(harness, /study-progress|progress-txn|psd115-backup/)
  })
  test('viewport 1280×900, σταθερό seed και ρολόι', () => {
    assert.deepEqual(baseline.viewport, { width: 1280, height: 900 })
    assert.equal(typeof baseline.seed, 'number')
    assert.match(baseline.clock, /^\d{4}-\d\d-\d\dT/)
    assert.match(harness, /clock\.setFixedTime\(new Date\(CLOCK\)\)/)
    assert.match(harness, /Math\.random = \(\) =>/)
  })
  test('νέο browser context για κάθε διαδρομή· --write μόνο με δύο ίδιες εκτελέσεις', () => {
    assert.match(harness, /async function capture\(browser, route\) \{\n {2}const context = await browser\.newContext\(/)
    assert.match(harness, /const second = await runOnce\(browser, routes\)/)
  })
  test('κάθε σελίδα: τελικό URL, τίτλος, επικεφαλίδες, links, checkboxes, μπλοκ κειμένου· χωρίς σφάλματα', () => {
    for (const p of baseline.pages) {
      assert.deepEqual(Object.keys(p), ['route', 'url', 'title', 'headings', 'links', 'checkboxes', 'blocks'], p.route)
      assert.ok(p.blocks.length > 0, p.route)
    }
  })
  test('το harness και το baseline δεν είναι πηγή CSS classes (το build μένει ίδιο)', () => {
    const css = read('src/index.css')
    assert.match(css, /@source not '\.\.\/scripts\/snapshot-pages\.mjs';/)
    assert.match(css, /@source not '\.\.\/tests\/fixtures\/psd115-pages\.snapshot\.json';/)
  })
})
