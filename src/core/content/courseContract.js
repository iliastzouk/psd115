/**
 * Συμβόλαιο περιεχομένου μαθήματος (Φάση 6d-α): ένα manifest ανά μάθημα, pure έλεγχος, κανένα μάθημα στον κώδικα.
 *
 *   {
 *     id:         courseId (ίδιο με το academic registry)
 *     terms?:     { unit, units, unitShort }  ορολογία του μαθήματος (προεπιλογή: «Ενότητα», Δ5)
 *     units:      [{ id, order, label, title, kind, legacy?: { route } }]
 *     topics:     [{ id, unit, legacySlug? }]  η σειρά του πίνακα είναι η σειρά πλοήγησης
 *     study:      { categories, unitCategories: { [unitId]: category[] }, flashcards, quizQuestions,
 *                   getCategoryLabel, examQuestions: { [unitId]: () => examQuestion[] } }
 *     docs:       [{ id, unit, kind, path }]  path σχετικό με το public/
 *     slides?:    { decks: { [unitId]: deckId }, byTopic: { [topicId]: number[] } }
 *     provenance: { origin: 'original', license: 'own', author }
 *               | { origin: 'licensed', source, license | permission, attribution }
 *               | { origin: 'legacy', reviewed: boolean }
 *   }
 *
 * Τα legacy πεδία (`legacy.route`, `legacySlug`) είναι προαιρετικά: μόνο για μαθήματα με παλιές διαδρομές.
 * Το περιεχόμενο των θεμάτων (κείμενα, ενότητες) προστίθεται στο συμβόλαιο στη Φάση 6d-β.
 */

export const MANIFEST_KEYS = Object.freeze(['id', 'terms', 'units', 'topics', 'study', 'docs', 'slides', 'provenance'])
const REQUIRED = ['id', 'units', 'topics', 'study', 'docs', 'provenance']
const UNIT_KEYS = ['id', 'order', 'label', 'title', 'kind', 'legacy']
const TOPIC_KEYS = ['id', 'unit', 'legacySlug']
const STUDY_KEYS = ['categories', 'unitCategories', 'flashcards', 'quizQuestions', 'getCategoryLabel', 'examQuestions']
const DOC_KEYS = ['id', 'unit', 'kind', 'path']
const TERM_KEYS = ['unit', 'units', 'unitShort']
const QUESTION_TYPES = new Set(['mcq', 'tf'])

export const DEFAULT_TERMS = Object.freeze({ unit: 'Ενότητα', units: 'Ενότητες', unitShort: 'Ενότ.' })

/** Ορολογία του μαθήματος, με τα κενά από την προεπιλογή. */
export const courseTerms = (manifest) => Object.freeze({ ...DEFAULT_TERMS, ...(manifest?.terms ?? {}) })

// Ίδιοι κανόνες με τα courseId / localId του ακαδημαϊκού καταλόγου (ids.js)· εδώ χωρίς import: το module μένει αυτόνομο.
const COURSE_ID_RE = /^[a-z][a-z0-9-]*$/
const LOCAL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isText = (v) => typeof v === 'string' && v.trim().length > 0
const list = (v) => (Array.isArray(v) ? v : [])

/** Ids καρτών και ερωτήσεων κουίζ (για το μητρώο IDs). */
export const manifestIds = (manifest) => ({
  cards: list(manifest?.study?.flashcards).map((x) => x?.id),
  questions: list(manifest?.study?.quizQuestions).map((x) => x?.id),
})

/**
 * @param {unknown} m  manifest μαθήματος
 * @returns {string[]} σφάλματα (κενό = έγκυρο)
 */
