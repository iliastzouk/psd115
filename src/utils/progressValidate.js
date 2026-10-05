/**
 * Έλεγχος εγκυρότητας της αποθηκευμένης προόδου (τρέχουσα μορφή localStorage).
 * Pure JS χωρίς browser APIs: χρησιμοποιείται από την εφαρμογή (πριν από import) και από
 * `scripts/validate-progress-export.mjs` (πάνω σε αρχείο export).
 * Δεν διορθώνει και δεν ξαναγράφει δεδομένα — μόνο αναφέρει.
 *
 * Export v1: μόνο τα `psd115-*` (legacy). Export v2 (Phase 1E-1): και τα raw κλειδιά του νέου
 * progress store (`study-progress-*`) + πληροφοριακά migration metadata. Το v1 γίνεται πάντα δεκτό.
 */
import { validateEvent } from '../core/progress/events.js'
import { EVENTS_KEY, STATE_KEY } from '../core/progress/progressStore.js'
import { boundaryViolations, migrationBoundary } from '../core/progress/boundary.js'

export const STORAGE_PREFIX = 'psd115-'
/** Αντίγραφα ασφαλείας μέσα στο localStorage· δεν είναι πρόοδος και δεν εξάγονται. */
export const BACKUP_KEY_PREFIX = 'psd115-backup-'

export const EXPORT_FORMAT = 'psd115-progress-export'
export const EXPORT_VERSION = 2
/** Εκδόσεις export που διαβάζει η εφαρμογή. */
export const SUPPORTED_EXPORT_VERSIONS = Object.freeze([1, 2])
/** Κλειδιά του νέου store που ταξιδεύουν στο export v2 (raw, όπως είναι στο localStorage). */
export const PROGRESS_STORE_KEYS = Object.freeze([EVENTS_KEY, STATE_KEY])
/** Κλειδί state του νέου store με το σημάδι του migration (ορίζεται στο legacyBaseline· εδώ μόνο διαβάζεται). */
export { MIGRATION_MARKER_KEY } from '../core/progress/keys.js'

const STUDY_KEY = 'psd115-w1-study'
const THEME_KEY = 'psd115-w1-theme'
const DISCLAIMER_KEY = 'psd115-disclaimer-v1'
const W1_CHECKLIST_RE = /^psd115-w1-[a-z0-9-]+-checklist$/
const WEEK_CHECKLISTS_RE = /^psd115-w[2-9]-checklists$/

/** @returns {'study' | 'theme' | 'disclaimer' | 'w1Checklist' | 'weekChecklists' | null} */
export function classifyKey(key) {
  if (key === STUDY_KEY) return 'study'
  if (key === THEME_KEY) return 'theme'
  if (key === DISCLAIMER_KEY) return 'disclaimer'
  if (W1_CHECKLIST_RE.test(key)) return 'w1Checklist'
  if (WEEK_CHECKLISTS_RE.test(key)) return 'weekChecklists'
  return null
}

