/**
 * Εξαγωγή / εισαγωγή / αντίγραφα ασφαλείας / reset της προόδου.
 * Τα δεδομένα αντιγράφονται αυτούσια (raw strings του localStorage), χωρίς καμία μετατροπή.
 *
 * Export v2 (Phase 1E-1): legacy `psd115-*` + raw κλειδιά του νέου store (`study-progress-*`)
 * + πληροφοριακά migration metadata. Το v1 εξακολουθεί να γίνεται import.
 * Import και reset γράφουν μέσω progressTransaction (validate → snapshot → write → verify → rollback).
 *
 * Όλες οι συναρτήσεις δέχονται προαιρετικά `storage` (προεπιλογή: localStorage) για tests σε Node.
 * Καμία δεν γράφει `study-progress-*` εκτός αν το εισαγόμενο αρχείο περιέχει δεδομένα του νέου store.
 */
import { sameEvent } from '../core/progress/events.js'
import { EVENTS_KEY, STATE_KEY } from '../core/progress/progressStore.js'
import { runTransaction } from './progressTransaction.js'
import {
  BACKUP_KEY_PREFIX,
  EXPORT_FORMAT,
  EXPORT_VERSION,
  MIGRATION_MARKER_KEY,
  PROGRESS_STORE_KEYS,
  classifyKey,
  isProgressKey,
  validateEntries,
  validateExport,
  validateStoreEntries,
} from './progressValidate.js'

const MAX_LOCAL_BACKUPS = 3
const defaultStorage = () => globalThis.localStorage

function allKeys(storage) {
  const keys = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key !== null) keys.push(key)
  }
  return keys
}

/** Όλα τα κλειδιά προόδου που υπάρχουν τώρα (γνωστά και άγνωστα με πρόθεμα psd115-). */
export function readProgressEntries(storage = defaultStorage()) {
  const entries = {}
  for (const key of allKeys(storage)) if (isProgressKey(key)) entries[key] = storage.getItem(key)
  return entries
}

/** Raw κλειδιά του νέου store που υπάρχουν τώρα (χωρίς parse: και κατεστραμμένα δεδομένα αντιγράφονται). */
export function readStoreEntries(storage = defaultStorage()) {
  const entries = {}
  for (const key of PROGRESS_STORE_KEYS) {
    const value = storage.getItem(key)
    if (value !== null) entries[key] = value
  }
  return entries
}

/** Πληροφοριακό: το σημάδι migration από το state του νέου store (ή null). Δεν γράφεται ποτέ από εδώ. */
function readMigrationMetadata(storeEntries) {
  try {
    const state = storeEntries[STATE_KEY] ? JSON.parse(storeEntries[STATE_KEY]) : null
    const marker = state && typeof state === 'object' ? (state[MIGRATION_MARKER_KEY] ?? null) : null
    return { markerKey: MIGRATION_MARKER_KEY, marker }
  } catch {
    return { markerKey: MIGRATION_MARKER_KEY, marker: null, unreadable: true }
  }
}