export function checkCourseContent(m) {
  if (!isObj(m)) return ['manifest: αναμενόταν αντικείμενο']
  const errors = []
  const err = (msg) => errors.push(msg)
  const unknownKeys = (obj, allowed, where) => {
    for (const k of Object.keys(obj)) if (!allowed.includes(k)) err(`${where}: άγνωστο πεδίο «${k}»`)
  }
  const texts = (obj, fields, where) => {
    for (const f of fields) if (!isText(obj?.[f])) err(`${where}: λείπει ή είναι κενό το «${f}»`)
  }

  unknownKeys(m, MANIFEST_KEYS, 'manifest')
  for (const k of REQUIRED) if (!(k in m)) err(`manifest: λείπει το «${k}»`)
  if (typeof m.id !== 'string' || !COURSE_ID_RE.test(m.id)) err(`manifest: άκυρο id μαθήματος ${JSON.stringify(m.id)}`)

  // --- Ορολογία ---
  if ('terms' in m) {
    if (!isObj(m.terms)) err('terms: αναμενόταν αντικείμενο')
    else {
      unknownKeys(m.terms, TERM_KEYS, 'terms')
      for (const k of TERM_KEYS) if (k in m.terms && !isText(m.terms[k])) err(`terms: κενό ή άκυρο «${k}»`)
    }
  }

  // --- Units ---
  const units = list(m.units)
  if (!units.length) err('units: χρειάζεται τουλάχιστον μία unit')
  const unitIds = new Set()
  const orders = new Set()
  const legacyRoutes = new Set()
  const legacyUnits = new Set()
  for (const u of units) {
    const w = `unit «${u?.id}»`
    if (!isObj(u)) {
      err('units: αναμενόταν αντικείμενο')
      continue
    }
    unknownKeys(u, UNIT_KEYS, w)
    if (typeof u.id !== 'string' || !SLUG_RE.test(u.id)) err(`${w}: άκυρο id`)
    else if (unitIds.has(u.id)) err(`units: διπλό unit id «${u.id}»`)
    unitIds.add(u.id)
    if (!Number.isInteger(u.order)) err(`${w}: το order πρέπει να είναι ακέραιος`)
    else if (orders.has(u.order)) err(`units: διπλό order ${u.order}`)
    orders.add(u.order)
    texts(u, ['label', 'title', 'kind'], w)
    if ('legacy' in u) {
      const r = u.legacy?.route
      if (!isObj(u.legacy) || Object.keys(u.legacy).join() !== 'route' || typeof r !== 'string' || !/^\/[^\s?#]*[^/\s?#]$/.test(r)) {
        err(`${w}: άκυρο legacy.route (αναμενόταν { route: '/…' } χωρίς τελικό '/')`)
      } else {
        if (legacyRoutes.has(r)) err(`units: διπλό legacy.route «${r}»`)
        legacyRoutes.add(r)
        legacyUnits.add(u.id)
      }
    }
  }

  // --- Θέματα ---
  const topics = list(m.topics)
  if (!Array.isArray(m.topics)) err('topics: αναμενόταν πίνακας')
  const topicIds = new Set()
  const topicUnit = new Map()
  const slugs = new Set()
  for (const t of topics) {
    const w = `topic «${t?.id}»`
    if (!isObj(t)) {
      err('topics: αναμενόταν αντικείμενο')
      continue
    }
    unknownKeys(t, TOPIC_KEYS, w)
    if (typeof t.id !== 'string' || !SLUG_RE.test(t.id)) err(`${w}: άκυρο id`)
    else if (topicIds.has(t.id)) err(`topics: διπλό topic id «${t.id}»`)
    topicIds.add(t.id)
    if (!unitIds.has(t.unit)) err(`${w}: άγνωστη unit «${t.unit}»`)
    else topicUnit.set(t.id, t.unit)
    if ('legacySlug' in t) {
      if (!isText(t.legacySlug)) err(`${w}: κενό legacySlug`)
      else if (unitIds.has(t.unit) && !legacyUnits.has(t.unit)) err(`${w}: legacySlug χωρίς legacy.route στην unit «${t.unit}»`)
      const key = `${t.unit}/${t.legacySlug}`
      if (slugs.has(key)) err(`${w}: το legacySlug «${t.legacySlug}» δύο φορές στην unit «${t.unit}»`)
      slugs.add(key)
    }
  }
  for (const id of unitIds) if (![...topicUnit.values()].includes(id)) err(`unit «${id}»: κανένα θέμα`)

  // --- Μελέτη ---
  const s = m.study
  if (!isObj(s)) err('study: αναμενόταν αντικείμενο')
  else checkStudy(s, unitIds, err, unknownKeys, texts)

  // --- Έγγραφα ---
  if (!Array.isArray(m.docs)) err('docs: αναμενόταν πίνακας')
  const docIds = new Set()
  for (const d of list(m.docs)) {
    const w = `έγγραφο «${d?.id}»`
    if (!isObj(d)) {
      err('docs: αναμενόταν αντικείμενο')
      continue
    }
    unknownKeys(d, DOC_KEYS, w)
    if (typeof d.id !== 'string' || !SLUG_RE.test(d.id)) err(`${w}: άκυρο id`)
    else if (docIds.has(d.id)) err(`docs: διπλό έγγραφο «${d.id}»`)
    docIds.add(d.id)
    if (!unitIds.has(d.unit)) err(`${w}: άγνωστη unit «${d.unit}»`)
    texts(d, ['kind'], w)
    if (typeof d.path !== 'string' || !/^[^/\s][^\s]*$/.test(d.path) || d.path.split('/').includes('..')) err(`${w}: άκυρο path (σχετικό με το public/, χωρίς «..»)`)
  }

  // --- Διαφάνειες (προαιρετικά) ---
  if ('slides' in m) {
    const sl = m.slides
    if (!isObj(sl) || !isObj(sl.decks) || !isObj(sl.byTopic)) err('slides: αναμενόταν { decks: {}, byTopic: {} }')
    else {
      unknownKeys(sl, ['decks', 'byTopic'], 'slides')
      for (const [u, deck] of Object.entries(sl.decks)) {
        if (!unitIds.has(u)) err(`slides.decks: άγνωστη unit «${u}»`)
        if (!isText(deck)) err(`slides.decks «${u}»: κενό deck`)
      }
      for (const [t, nums] of Object.entries(sl.byTopic)) {
        if (!topicIds.has(t)) {
          err(`slides.byTopic: άγνωστο θέμα «${t}»`)
          continue
        }
        if (!Array.isArray(nums) || !nums.length || !nums.every((n) => Number.isInteger(n) && n > 0)) {
          err(`slides.byTopic «${t}»: αναμενόταν μη κενός πίνακας θετικών ακεραίων`)
        }
        const u = topicUnit.get(t)
        if (u && !Object.hasOwn(sl.decks, u)) err(`slides.byTopic «${t}»: η unit «${u}» δεν έχει deck`)
      }
    }
  }

  // --- Provenance ---
  const p = m.provenance
  if (!isObj(p) || !['original', 'licensed', 'legacy'].includes(p.origin)) err('provenance: άκυρο origin (original | licensed | legacy)')
  else if (p.origin === 'original') {
    if (p.license !== 'own') err('provenance original: αναμενόταν license «own»')
    if (!isText(p.author)) err('provenance original: λείπει το «author»')
  } else if (p.origin === 'licensed') {
    if (!isText(p.source)) err('provenance licensed: λείπει το «source»')
    if (!isText(p.license) && !isText(p.permission)) err('provenance licensed: λείπει «license» ή «permission»')
    if (!isText(p.attribution)) err('provenance licensed: λείπει το «attribution»')
  } else if (typeof p.reviewed !== 'boolean') err('provenance legacy: αναμενόταν «reviewed» (true | false)')

  return errors
}

function checkStudy(s, unitIds, err, unknownKeys, texts) {
  unknownKeys(s, STUDY_KEYS, 'study')
  for (const k of STUDY_KEYS) if (!(k in s)) err(`study: λείπει το «${k}»`)

  // Κατηγορίες
  const categories = new Map()
  for (const c of list(s.categories)) {
    if (!isObj(c) || !isText(c.id) || !isText(c.label)) {
      err(`κατηγορία «${c?.id}»: αναμενόταν { id, label } με μη κενό label`)
      continue
    }
    if (categories.has(c.id)) err(`διπλή κατηγορία «${c.id}»`)
    categories.set(c.id, c.label)
  }
  const used = new Set()
  if (!isObj(s.unitCategories)) err('study.unitCategories: αναμενόταν αντικείμενο')
  else {
    for (const u of Object.keys(s.unitCategories)) if (!unitIds.has(u)) err(`unitCategories: άγνωστη unit «${u}»`)
    for (const u of unitIds) {
      if (!Object.hasOwn(s.unitCategories, u)) {
        err(`unitCategories: λείπει η unit «${u}»`)
        continue
      }
      for (const c of list(s.unitCategories[u])) {
        if (!categories.has(c?.id)) err(`unitCategories ${u}: άγνωστη κατηγορία «${c?.id}»`)
        else if (categories.get(c.id) !== c.label) err(`unitCategories ${u}: η κατηγορία «${c.id}» έχει άλλη ετικέτα`)
        used.add(c?.id)
      }
    }
  }
  for (const id of categories.keys()) if (!used.has(id)) err(`κατηγορία «${id}»: σε καμία unit`)
  if (typeof s.getCategoryLabel !== 'function') err('study.getCategoryLabel: αναμενόταν συνάρτηση')

  // Κάρτες και ερωτήσεις: ένα id μοναδικό και στους δύο τύπους (μητρώο IDs).
  const seen = new Map()
  const claim = (id, type, w) => {
    if (typeof id !== 'string' || !LOCAL_ID_RE.test(id)) return err(`${w}: άκυρο id`)
    if (seen.get(id) === type) err(`${type === 'κάρτα' ? 'κάρτες' : 'ερωτήσεις'}: διπλό id «${id}»`)
    else if (seen.has(id)) err(`το id «${id}» είναι και κάρτα και ερώτηση`)
    seen.set(id, type)
  }
  const category = (x, w) => {
    if (isText(x?.categoryId) && !categories.has(x.categoryId)) err(`${w}: άγνωστη κατηγορία «${x.categoryId}»`)
  }
  for (const f of list(s.flashcards)) {
    const w = `κάρτα «${f?.id}»`
    claim(f?.id, 'κάρτα', w)
    texts(f, ['categoryId', 'front', 'back'], w)
    category(f, w)
  }
  for (const q of list(s.quizQuestions)) {
    const w = `ερώτηση «${q?.id}»`
    claim(q?.id, 'ερώτηση', w)
    texts(q, ['categoryId', 'question', 'explanation'], w)
    category(q, w)
    if (!QUESTION_TYPES.has(q?.type)) err(`${w}: άκυρος τύπος «${q?.type}» (mcq | tf)`)
    const opts = q?.options
    if (!Array.isArray(opts) || opts.length < 2) err(`${w}: χρειάζονται τουλάχιστον 2 επιλογές`)
    else {
      if (opts.some((o) => !isText(o))) err(`${w}: κενή επιλογή`)
      if (new Set(opts).size !== opts.length) err(`${w}: διπλές επιλογές`)
      if (q.type === 'tf' && opts.length !== 2) err(`${w}: ερώτηση Σ/Λ με ${opts.length} επιλογές`)
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= opts.length) {
        err(`${w}: άκυρο correctIndex ${JSON.stringify(q.correctIndex)} για ${opts.length} επιλογές`)
      }
    }
  }

  // Ερωτήσεις ανάπτυξης ανά unit
  if (!isObj(s.examQuestions)) return err('study.examQuestions: αναμενόταν αντικείμενο')
  for (const u of Object.keys(s.examQuestions)) if (!unitIds.has(u)) err(`examQuestions: άγνωστη unit «${u}»`)
  const examIds = new Set()
  for (const u of unitIds) {
    if (!Object.hasOwn(s.examQuestions, u)) {
      err(`examQuestions: λείπει η unit «${u}»`)
      continue
    }
    const get = s.examQuestions[u]
    if (typeof get !== 'function') {
      err(`examQuestions «${u}»: αναμενόταν συνάρτηση`)
      continue
    }
    const qs = get()
    if (!Array.isArray(qs)) {
      err(`examQuestions «${u}»: αναμενόταν πίνακας`)
      continue
    }
    for (const q of qs) {
      const w = `ερώτηση ανάπτυξης «${q?.id}» (${u})`
      if (typeof q?.id !== 'string' || !LOCAL_ID_RE.test(q.id)) err(`${w}: άκυρο id`)
      else if (examIds.has(q.id)) err(`ερώτηση ανάπτυξης: διπλό id «${q.id}»`)
      examIds.add(q?.id)
      texts(q, ['question', 'idealAnswer'], w)
    }
  }
}
