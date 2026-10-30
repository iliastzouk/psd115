/**
 * Μητρώο IDs περιεχομένου ανά μάθημα (Φάση 6a, J4): content/courses/<courseId>/ids.ledger.json
 *
 *   { courseId, version: 1, ids: { <id>: { type: 'card' | 'question', status: 'active' | 'retired' } } }
 *
 * Κανόνες (τα orphan events δεν πρέπει να «ξαναζωντανέψουν» σε νέο περιεχόμενο):
 *  - κάθε κάρτα / ερώτηση του περιεχομένου υπάρχει στο μητρώο ως `active`, με τον ίδιο τύπο
 *  - ένα id είναι μοναδικό σε ΟΛΟΥΣ τους τύπους του μαθήματος
 *  - id `active` του μητρώου που λείπει από το περιεχόμενο → σφάλμα (η αφαίρεση θέλει ρητό `retired`)
 *  - id `retired` που εμφανίζεται ξανά στο περιεχόμενο → σφάλμα· ένα id δεν αλλάζει ποτέ τύπο
 *  - ιστορικό (έναντι προηγούμενης έκδοσης του μητρώου): κανένα id δεν φεύγει, retired → active ποτέ, τύπος ποτέ
 *
 * CLI:  node scripts/id-ledger.mjs [--course psd115] [--add]   (--add: προσθέτει ρητά τα νέα ids ως active)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
export const ledgerPath = (courseId) => path.join(root, 'content/courses', courseId, 'ids.ledger.json')
const TYPES = new Set(['card', 'question'])
const STATUSES = new Set(['active', 'retired'])
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** Τύπος κάθε id του περιεχομένου· σφάλμα αν ένα id υπάρχει σε δύο τύπους. */
export function contentIds({ cards, questions }) {
  const ids = new Map()
  const errors = []
  for (const [type, list] of [['card', cards], ['question', questions]]) {
    for (const id of list) {
      if (ids.has(id) && ids.get(id) !== type) errors.push(`το id «${id}» είναι και ${ids.get(id)} και ${type}`)
      else ids.set(id, type)
    }
  }
  return { ids, errors }
}

/** @returns {string[]} σφάλματα (κενό = έγκυρο) */
export function checkLedger(ledger, { courseId, cards, questions }) {
  const errors = []
  if (!isObj(ledger) || ledger.courseId !== courseId || ledger.version !== 1 || !isObj(ledger.ids)) {
    return [`μητρώο: αναμενόταν { courseId: "${courseId}", version: 1, ids: {} }`]
  }
  for (const [id, e] of Object.entries(ledger.ids)) {
    if (!isObj(e) || !TYPES.has(e.type) || !STATUSES.has(e.status) || Object.keys(e).length !== 2) errors.push(`μητρώο: «${id}»: αναμενόταν { type, status }`)
  }
  const { ids, errors: dup } = contentIds({ cards, questions })
  errors.push(...dup)
  for (const [id, type] of ids) {
    const e = ledger.ids[id]
    if (!e) errors.push(`νέο id «${id}» (${type}) χωρίς εγγραφή στο μητρώο — πρόσθεσέ το ρητά (npm run content:ledger -- --add)`)
    else if (e.type !== type) errors.push(`το id «${id}» άλλαξε τύπο (${e.type} → ${type})`)
    else if (e.status === 'retired') errors.push(`το id «${id}» είναι retired και δεν επιτρέπεται να εμφανιστεί ξανά`)
  }
  for (const [id, e] of Object.entries(ledger.ids)) {
    if (e?.status === 'active' && !ids.has(id)) errors.push(`το id «${id}» αφαιρέθηκε από το περιεχόμενο χωρίς να σημειωθεί retired`)
  }
  return errors
}

/** Έλεγχος έναντι προηγούμενης έκδοσης του μητρώου (append-only). @returns {string[]} */
export function checkLedgerHistory(previous, next) {
  const errors = []
  for (const [id, e] of Object.entries(previous?.ids ?? {})) {
    const n = next?.ids?.[id]
    if (!n) errors.push(`το id «${id}» αφαιρέθηκε από το μητρώο (το μητρώο δεν χάνει ποτέ ids)`)
    else if (n.type !== e.type) errors.push(`το id «${id}» άλλαξε τύπο στο μητρώο (${e.type} → ${n.type})`)
    else if (e.status === 'retired' && n.status !== 'retired') errors.push(`το id «${id}» ήταν retired και έγινε ξανά ${n.status}`)
  }
  return errors
}

/** Νέο μητρώο με τα ids του περιεχομένου που λείπουν, ως active (οι υπάρχουσες εγγραφές δεν αλλάζουν). */
export function withNewIds(ledger, { courseId, cards, questions }) {
  const out = { courseId, version: 1, ids: { ...(ledger?.ids ?? {}) } }
  const { ids } = contentIds({ cards, questions })
  for (const [id, type] of ids) if (!out.ids[id]) out.ids[id] = { type, status: 'active' }
  return out
}

export const readLedger = (courseId) => {
  const p = ledgerPath(courseId)
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2)
  const courseId = args.includes('--course') ? args[args.indexOf('--course') + 1] : 'psd115'
  const { STUDY_CONTENT } = await import(pathToFileURL(path.join(root, 'src/core/study/content.js')).href)
  const c = STUDY_CONTENT[courseId]
  if (!c) {
    console.error(`✗ Το «${courseId}» δεν έχει περιεχόμενο μελέτης`)
    process.exit(1)
  }
  const content = { courseId, cards: c.flashcards.map((x) => x.id), questions: c.quizQuestions.map((x) => x.id) }
  const current = readLedger(courseId)
  if (args.includes('--add')) {
    const next = withNewIds(current, content)
    fs.writeFileSync(ledgerPath(courseId), `${JSON.stringify(next, null, 2)}\n`)
    console.log(`✓ μητρώο ${courseId}: ${Object.keys(next.ids).length - Object.keys(current?.ids ?? {}).length} νέα ids`)
  }
  const errors = checkLedger(readLedger(courseId), content)
  if (errors.length) {
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log(`✓ μητρώο ${courseId} έγκυρο`)
}