export function buildExport(reason = 'export', storage = defaultStorage()) {
  const progressStore = readStoreEntries(storage)
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    reason,
    source: typeof location !== 'undefined' ? location.host : '',
    keys: readProgressEntries(storage),
    progressStore,
    migration: readMigrationMetadata(progressStore),
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

/** Τρέχουσα κατάσταση της αποθηκευμένης προόδου (χωρίς αλλαγές): legacy + νέο store. */
export function validateStoredProgress(storage = defaultStorage()) {
  const legacy = validateEntries(readProgressEntries(storage))
  const store = validateStoreEntries(readStoreEntries(storage))
  return { ...legacy, ok: legacy.ok && store.ok, errors: [...legacy.errors, ...store.errors], store: store.stats }
}

export function listLocalBackups(storage = defaultStorage()) {
  return allKeys(storage)
    .filter((key) => key.startsWith(BACKUP_KEY_PREFIX))
    .sort()
}

/**
 * Αντίγραφο ασφαλείας (export v2: legacy + νέο store) πριν από import ή reset: κατεβαίνει ως αρχείο
 * ΚΑΙ κρατιέται στο localStorage (τα τελευταία 3). Αν το localStorage είναι γεμάτο, μένει μόνο το αρχείο.
 * @returns {{ data: object, storedLocally: boolean }}
 */
export function createSafetyBackup(reason, { storage = defaultStorage(), download = downloadJson } = {}) {
  const data = buildExport(reason, storage)
  download(data, `psd115-backup-before-${reason}-${stamp(data.exportedAt)}.json`)
  let storedLocally = false
  try {
    storage.setItem(`${BACKUP_KEY_PREFIX}${data.exportedAt}`, JSON.stringify(data))
    storedLocally = true
    const all = listLocalBackups(storage)
    for (const old of all.slice(0, Math.max(0, all.length - MAX_LOCAL_BACKUPS))) storage.removeItem(old)
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
 * Συγχώνευση του νέου store με τους κανόνες του progressStore.importAll (χωρίς να γράψει):
 * νέα events στο τέλος, ίδια (ίδιο id + περιεχόμενο) παραλείπονται, ίδιο id με άλλο περιεχόμενο
 * → απόρριψη· τα κλειδιά state του αρχείου γράφονται, τα υπόλοιπα μένουν.
 * Αν τα ΤΡΕΧΟΝΤΑ δεδομένα του store είναι κατεστραμμένα, η εισαγωγή απορρίπτεται (δεν τα αντικαθιστά σιωπηλά).
 */
function planStoreImport(fileStore, storage) {
  const targets = {}
  const errors = []
  let added = 0
  let skipped = 0

  if (EVENTS_KEY in fileStore) {
    const incoming = JSON.parse(fileStore[EVENTS_KEY])
    const raw = storage.getItem(EVENTS_KEY)
    let current = []
    if (raw !== null) {
      try {
        current = JSON.parse(raw)
      } catch {
        current = null
      }
      if (!Array.isArray(current)) errors.push(`Τα τρέχοντα δεδομένα «${EVENTS_KEY}» είναι κατεστραμμένα`)
    }
    if (Array.isArray(current)) {
      const byId = new Map(current.map((e) => [e?.id, e]))
      const toAdd = []
      for (const ev of incoming) {
        const existing = byId.get(ev.id)
        if (!existing) toAdd.push(ev)
        else if (sameEvent(existing, ev)) skipped += 1
        else errors.push(`το event ${ev.id} υπάρχει ήδη με διαφορετικό περιεχόμενο`)
      }
      added = toAdd.length
      // Κανένα νέο event → καμία εγγραφή (ούτε δημιουργία κενού κλειδιού).
      if (toAdd.length) targets[EVENTS_KEY] = JSON.stringify([...current, ...toAdd])
    }
  }

  if (STATE_KEY in fileStore) {
    const incoming = JSON.parse(fileStore[STATE_KEY])
    const raw = storage.getItem(STATE_KEY)
    let current = {}
    if (raw !== null) {
      try {
        current = JSON.parse(raw)
      } catch {
        current = null
      }
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        errors.push(`Τα τρέχοντα δεδομένα «${STATE_KEY}» είναι κατεστραμμένα`)
        current = null
      }
    }
    if (current && Object.keys(incoming).length) targets[STATE_KEY] = JSON.stringify({ ...current, ...incoming })
  }
  return { targets, errors, added, skipped }
}

/**
 * Υπολογίζει ΟΛΕΣ τις εγγραφές ενός import χωρίς να γράψει τίποτα.
 * Legacy: γράφονται τα κλειδιά του αρχείου, κανένα άλλο δεν σβήνεται (όπως στο v1).
 * @returns {{ ok: boolean, errors: string[], targets: Record<string, string>, store: { added: number, skipped: number } }}
 */
export function planImport(data, storage = defaultStorage()) {
  const check = validateExport(data)
  if (!check.ok) return { ok: false, errors: check.errors, targets: {}, store: { added: 0, skipped: 0 } }
  const targets = { ...data.keys }
  let store = { targets: {}, errors: [], added: 0, skipped: 0 }
  if (data.version >= 2) store = planStoreImport(data.progressStore, storage)
  return {
    ok: store.errors.length === 0,
    errors: store.errors,
    targets: store.errors.length ? {} : { ...targets, ...store.targets },
    store: { added: store.added, skipped: store.skipped },
  }
}

/**
 * Εισαγωγή: validate (όλα) → plan → συναλλαγή (snapshot → write → verify → rollback).
 * Ο καλών πρέπει να έχει πάρει επιβεβαίωση και safety backup, και αμέσως μετά να κάνει reload ώστε
 * η εφαρμογή να μη γράψει από πάνω την παλιά πρόοδο από τη μνήμη.
 */
export function applyImport(data, storage = defaultStorage()) {
  const plan = planImport(data, storage)
  if (!plan.ok) throw new Error(`Το αρχείο δεν πέρασε τον έλεγχο· δεν γράφτηκε τίποτα. ${plan.errors.join('; ')}`)
  const { changed } = runTransaction(storage, { op: `import-v${data.version}`, targets: plan.targets })
  return { keys: Object.keys(plan.targets).length, changed: changed.length, store: plan.store }
}

/** Τα κλειδιά που σβήνει το reset της legacy προόδου (ίδια με το storage.resetProgress). Theme/disclaimer μένουν. */
export function legacyResetKeys(storage = defaultStorage()) {
  return Object.keys(readProgressEntries(storage)).filter((key) => {
    const kind = classifyKey(key)
    return kind === 'study' || kind === 'w1Checklist' || kind === 'weekChecklists'
  })
}

/**
 * Reset με προστασία: safety backup (v2: legacy + νέο store) και διαγραφή των legacy κλειδιών μέσω
 * συναλλαγής (επαληθευμένη, με rollback). Το νέο store ΔΕΝ αγγίζεται στο 1E-1.
 * Μετά ο καλών καθαρίζει τη μνήμη της εφαρμογής (useStudySession.resetAllStudyProgress).
 */
export function resetProgressSafely({ storage = defaultStorage(), download = downloadJson } = {}) {
  const backup = createSafetyBackup('reset', { storage, download })
  const targets = Object.fromEntries(legacyResetKeys(storage).map((key) => [key, null]))
  const { changed } = runTransaction(storage, { op: 'reset', targets })
  return { backup, removed: changed }
}
