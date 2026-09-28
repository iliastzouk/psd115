/**
 * Ντετερμινιστικό inventory του περιεχομένου PSD115 — baseline για migrations (Phase 1B).
 *
 * Καταγράφει:
 *  - πλήρη ταξινομημένα σύνολα IDs: κατηγορίες, κάρτες, ερωτήσεις κουίζ, ερωτήσεις ανάπτυξης
 *  - αναφορές διαφανειών ως `διαδρομή#αριθμός` (187)
 *  - στόχους διαδρομών και slugs θεμάτων (εβδομάδες 1–4)
 *  - canonical hash ΚΑΘΕ item (κείμενο, επιλογές, σωστή απάντηση, κατηγορία…)
 *  - canonical hash ΚΑΘΕ export ΚΑΘΕ module κάτω από το src/data (η επιφάνεια που βλέπει η εφαρμογή)
 *  - hash της σειράς των πινάκων (flashcards / quizQuestions / CATEGORIES)
 *
 * Run:
 *   node scripts/content-inventory.mjs            → τυπώνει σύνοψη
 *   node scripts/content-inventory.mjs --write    → γράφει tests/fixtures/content-baseline.json
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)
export const BASELINE_PATH = path.join(root, 'tests/fixtures/content-baseline.json')

/** Σταθερή σειριοποίηση: ταξινομημένα κλειδιά, functions ως το κείμενό τους. */
function canonical(value) {
  if (typeof value === 'function') return `fn:${value.toString()}`
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]))
  }
  return value === undefined ? '__undefined__' : value
}
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex').slice(0, 16)
const sorted = (arr) => [...arr].sort()
const itemHashes = (items) => Object.fromEntries([...items].sort((a, b) => (a.id < b.id ? -1 : 1)).map((x) => [x.id, hash(x)]))

function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
}

export async function buildInventory() {
  const q = await imp('src/data/questions.js')
  const w = {
    1: await imp('src/data/week1/index.js'),
    2: await imp('src/data/week2/index.js'),
    3: await imp('src/data/week3/index.js'),
    4: await imp('src/data/week4/index.js'),
  }
  const exam = [
    ...w[1].getWeek1ExamQuestions(),
    ...w[2].getWeek2ExamQuestions(),
    ...w[3].getWeek3ExamQuestions(),
    ...w[4].getWeek4ExamQuestions(),
  ]
  const slideMaps = {
    1: (await imp('src/data/week1/k1PptRefsByRoute.js')).K1_PPT_SLIDES_BY_ROUTE,
    2: w[2].K2_PPT_SLIDES_BY_ROUTE,
    3: w[3].K3_PPT_SLIDES_BY_ROUTE,
    4: w[4].K4_PPT_SLIDES_BY_ROUTE,
  }
  const slideRefs = Object.values(slideMaps).flatMap((m) => Object.entries(m).flatMap(([route, nums]) => nums.map((n) => `${route}#${n}`)))

  // Κάθε module κάτω από src/data: όνομα export → hash τιμής. Αυτή είναι η επιφάνεια που διαβάζει η εφαρμογή.
  const modules = {}
  for (const abs of walk(path.join(root, 'src/data')).filter((f) => f.endsWith('.js')).sort()) {
    const rel = path.relative(root, abs).split(path.sep).join('/')
    const mod = await imp(rel)
    modules[rel] = Object.fromEntries(Object.keys(mod).sort().map((k) => [k, hash(mod[k])]))
  }

  return {
    counts: {
      categories: q.CATEGORIES.length,
      flashcards: q.flashcards.length,
      quizQuestions: q.quizQuestions.length,
      openEnded: exam.length,
      slideRefs: slideRefs.length,
    },
    ids: {
      categories: sorted(q.CATEGORIES.map((x) => x.id)),
      flashcards: sorted(q.flashcards.map((x) => x.id)),
      quizQuestions: sorted(q.quizQuestions.map((x) => x.id)),
      openEnded: sorted(exam.map((x) => x.id)),
      slideRefs: sorted(slideRefs),
    },
    routes: {
      week1LessonNav: w[1].WEEK1_LESSON_NAV.map((n) => n.to),
      week1TopicSlugs: w[1].WEEK1_TOPIC_CARDS.map((t) => t.slug),
      week2TopicSlugs: w[2].WEEK2_TOPICS.map((t) => t.slug),
      week3TopicSlugs: w[3].WEEK3_TOPICS.map((t) => t.slug),
      week4TopicSlugs: w[4].WEEK4_TOPICS.map((t) => t.slug),
    },
    order: {
      categories: hash(q.CATEGORIES.map((x) => x.id)),
      flashcards: hash(q.flashcards.map((x) => x.id)),
      quizQuestions: hash(q.quizQuestions.map((x) => x.id)),
    },
    itemHashes: {
      categories: itemHashes(q.CATEGORIES),
      flashcards: itemHashes(q.flashcards),
      quizQuestions: itemHashes(q.quizQuestions),
      openEnded: itemHashes(exam),
    },
    modules,
  }
}

