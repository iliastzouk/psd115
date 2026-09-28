/**
 * Εξαγωγή / εισαγωγή / αντίγραφα ασφαλείας της προόδου στην ΤΡΕΧΟΥΣΑ μορφή.
 * Τα δεδομένα αντιγράφονται αυτούσια (raw strings του localStorage), χωρίς καμία μετατροπή.
 */
import {
  BACKUP_KEY_PREFIX,
  EXPORT_FORMAT,
  EXPORT_VERSION,
  isProgressKey,
  validateEntries,
  validateExport,
} from './progressValidate.js'

const MAX_LOCAL_BACKUPS = 3

/** Όλα τα κλειδιά προόδου που υπάρχουν τώρα (γνωστά και άγνωστα με πρόθεμα psd115-). */
export function readProgressEntries() {
  const entries = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && isProgressKey(key)) entries[key] = localStorage.getItem(key)
  }
  return entries
}

export function buildExport(reason = 'export') {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    reason,
    source: typeof location !== 'undefined' ? location.host : '',
    keys: readProgressEntries(),
  }
}

function stamp(iso) {
  return iso.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportProgressToFile() {
  const data = buildExport('export')
  downloadJson(data, `psd115-progress-${stamp(data.exportedAt)}.json`)
  return data
}

/** Τρέχουσα κατάσταση της αποθηκευμένης προόδου (χωρίς αλλαγές). */
export function validateStoredProgress() {
  return validateEntries(readProgressEntries())
}

export function listLocalBackups() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(BACKUP_KEY_PREFIX)) keys.push(key)
  }
  return keys.sort()
}

/**
 * Αντίγραφο ασφαλείας πριν από import ή reset: κατεβαίνει ως αρχείο ΚΑΙ κρατιέται στο localStorage
 * (τα τελευταία 3). Αν το localStorage είναι γεμάτο, μένει μόνο το αρχείο.
 * @returns {{ data: object, storedLocally: boolean }}
 */
export function createSafetyBackup(reason) {
  const data = buildExport(reason)
  downloadJson(data, `psd115-backup-before-${reason}-${stamp(data.exportedAt)}.json`)
  let storedLocally = false
  try {
    localStorage.setItem(`${BACKUP_KEY_PREFIX}${data.exportedAt}`, JSON.stringify(data))
    storedLocally = true
    const all = listLocalBackups()
    for (const old of all.slice(0, Math.max(0, all.length - MAX_LOCAL_BACKUPS))) localStorage.removeItem(old)
  } catch {
    /* quota: το αρχείο που κατέβηκε αρκεί */
  }
  return { data, storedLocally }
}

/**
 * Διαβάζει και ελέγχει αρχείο χωρίς να γράψει τίποτα.
 * @param {File} file
 */
export async function readImportFile(file) {
  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    return { ok: false, errors: ['Το αρχείο δεν είναι έγκυρο JSON.'], warnings: [], stats: null, data: null }
  }
  return { ...validateExport(data), data }
}

/**
 * Γράφει τα κλειδιά του αρχείου. Δεν σβήνει κανένα κλειδί που δεν υπάρχει στο αρχείο.
 * Ο καλών πρέπει να έχει ήδη ελέγξει το αρχείο, πάρει επιβεβαίωση και φτιάξει backup,
 * και αμέσως μετά να κάνει reload ώστε η εφαρμογή να μη γράψει από πάνω την παλιά πρόοδο από τη μνήμη.
 */
export function applyImport(data) {
  const check = validateExport(data)
  if (!check.ok) throw new Error('Το αρχείο δεν πέρασε τον έλεγχο· δεν γράφτηκε τίποτα.')
  const previous = Object.keys(data.keys).map((key) => [key, localStorage.getItem(key)])
  try {
    for (const [key, value] of Object.entries(data.keys)) localStorage.setItem(key, value)
  } catch (err) {
    // Π.χ. γεμάτο localStorage στη μέση: επαναφορά ώστε να μη μείνει μισή εισαγωγή.
    for (const [key, value] of previous) {
      try {
        if (value === null) localStorage.removeItem(key)
        else localStorage.setItem(key, value)
      } catch {
        /* υπάρχει ήδη το αρχείο backup */
      }
    }
    throw err
  }
  return Object.keys(data.keys).length
}
