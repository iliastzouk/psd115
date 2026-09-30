/**
 * Έλεγχος εγκυρότητας περιεχομένου για την ΤΡΕΧΟΥΣΑ δομή (content/courses/psd115).
 * Αποτυγχάνει (exit 1) με σαφή μηνύματα· αλλιώς τυπώνει σύντομη σύνοψη.
 * Run: node scripts/validate-content.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href)

const errors = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

function checkUnique(items, label, getId = (x) => x.id) {
  const seen = new Map()
  for (const item of items) {
    const id = getId(item)
    if (!isNonEmptyString(id)) {
      err(`${label}: εγγραφή χωρίς id (${JSON.stringify(item).slice(0, 80)}…)`)
      continue
    }
    seen.set(id, (seen.get(id) ?? 0) + 1)
  }
  for (const [id, n] of seen) if (n > 1) err(`${label}: διπλό id «${id}» (${n} φορές)`)
  return new Set(seen.keys())
}

let questions
try {
  questions = await imp('content/courses/psd115/questions.js')
} catch (e) {
  console.error(`✗ Αποτυχία φόρτωσης περιεχομένου (content/courses/psd115/questions.js):\n  ${e.stack || e}`)
  process.exit(1)
}
const { CATEGORIES, WEEK1_CATEGORIES, WEEK2_CATEGORIES, WEEK3_CATEGORIES, WEEK4_CATEGORIES, flashcards, quizQuestions } =
  questions
const weeks = {
  1: await imp('content/courses/psd115/units/k1/index.js'),
  2: await imp('content/courses/psd115/units/k2/index.js'),
  3: await imp('content/courses/psd115/units/k3/index.js'),
  4: await imp('content/courses/psd115/units/k4/index.js'),
}
const WEEK_CATEGORIES = { 1: WEEK1_CATEGORIES, 2: WEEK2_CATEGORIES, 3: WEEK3_CATEGORIES, 4: WEEK4_CATEGORIES }

// --- Κατηγορίες ---
for (const c of CATEGORIES) {
  if (!isNonEmptyString(c.id) || !isNonEmptyString(c.label)) err(`Κατηγορία χωρίς id ή label: ${JSON.stringify(c)}`)
}
const categoryIds = checkUnique(CATEGORIES, 'Κατηγορίες')
const categoryWeek = new Map()
for (const [w, cats] of Object.entries(WEEK_CATEGORIES)) for (const c of cats) categoryWeek.set(c.id, Number(w))

// --- Flashcards ---
const flashcardIds = checkUnique(flashcards, 'Flashcards')
for (const f of flashcards) {
  const where = `Flashcard «${f.id}»`
  for (const field of ['id', 'categoryId', 'front', 'back']) {
    if (!isNonEmptyString(f[field])) err(`${where}: λείπει ή είναι κενό το «${field}»`)
  }
  if (isNonEmptyString(f.categoryId) && !categoryIds.has(f.categoryId)) {
    err(`${where}: άγνωστη κατηγορία «${f.categoryId}»`)
  }
}

// --- Ερωτήσεις κουίζ ---
const QUESTION_TYPES = new Set(['mcq', 'tf'])
const quizIds = checkUnique(quizQuestions, 'Ερωτήσεις κουίζ')
for (const q of quizQuestions) {
  const where = `Ερώτηση «${q.id}»`
  for (const field of ['id', 'categoryId', 'question', 'explanation']) {
    if (!isNonEmptyString(q[field])) err(`${where}: λείπει ή είναι κενό το «${field}»`)
  }
  if (!QUESTION_TYPES.has(q.type)) err(`${where}: άκυρος τύπος «${q.type}» (επιτρέπονται: ${[...QUESTION_TYPES].join(', ')})`)
  if (!Array.isArray(q.options) || q.options.length < 2) {
    err(`${where}: χρειάζονται τουλάχιστον 2 επιλογές`)
  } else {
    if (q.options.some((o) => !isNonEmptyString(o))) err(`${where}: κενή επιλογή`)
    if (new Set(q.options).size !== q.options.length) err(`${where}: διπλές επιλογές`)
    if (q.type === 'tf' && q.options.length !== 2) err(`${where}: ερώτηση Σ/Λ με ${q.options.length} επιλογές`)
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      err(`${where}: άκυρο correctIndex ${JSON.stringify(q.correctIndex)} για ${q.options.length} επιλογές`)
    }
  }
  if (isNonEmptyString(q.categoryId) && !categoryIds.has(q.categoryId)) err(`${where}: άγνωστη κατηγορία «${q.categoryId}»`)
}

// --- Κάθε κατηγορία έχει περιεχόμενο ---
for (const id of categoryIds) {
  const n = flashcards.filter((f) => f.categoryId === id).length + quizQuestions.filter((q) => q.categoryId === id).length
  if (n === 0) warn(`Η κατηγορία «${id}» δεν έχει ούτε κάρτες ούτε ερωτήσεις`)
}

// --- Ερωτήσεις ανάπτυξης (exam mode) ---
const examGetters = {
  1: weeks[1].getWeek1ExamQuestions,
  2: weeks[2].getWeek2ExamQuestions,
  3: weeks[3].getWeek3ExamQuestions,
  4: weeks[4].getWeek4ExamQuestions,
}
const allExam = []
for (const [w, get] of Object.entries(examGetters)) {
  const list = get()
  if (!list.length) warn(`Εβδομάδα ${w}: καμία ερώτηση ανάπτυξης`)
  for (const q of list) {
    allExam.push(q)
    for (const field of ['id', 'question', 'idealAnswer']) {
      if (!isNonEmptyString(q[field])) err(`Ερώτηση ανάπτυξης «${q.id}» (εβδ. ${w}): λείπει ή είναι κενό το «${field}»`)
    }
  }
}
checkUnique(allExam, 'Ερωτήσεις ανάπτυξης')

function checkQuizRefs(ids, where) {
  if (!Array.isArray(ids)) return err(`${where}: αναμενόταν πίνακας IDs`)
  for (const id of ids) if (!quizIds.has(id)) err(`${where}: αναφορά σε ανύπαρκτη ερώτηση «${id}»`)
}

// --- Εβδομάδα 1: lessonQuizIds, κάρτες θεμάτων, πλοήγηση ---
const week1Dir = path.join(root, 'content/courses/psd115/units/k1')
for (const file of fs.readdirSync(week1Dir).filter((f) => f.endsWith('.js')).sort()) {
  const mod = await imp(`content/courses/psd115/units/k1/${file}`)
  for (const [name, value] of Object.entries(mod)) {
    if (name.endsWith('LessonQuizIds')) checkQuizRefs(value, `week1/${file} → ${name}`)
  }
}
const w1Slugs = checkUnique(weeks[1].WEEK1_TOPIC_CARDS, 'Εβδομάδα 1 θέματα', (t) => t.slug)
checkUnique(weeks[1].WEEK1_LESSON_NAV, 'Εβδομάδα 1 πλοήγηση', (n) => n.to)
for (const n of weeks[1].WEEK1_LESSON_NAV) {
  const slug = n.to.replace(/^\/week\/1\//, '')
  if (!w1Slugs.has(slug)) warn(`Εβδομάδα 1 πλοήγηση: «${n.to}» δεν αντιστοιχεί σε κάρτα θέματος`)
}

// --- Εβδομάδα 1: σειρά καρτών μέσα στα lesson components (FC_ORDER) ---
const componentsDir = path.join(root, 'src/components')
for (const file of fs.readdirSync(componentsDir).filter((f) => f.endsWith('.jsx'))) {
  const src = fs.readFileSync(path.join(componentsDir, file), 'utf8')
  const m = src.match(/const FC_ORDER = \[([^\]]*)\]/)
  if (!m) continue
  for (const id of m[1].match(/'[^']+'/g) ?? []) {
    const clean = id.slice(1, -1)
    if (!flashcardIds.has(clean)) err(`components/${file} → FC_ORDER: ανύπαρκτη κάρτα «${clean}»`)
  }
}

// --- Εβδομάδες 2–4: θέματα ---
for (const w of [2, 3, 4]) {
  const topics = weeks[w][`WEEK${w}_TOPICS`]
  const cats = new Set(WEEK_CATEGORIES[w].map((c) => c.id))
  checkUnique(topics, `Εβδομάδα ${w} θέματα`, (t) => t.slug)
  for (const t of topics) {
    const where = `Εβδομάδα ${w} θέμα «${t.slug}»`
    for (const field of ['slug', 'categoryId', 'title', 'short', 'intro']) {
      if (!isNonEmptyString(t[field])) err(`${where}: λείπει ή είναι κενό το «${field}»`)
    }
    for (const field of ['sections', 'progressChecklist', 'lessonQuizIds', 'examQuestions', 'flashcards', 'quizQuestions']) {
      if (!Array.isArray(t[field])) err(`${where}: το «${field}» πρέπει να είναι πίνακας`)
    }
    if (!cats.has(t.categoryId)) err(`${where}: η κατηγορία «${t.categoryId}» δεν ανήκει στην Εβδομάδα ${w}`)
    checkQuizRefs(t.lessonQuizIds ?? [], `${where} → lessonQuizIds`)
    for (const f of t.flashcards ?? []) {
      if (f.categoryId !== t.categoryId) err(`${where}: η κάρτα «${f.id}» έχει κατηγορία «${f.categoryId}»`)
    }
    for (const q of t.quizQuestions ?? []) {
      if (q.categoryId !== t.categoryId) err(`${where}: η ερώτηση «${q.id}» έχει κατηγορία «${q.categoryId}»`)
    }
    ;(t.sections ?? []).forEach((s, i) => {
      if (!isNonEmptyString(s.title) || !isNonEmptyString(s.body)) err(`${where}: η ενότητα ${i + 1} χρειάζεται title και body`)
    })
  }
}

// --- Διαφάνειες ανά διαδρομή ---
const slideSets = [
  [1, (await imp('content/courses/psd115/units/k1/k1PptRefsByRoute.js')).K1_PPT_SLIDES_BY_ROUTE, (await imp('content/courses/psd115/units/k1/k1PptSlideBodies.generated.js')).K1_PPT_TOTAL_SLIDES],
  [2, weeks[2].K2_PPT_SLIDES_BY_ROUTE, (await imp('content/courses/psd115/units/k2/k2PptSlideBodies.generated.js')).K2_PPT_TOTAL_SLIDES],
  [3, weeks[3].K3_PPT_SLIDES_BY_ROUTE, (await imp('content/courses/psd115/units/k3/k3PptSlideBodies.generated.js')).K3_PPT_TOTAL_SLIDES],
  [4, weeks[4].K4_PPT_SLIDES_BY_ROUTE, (await imp('content/courses/psd115/units/k4/k4PptSlideBodies.generated.js')).K4_PPT_TOTAL_SLIDES],
]
let slideRefCount = 0
for (const [w, byRoute, total] of slideSets) {
  const navRoutes = new Set(weeks[w][`WEEK${w}_LESSON_NAV`].map((n) => n.to))
  for (const [route, nums] of Object.entries(byRoute)) {
    if (!navRoutes.has(route)) err(`Διαφάνειες εβδ. ${w}: η διαδρομή «${route}» δεν υπάρχει στην πλοήγηση`)
    for (const n of nums) {
      slideRefCount += 1
      if (!Number.isInteger(n) || n < 1 || n > total) err(`Διαφάνειες εβδ. ${w} «${route}»: η διαφάνεια ${n} είναι εκτός 1…${total}`)
    }
  }
}

// --- Academic registry (Phase 1A) ---
const { registry } = await imp('src/core/academic/data/index.js')
const { validateRegistry } = await imp('src/core/academic/schema.js')
const { isLocalId, toGlobalId, parseGlobalId } = await imp('src/core/academic/ids.js')
const reg = validateRegistry(registry)
for (const e of reg.errors) err(`Registry: ${e}`)
// Το υπάρχον περιεχόμενο ανήκει στο PSD115· κάθε ID πρέπει να τυλίγεται σε global ID χωρίς αλλαγή.
const CONTENT_COURSE = 'psd115'
if (!registry.courses.some((c) => c.id === CONTENT_COURSE)) err(`Registry: λείπει το μάθημα «${CONTENT_COURSE}» του υπάρχοντος περιεχομένου`)
const contentIds = [...CATEGORIES, ...flashcards, ...quizQuestions, ...allExam].map((x) => x.id)
for (const id of contentIds) {
  if (!isLocalId(id)) err(`Global IDs: το «${id}» δεν είναι έγκυρο localId`)
  else if (parseGlobalId(toGlobalId(CONTENT_COURSE, id))?.localId !== id) err(`Global IDs: το «${id}» δεν επιστρέφει αυτούσιο`)
}

// --- Canonical routing (Phase 1C-B): ρητός πίνακας θεμάτων + legacy πίνακας ---
const { course: courseDef } = await imp('content/courses/psd115/course.js')
const { topics: topicMap } = await imp('content/courses/psd115/topics.js')
const { checkTopicMap } = await imp('src/core/routing/catalog.js')
const unitSlugs = {
  k1: weeks[1].WEEK1_LESSON_NAV.map((n) => n.to.replace(/^\/week\/1\//, '')),
  k2: weeks[2].WEEK2_TOPICS.map((t) => t.slug),
  k3: weeks[3].WEEK3_TOPICS.map((t) => t.slug),
  k4: weeks[4].WEEK4_TOPICS.map((t) => t.slug),
}
for (const e of checkTopicMap({ course: courseDef, topics: topicMap, unitSlugs })) err(`Πίνακας θεμάτων: ${e}`)
// Η πλοήγηση (1C-C) ακολουθεί τη σειρά του topics.js· πρέπει να ταυτίζεται με τη σειρά μαθημάτων κάθε unit.
for (const [unit, slugs] of Object.entries(unitSlugs)) {
  const order = topicMap.filter((t) => t.unit === unit).map((t) => t.legacySlug)
  if (order.join('|') !== slugs.join('|')) err(`Πίνακας θεμάτων: η σειρά της ${unit} διαφέρει από τη σειρά των μαθημάτων`)
}
let legacyRoutes = new Map()
try {
  const legacy = await imp('src/core/routing/legacy.js')
  const { resolveLocation } = await imp('src/core/routing/resolve.js')
  legacyRoutes = legacy.LEGACY_ROUTES
  const legacyKeys = new Set([
    ...courseDef.units.map((u) => u.route),
    ...courseDef.units.flatMap((u) => legacy.LEGACY_TOOLS.map((t) => `${u.route}/${t}`)),
    ...Object.values(weeks).flatMap((w, i) => w[`WEEK${i + 1}_LESSON_NAV`].map((n) => n.to)),
  ])
  for (const key of legacyKeys) if (!legacyRoutes.has(key)) err(`Legacy: η διαδρομή «${key}» δεν έχει canonical αντιστοίχιση`)
  const targets = new Set()
  for (const [from, to] of legacyRoutes) {
    const [p, q = ''] = to.split('?')
    const id = resolveLocation(p, q ? `?${q}` : '')
    if (id.kind === 'notFound' || id.kind === 'legacy') err(`Legacy: «${from}» → «${to}» δεν επιλύεται`)
    else if (id.legacyKey && id.legacyKey !== from) err(`Legacy: «${from}» → «${to}» επιστρέφει legacyKey «${id.legacyKey}»`)
    if (targets.has(to)) err(`Legacy: δύο διαδρομές καταλήγουν στο «${to}»`)
    targets.add(to)
  }
} catch (e) {
  err(`Legacy πίνακας: ${e.message}`)
}

// --- Αποτέλεσμα ---
for (const w of warnings) console.warn(`⚠ ${w}`)
if (errors.length) {
  console.error(`\n✗ Έλεγχος περιεχομένου: ${errors.length} σφάλμα(τα)\n`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(
  `✓ Περιεχόμενο έγκυρο: ${CATEGORIES.length} κατηγορίες · ${flashcards.length} κάρτες · ${quizQuestions.length} ερωτήσεις κουίζ · ` +
    `${allExam.length} ερωτήσεις ανάπτυξης · ${slideRefCount} αναφορές διαφανειών` +
    (warnings.length ? ` · ${warnings.length} προειδοποιήσεις` : ''),
)
console.log(
  `✓ Academic registry έγκυρο: ${registry.terms.length} terms · ${registry.courses.length} μαθήματα · ` +
    `${registry.enrollments.length} εγγραφές · ${contentIds.length} IDs περιεχομένου συμβατά ως ${CONTENT_COURSE}/<id>`,
)
console.log(`✓ Routing έγκυρο: ${topicMap.length} topics · ${legacyRoutes.size} legacy διαδρομές → canonical`)
