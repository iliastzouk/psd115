/**
 * Έλεγχος εγκυρότητας της αποθηκευμένης προόδου (τρέχουσα μορφή localStorage).
 * Pure JS χωρίς browser APIs: χρησιμοποιείται από την εφαρμογή (πριν από import) και από
 * `scripts/validate-progress-export.mjs` (πάνω σε αρχείο export).
 * Δεν διορθώνει και δεν ξαναγράφει δεδομένα — μόνο αναφέρει.
 */

export const STORAGE_PREFIX = 'psd115-'
/** Αντίγραφα ασφαλείας μέσα στο localStorage· δεν είναι πρόοδος και δεν εξάγονται. */
export const BACKUP_KEY_PREFIX = 'psd115-backup-'

export const EXPORT_FORMAT = 'psd115-progress-export'
export const EXPORT_VERSION = 1

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
 * Ελέγχει ένα αρχείο export (ήδη parsed JSON).
 * @param {unknown} data
 */
export function validateExport(data) {
  if (!isObj(data)) return fail('Το αρχείο δεν είναι αντικείμενο JSON.')
  if (data.format !== EXPORT_FORMAT) return fail(`Άγνωστη μορφή αρχείου (format: ${JSON.stringify(data.format)}).`)
  if (!Number.isInteger(data.version) || data.version < 1) return fail('Λείπει ή είναι άκυρη η έκδοση (version).')
  if (data.version > EXPORT_VERSION) {
    return fail(`Το αρχείο είναι νεότερης έκδοσης (${data.version}) από αυτή που υποστηρίζει η εφαρμογή (${EXPORT_VERSION}).`)
  }
  if (!isObj(data.keys)) return fail('Λείπει το πεδίο «keys».')
  if (Object.keys(data.keys).length === 0) return fail('Το αρχείο δεν περιέχει κανένα κλειδί προόδου.')
  const backupKeys = Object.keys(data.keys).filter((k) => k.startsWith(BACKUP_KEY_PREFIX))
  if (backupKeys.length) return fail(`Το αρχείο περιέχει κλειδιά αντιγράφων ασφαλείας: ${backupKeys.join(', ')}`)
  return validateEntries(data.keys)
}

function fail(message) {
  return { ok: false, errors: [message], warnings: [], unknownKeys: [], stats: null }
}