/** Λίστα διαφορών μεταξύ δύο inventories (κενή = ταυτόσημα). */
export function diffInventories(before, after) {
  const out = []
  for (const key of Object.keys(before.ids)) {
    const a = new Set(before.ids[key])
    const b = new Set(after.ids[key] ?? [])
    const missing = [...a].filter((x) => !b.has(x))
    const added = [...b].filter((x) => !a.has(x))
    if (missing.length) out.push(`${key}: λείπουν ${missing.length} (${missing.slice(0, 5).join(', ')})`)
    if (added.length) out.push(`${key}: νέα ${added.length} (${added.slice(0, 5).join(', ')})`)
    if ((after.ids[key] ?? []).length !== b.size) out.push(`${key}: διπλά IDs`)
  }
  for (const key of Object.keys(before.counts)) {
    if (before.counts[key] !== after.counts[key]) out.push(`count ${key}: ${before.counts[key]} → ${after.counts[key]}`)
  }
  for (const key of Object.keys(before.itemHashes)) {
    for (const [id, h] of Object.entries(before.itemHashes[key])) {
      const h2 = after.itemHashes[key]?.[id]
      if (h2 !== undefined && h2 !== h) out.push(`${key} «${id}»: άλλαξε περιεχόμενο`)
    }
  }
  for (const key of Object.keys(before.routes)) {
    if (JSON.stringify(before.routes[key]) !== JSON.stringify(after.routes[key])) out.push(`routes ${key}: άλλαξαν`)
  }
  for (const key of Object.keys(before.order)) {
    if (before.order[key] !== after.order[key]) out.push(`σειρά ${key}: άλλαξε`)
  }
  for (const [mod, exps] of Object.entries(before.modules)) {
    const now = after.modules[mod]
    if (!now) {
      out.push(`module ${mod}: λείπει`)
      continue
    }
    for (const [name, h] of Object.entries(exps)) {
      if (!(name in now)) out.push(`module ${mod}: λείπει το export «${name}»`)
      else if (now[name] !== h) out.push(`module ${mod}: το export «${name}» άλλαξε`)
    }
    for (const name of Object.keys(now)) if (!(name in exps)) out.push(`module ${mod}: νέο export «${name}»`)
  }
  for (const mod of Object.keys(after.modules)) if (!(mod in before.modules)) out.push(`module ${mod}: νέο module`)
  return out
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const inv = await buildInventory()
  if (process.argv.includes('--write')) {
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true })
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(inv, null, 2)}\n`)
    console.log(`✓ Baseline γράφτηκε: ${path.relative(root, BASELINE_PATH)}`)
  }
  const c = inv.counts
  const moduleExports = Object.values(inv.modules).reduce((n, m) => n + Object.keys(m).length, 0)
  console.log(
    `Inventory: ${c.categories} κατηγορίες · ${c.flashcards} κάρτες · ${c.quizQuestions} κουίζ · ${c.openEnded} ανάπτυξης · ` +
      `${c.slideRefs} αναφορές διαφανειών · ${Object.keys(inv.modules).length} modules / ${moduleExports} exports`,
  )
}
