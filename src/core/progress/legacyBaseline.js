/**
 * Frozen legacy baseline (Phase 1E-2) — pure, χωρίς storage/browser APIs.
 *
 *   legacy snapshot (raw psd115-*) → buildLegacyBaseline() → { baseline, marker }  ·  μηδέν events
 *
 * Το baseline σημαίνει «αυτή ήταν η γνωστή κατάσταση του legacy συστήματος τη στιγμή του migration».
 * ΔΕΝ σημαίνει «ο χρήστης έκανε αυτά τα events τότε»: κανένα answer/flip/self δεν δημιουργείται, και το μόνο
 * timestamp που προέρχεται από το migration είναι το `capturedAt` / `marker.at`.
 *
 * Ό,τι βλέπει ο χρήστης (visibleProgress) = frozen baseline + πραγματικά events μετά το migration + mutable state.
 * Δεν γίνεται καμία «σιωπηλή επισκευή»: άκυρα ή άγνωστα δεδομένα → απόρριψη με συγκεκριμένο σφάλμα.
 */
import { CATEGORIES, flashcards, quizQuestions } from '../../../content/courses/psd115/questions.js'
import { topics } from '../../../content/courses/psd115/topics.js'
import { course } from '../../../content/courses/psd115/course.js'
import { parseGlobalId } from '../academic/ids.js'
import { sha256Hex } from './sha256.js'

export const LEGACY_BASELINE_KEY = 'legacy-baseline:psd115'
export const MIGRATION_MARKER_KEY = 'migration:psd115-v1'
/** Θα χρησιμοποιηθεί όταν ενεργοποιηθεί ο νέος reader/writer (όχι στο 1E-2). */
export const RESET_MARKER_KEY = 'progress-reset:psd115'
export const BASELINE_FORMAT = 'legacy-baseline'
export const BASELINE_VERSION = 1
export const MIGRATION_VERSION = 1
const COURSE_ID = 'psd115'

const STUDY_KEY = 'psd115-w1-study'
const SETTINGS_KEYS = new Set(['psd115-w1-theme', 'psd115-disclaimer-v1'])
const W1_CHECKLIST_RE = /^psd115-w1-([a-z0-9-]+)-checklist$/
const WEEK_CHECKLISTS_RE = /^psd115-w([2-9])-checklists$/
const STUDY_FIELDS = new Set(['quizAnswered', 'quizCorrect', 'byCategory', 'flashcardSeenIds', 'wrongBook'])
const WRONG_FIELDS = ['uid', 'id', 'categoryId', 'question', 'explanation', 'userLabel', 'correctLabel']

const categoryIds = new Set(CATEGORIES.map((c) => c.id))
const flashcardIds = new Set(flashcards.map((c) => c.id))
const questionById = new Map(quizQuestions.map((q) => [q.id, q]))
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isCount = (v) => Number.isSafeInteger(v) && v >= 0

/**
 * Source hash: SHA-256 του αυτούσιου legacy payload, με ταξινομημένα κλειδιά. Ανεξάρτητο από
 * σειρά κλειδιών, exportedAt ή runtime. Ίδιο payload → ίδιο hash.
 * @param {Record<string, string>} entries raw `psd115-*` (χωρίς backups)
 */
export function legacySourceHash(entries) {
  const canonical = JSON.stringify(
    Object.keys(entries)
      .sort()
      .map((key) => [key, entries[key]]),
  )
  return `sha256:${sha256Hex(canonical)}`
}

/** Legacy slug ενός checklist → canonical topicId, μέσω topics.js (μοναδική πηγή). */
function topicForChecklist(unitId, slug) {
  return topics.find((t) => t.unit === unitId && t.legacySlug === slug)?.id ?? null
}
const unitForWeek = (n) => course.units.find((u) => u.route === `/week/${n}`)?.id ?? null

function checkBoolArray(value, where, errors) {
  if (!Array.isArray(value) || value.some((x) => typeof x !== 'boolean')) {
    errors.push(`${where}: αναμενόταν πίνακας true/false`)
    return false
  }
  return true
}

function parse(raw, key, errors) {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch {
    errors.push(`${key}: μη έγκυρο JSON`)
    return { ok: false }
  }
}