export function isProgressKey(key) {
  return key.startsWith(STORAGE_PREFIX) && !key.startsWith(BACKUP_KEY_PREFIX)
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isCount = (v) => Number.isInteger(v) && v >= 0

function parseJson(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch {
    return { ok: false }
  }
}

function checkBoolArray(arr, where, errors) {
  if (!Array.isArray(arr)) {
    errors.push(`${where}: αναμενόταν πίνακας true/false`)
    return 0
  }
  if (arr.some((x) => typeof x !== 'boolean')) errors.push(`${where}: περιέχει τιμές που δεν είναι true/false`)
  return arr.filter((x) => x === true).length
}

function validateStudy(value, key, errors, warnings, stats) {
  if (!isObj(value)) {
    errors.push(`${key}: αναμενόταν αντικείμενο`)
    return
  }
  const required = ['quizAnswered', 'quizCorrect', 'byCategory', 'flashcardSeenIds', 'wrongBook']
  for (const f of required) {
    // Η εφαρμογή συμπληρώνει τα πεδία που λείπουν με προεπιλογές, οπότε αυτό είναι προειδοποίηση.
    if (!(f in value)) warnings.push(`${key}: λείπει το πεδίο «${f}» (η εφαρμογή θα χρησιμοποιήσει προεπιλογή)`)
  }
  for (const f of ['quizAnswered', 'quizCorrect']) {
    if (f in value && !isCount(value[f])) errors.push(`${key}.${f}: αναμενόταν μη αρνητικός ακέραιος`)
  }
  if (isCount(value.quizAnswered) && isCount(value.quizCorrect) && value.quizCorrect > value.quizAnswered) {
    warnings.push(`${key}: quizCorrect (${value.quizCorrect}) > quizAnswered (${value.quizAnswered})`)
  }
  if ('byCategory' in value) {
    if (!isObj(value.byCategory)) errors.push(`${key}.byCategory: αναμενόταν αντικείμενο`)
    else {
      for (const [cat, s] of Object.entries(value.byCategory)) {
        if (!isObj(s) || !isCount(s.correct) || !isCount(s.wrong)) {
          errors.push(`${key}.byCategory.${cat}: αναμενόταν { correct, wrong } με μη αρνητικούς ακέραιους`)
        }
      }
    }
  }
  if ('flashcardSeenIds' in value) {
    if (!Array.isArray(value.flashcardSeenIds) || value.flashcardSeenIds.some((x) => typeof x !== 'string')) {
      errors.push(`${key}.flashcardSeenIds: αναμενόταν πίνακας από strings`)
    }
  }
  if ('wrongBook' in value) {
    if (!Array.isArray(value.wrongBook)) errors.push(`${key}.wrongBook: αναμενόταν πίνακας`)
    else {
      value.wrongBook.forEach((w, i) => {
        if (!isObj(w)) errors.push(`${key}.wrongBook[${i}]: αναμενόταν αντικείμενο`)
        else if (typeof w.id !== 'string' || typeof w.question !== 'string') {
          errors.push(`${key}.wrongBook[${i}]: λείπει id ή question`)
        }
      })
    }
  }
  stats.quizAnswered = isCount(value.quizAnswered) ? value.quizAnswered : 0
  stats.quizCorrect = isCount(value.quizCorrect) ? value.quizCorrect : 0
  stats.flashcardsSeen = Array.isArray(value.flashcardSeenIds) ? value.flashcardSeenIds.length : 0
  stats.wrongAnswers = Array.isArray(value.wrongBook) ? value.wrongBook.length : 0
}

/**
 * Ελέγχει ζεύγη κλειδί → raw string (όπως αποθηκεύονται στο localStorage).
 * @param {Record<string, string>} entries
 */
export function validateEntries(entries) {
  const errors = []
  const warnings = []
  const unknownKeys = []
  const stats = {
    keys: 0,
    bytes: 0,
    quizAnswered: 0,
    quizCorrect: 0,
    flashcardsSeen: 0,
    wrongAnswers: 0,
    checklistItemsChecked: 0,
  }

  for (const [key, raw] of Object.entries(entries)) {
    stats.keys += 1
    if (typeof raw !== 'string') {
      errors.push(`${key}: η τιμή πρέπει να είναι string (όπως στο localStorage)`)
      continue
    }
    stats.bytes += key.length + raw.length
    if (!key.startsWith(STORAGE_PREFIX)) {
      errors.push(`${key}: κλειδί εκτός του προθέματος «${STORAGE_PREFIX}»`)
      continue
    }
    const kind = classifyKey(key)
    if (kind === null) {
      // Άγνωστο αλλά με σωστό πρόθεμα: κρατιέται όπως είναι, απλώς αναφέρεται.
      unknownKeys.push(key)
      continue
    }
    if (kind === 'theme') {
      if (raw !== 'dark' && raw !== 'light') errors.push(`${key}: αναμενόταν "dark" ή "light"`)
      continue
    }
    if (kind === 'disclaimer') {
      if (raw !== '1') warnings.push(`${key}: απρόσμενη τιμή "${raw.slice(0, 20)}"`)
      continue
    }
    const parsed = parseJson(raw)
    if (!parsed.ok) {
      errors.push(`${key}: μη έγκυρο JSON`)
      continue
    }
    if (kind === 'study') validateStudy(parsed.value, key, errors, warnings, stats)
    else if (kind === 'w1Checklist') stats.checklistItemsChecked += checkBoolArray(parsed.value, key, errors)
    else if (kind === 'weekChecklists') {
      if (!isObj(parsed.value)) errors.push(`${key}: αναμενόταν αντικείμενο slug → [true/false]`)
      else {
        for (const [slug, arr] of Object.entries(parsed.value)) {
          stats.checklistItemsChecked += checkBoolArray(arr, `${key}.${slug}`, errors)
        }
      }
    }
  }

  if (unknownKeys.length) warnings.push(`Άγνωστα κλειδιά (διατηρούνται ως έχουν): ${unknownKeys.join(', ')}`)
  return { ok: errors.length === 0, errors, warnings, unknownKeys, stats }
}

/**
 * Ελέγχει τα raw κλειδιά του νέου store (όπως στο export v2 ή στο localStorage).
 * @param {Record<string, string>} raw
 */
export function validateStoreEntries(raw) {
  const errors = []
  const stats = { events: 0, stateKeys: 0 }
  for (const [key, value] of Object.entries(raw)) {
    if (!PROGRESS_STORE_KEYS.includes(key)) {
      errors.push(`${key}: άγνωστο κλειδί του νέου store`)
      continue
    }
    if (typeof value !== 'string') {
      errors.push(`${key}: η τιμή πρέπει να είναι string (όπως στο localStorage)`)
      continue
    }
    const parsed = parseJson(value)
    if (!parsed.ok) {
      errors.push(`${key}: μη έγκυρο JSON`)
      continue
    }
    if (key === EVENTS_KEY) {
      if (!Array.isArray(parsed.value)) {
        errors.push(`${key}: αναμενόταν πίνακας events`)
        continue
      }
      const ids = new Set()
      parsed.value.forEach((ev, i) => {
        const r = validateEvent(ev)
        if (!r.ok) errors.push(`${key}[${i}]: ${r.errors.join(', ')}`)
        else if (ids.has(ev.id)) errors.push(`${key}[${i}]: διπλό id ${ev.id}`)
        ids.add(ev?.id)
      })
      stats.events = parsed.value.length
    } else {
      if (!isObj(parsed.value)) errors.push(`${key}: αναμενόταν αντικείμενο state`)
      else stats.stateKeys = Object.keys(parsed.value).length
    }
  }
  // Όριο migration μέσα στο ίδιο σύνολο: events πριν από το σημάδι του state απορρίπτονται.
  if (!errors.length && raw[EVENTS_KEY] !== undefined && raw[STATE_KEY] !== undefined) {
    try {
      const boundary = migrationBoundary(JSON.parse(raw[STATE_KEY]))
      errors.push(...boundaryViolations(JSON.parse(raw[EVENTS_KEY]), boundary))
    } catch (e) {
      errors.push(`${STATE_KEY}: ${e.message}`)
    }
  }
  return { ok: errors.length === 0, errors, stats }
}

/**
 * Ελέγχει ένα αρχείο export (ήδη parsed JSON), v1 ή v2.
 * @param {unknown} data
 */
export function validateExport(data) {
  if (!isObj(data)) return fail('Το αρχείο δεν είναι αντικείμενο JSON.')
  if (data.format !== EXPORT_FORMAT) return fail(`Άγνωστη μορφή αρχείου (format: ${JSON.stringify(data.format)}).`)
  if (!Number.isInteger(data.version) || data.version < 1) return fail('Λείπει ή είναι άκυρη η έκδοση (version).')
  if (!SUPPORTED_EXPORT_VERSIONS.includes(data.version)) {
    return fail(`Το αρχείο είναι νεότερης έκδοσης (${data.version}) από αυτή που υποστηρίζει η εφαρμογή (${EXPORT_VERSION}).`)
  }
  if (!isObj(data.keys)) return fail('Λείπει το πεδίο «keys».')
  const backupKeys = Object.keys(data.keys).filter((k) => k.startsWith(BACKUP_KEY_PREFIX))
  if (backupKeys.length) return fail(`Το αρχείο περιέχει κλειδιά αντιγράφων ασφαλείας: ${backupKeys.join(', ')}`)

  let store = { ok: true, errors: [], stats: { events: 0, stateKeys: 0 } }
  if (data.version >= 2) {
    if (!isObj(data.progressStore)) return fail('Λείπει το πεδίο «progressStore» (export v2).')
    if (data.migration !== undefined && data.migration !== null && !isObj(data.migration)) {
      return fail('Το πεδίο «migration» πρέπει να είναι αντικείμενο ή null.')
    }
    store = validateStoreEntries(data.progressStore)
  }
  const storeKeyCount = data.version >= 2 ? Object.keys(data.progressStore).length : 0
  if (Object.keys(data.keys).length === 0 && storeKeyCount === 0) return fail('Το αρχείο δεν περιέχει κανένα κλειδί προόδου.')

  const legacy = validateEntries(data.keys)
  const errors = [...legacy.errors, ...store.errors]
  return {
    ok: errors.length === 0,
    errors,
    warnings: legacy.warnings,
    unknownKeys: legacy.unknownKeys,
    stats: { ...legacy.stats, version: data.version, events: store.stats.events, stateKeys: store.stats.stateKeys },
  }
}

function fail(message) {
  return { ok: false, errors: [message], warnings: [], unknownKeys: [], stats: null }
}