function validateStudy(value, errors, warnings) {
  const where = STUDY_KEY
  if (!isObj(value)) return errors.push(`${where}: αναμενόταν αντικείμενο`)
  for (const k of Object.keys(value)) if (!STUDY_FIELDS.has(k)) errors.push(`${where}: άγνωστο πεδίο «${k}»`)
  const quizAnswered = value.quizAnswered ?? 0
  const quizCorrect = value.quizCorrect ?? 0
  if (!isCount(quizAnswered)) errors.push(`${where}.quizAnswered: αναμενόταν μη αρνητικός ακέραιος`)
  if (!isCount(quizCorrect)) errors.push(`${where}.quizCorrect: αναμενόταν μη αρνητικός ακέραιος`)
  if (isCount(quizAnswered) && isCount(quizCorrect) && quizCorrect > quizAnswered) {
    errors.push(`${where}: quizCorrect (${quizCorrect}) > quizAnswered (${quizAnswered})`)
  }

  const byCategory = value.byCategory ?? {}
  if (!isObj(byCategory)) errors.push(`${where}.byCategory: αναμενόταν αντικείμενο`)
  else {
    let sumAll = 0
    let sumCorrect = 0
    for (const [cat, s] of Object.entries(byCategory)) {
      if (!categoryIds.has(cat)) errors.push(`${where}.byCategory: άγνωστη κατηγορία «${cat}»`)
      if (!isObj(s) || Object.keys(s).some((k) => k !== 'correct' && k !== 'wrong') || !isCount(s.correct) || !isCount(s.wrong)) {
        errors.push(`${where}.byCategory.${cat}: αναμενόταν { correct, wrong } μη αρνητικοί ακέραιοι`)
      } else {
        sumAll += s.correct + s.wrong
        sumCorrect += s.correct
      }
    }
    // Ασυνέπεια αθροισμάτων: αναφέρεται, δεν «διορθώνεται» — διατηρούνται και τα δύο όπως είναι.
    if (sumAll !== quizAnswered || sumCorrect !== quizCorrect) {
      warnings.push(`${where}: τα αθροίσματα του byCategory (${sumCorrect}/${sumAll}) διαφέρουν από quizCorrect/quizAnswered (${quizCorrect}/${quizAnswered})`)
    }
  }

  const seen = value.flashcardSeenIds ?? []
  if (!Array.isArray(seen)) errors.push(`${where}.flashcardSeenIds: αναμενόταν πίνακας`)
  else {
    const dup = new Set()
    for (const id of seen) {
      if (typeof id !== 'string' || !flashcardIds.has(id)) errors.push(`${where}.flashcardSeenIds: άγνωστη κάρτα «${id}»`)
      else if (dup.has(id)) errors.push(`${where}.flashcardSeenIds: διπλή κάρτα «${id}»`)
      dup.add(id)
    }
  }

  const wrongBook = value.wrongBook ?? []
  if (!Array.isArray(wrongBook)) errors.push(`${where}.wrongBook: αναμενόταν πίνακας`)
  else {
    wrongBook.forEach((w, i) => {
      const at = `${where}.wrongBook[${i}]`
      if (!isObj(w)) return errors.push(`${at}: αναμενόταν αντικείμενο`)
      for (const k of Object.keys(w)) if (!WRONG_FIELDS.includes(k)) errors.push(`${at}: άγνωστο πεδίο «${k}»`)
      for (const k of WRONG_FIELDS) if (typeof w[k] !== 'string') errors.push(`${at}.${k}: αναμενόταν string`)
      if (typeof w.id === 'string' && !questionById.has(w.id)) errors.push(`${at}: άγνωστη ερώτηση «${w.id}»`)
      if (typeof w.categoryId === 'string' && !categoryIds.has(w.categoryId)) errors.push(`${at}: άγνωστη κατηγορία «${w.categoryId}»`)
    })
    if (wrongBook.length > 60) warnings.push(`${where}.wrongBook: ${wrongBook.length} εγγραφές (> 60)`)
  }
  return { quizAnswered, quizCorrect, byCategory, flashcardSeenIds: seen, wrongBook }
}

/**
 * Ελέγχει το legacy snapshot και φτιάχνει baseline + marker. Δεν γράφει τίποτα.
 * @param {Record<string, string>} entries raw `psd115-*` κλειδιά (όπως `export.keys` / localStorage, χωρίς backups)
 * @param {{ now: () => number }} opts
 * @returns {{ ok: true, baseline: object, marker: object, warnings: string[] } | { ok: false, errors: string[], warnings: string[] }}
 */
export function buildLegacyBaseline(entries, { now }) {
  const errors = []
  const warnings = []
  if (!isObj(entries)) return { ok: false, errors: ['το legacy snapshot πρέπει να είναι αντικείμενο κλειδί → raw string'], warnings }

  let study = { quizAnswered: 0, quizCorrect: 0, byCategory: {}, flashcardSeenIds: [], wrongBook: [] }
  const checklists = {}
  const addChecklist = (topicId, items, legacyKey, where) => {
    if (!topicId) return errors.push(`${where}: το legacy slug δεν αντιστοιχεί σε θέμα του topics.js`)
    if (checklists[topicId]) return errors.push(`${where}: δεύτερο checklist για το θέμα «${topicId}»`)
    if (checkBoolArray(items, where, errors)) checklists[topicId] = { items: [...items], legacyKey }
  }

  for (const key of Object.keys(entries).sort()) {
    const raw = entries[key]
    if (typeof raw !== 'string') {
      errors.push(`${key}: η τιμή πρέπει να είναι raw string`)
      continue
    }
    if (key.startsWith('psd115-backup-')) {
      errors.push(`${key}: τα αντίγραφα ασφαλείας δεν είναι πηγή migration`)
      continue
    }
    if (key === 'psd115-w1-theme') {
      if (raw !== 'light' && raw !== 'dark') errors.push(`${key}: αναμενόταν "light" ή "dark"`)
      continue
    }
    if (key === 'psd115-disclaimer-v1') {
      if (raw !== '1') errors.push(`${key}: αναμενόταν "1"`)
      continue
    }
    if (key === STUDY_KEY) {
      const p = parse(raw, key, errors)
      if (p.ok) study = validateStudy(p.value, errors, warnings)
      continue
    }
    let m = key.match(W1_CHECKLIST_RE)
    if (m) {
      const p = parse(raw, key, errors)
      if (p.ok) addChecklist(topicForChecklist('k1', m[1]), p.value, key, key)
      continue
    }
    m = key.match(WEEK_CHECKLISTS_RE)
    if (m) {
      const unitId = unitForWeek(Number(m[1]))
      if (!unitId) {
        errors.push(`${key}: άγνωστη εβδομάδα ${m[1]}`)
        continue
      }
      const p = parse(raw, key, errors)
      if (!p.ok) continue
      if (!isObj(p.value)) {
        errors.push(`${key}: αναμενόταν αντικείμενο slug → [true/false]`)
        continue
      }
      for (const [slug, items] of Object.entries(p.value)) addChecklist(topicForChecklist(unitId, slug), items, `${key}#${slug}`, `${key}.${slug}`)
      continue
    }
    errors.push(`${key}: άγνωστο κλειδί προόδου (δεν υπάρχει κανόνας migration)`)
  }
  if (errors.length) return { ok: false, errors, warnings }

  const raw = Object.fromEntries(Object.keys(entries).sort().map((key) => [key, entries[key]]))
  const sourceHash = legacySourceHash(raw)
  const capturedAt = new Date(now()).toISOString()
  const baseline = {
    format: BASELINE_FORMAT,
    version: BASELINE_VERSION,
    courseId: COURSE_ID,
    sourceHash,
    capturedAt,
    raw,
    progress: {
      quizAnswered: study.quizAnswered,
      quizCorrect: study.quizCorrect,
      byCategory: structuredClone(study.byCategory),
      flashcardSeenIds: [...study.flashcardSeenIds],
      wrongBook: structuredClone(study.wrongBook),
      checklists,
    },
  }
  const marker = { version: MIGRATION_VERSION, at: capturedAt, sourceHash, baselineKey: LEGACY_BASELINE_KEY, baselineVersion: BASELINE_VERSION }
  return { ok: true, baseline, marker, warnings }
}

/**
 * Ό,τι βλέπει ο χρήστης = frozen baseline + πραγματικά events + mutable state.
 * - κουίζ (answered/correct/byCategory): baseline + `answer` events με ctx 'quiz' (ίδιο εύρος με το legacy κουίζ)
 * - κάρτες: baseline ∪ items των `flip` events (ctx 'flash')
 * - wrongBook, checklists: από το mutable state αν δοθεί, αλλιώς από το baseline — ΠΟΤΕ από answer events
 * - reset ({ at }): αγνοεί το baseline και τα events πριν από το `at`
 * Κάθε event μετριέται μία φορά· το baseline δεν περιέχει κανένα event, άρα δεν υπάρχει διπλομέτρηση.
 * @param {{ baseline: object | null, events?: object[], state?: { wrongBook?: object[], checklists?: Record<string, { items: boolean[] }> }, reset?: { at: string } | null }} input
 */
export function visibleProgress({ baseline, events = [], state = {}, reset = null }) {
  const resetAt = reset?.at ? Date.parse(reset.at) : null
  const base = baseline && resetAt === null ? baseline.progress : null
  const out = {
    quizAnswered: base?.quizAnswered ?? 0,
    quizCorrect: base?.quizCorrect ?? 0,
    byCategory: structuredClone(base?.byCategory ?? {}),
    flashcardSeenIds: [...(base?.flashcardSeenIds ?? [])],
    wrongBook: structuredClone(state.wrongBook ?? base?.wrongBook ?? []),
    checklists: structuredClone({ ...(base?.checklists ?? {}), ...(state.checklists ?? {}) }),
  }
  const seen = new Set(out.flashcardSeenIds)
  for (const ev of events) {
    if (resetAt !== null && ev.t < resetAt) continue
    const id = parseGlobalId(ev.item)
    if (!id || id.courseId !== (baseline?.courseId ?? COURSE_ID)) continue
    if (ev.kind === 'answer' && ev.ctx === 'quiz') {
      out.quizAnswered += 1
      if (ev.ok === 1) out.quizCorrect += 1
      const cat = questionById.get(id.localId)?.categoryId
      if (cat) {
        const s = (out.byCategory[cat] ??= { correct: 0, wrong: 0 })
        if (ev.ok === 1) s.correct += 1
        else s.wrong += 1
      }
    } else if (ev.kind === 'flip' && ev.ctx === 'flash' && !seen.has(id.localId)) {
      seen.add(id.localId)
      out.flashcardSeenIds.push(id.localId)
    }
  }
  return out
}
