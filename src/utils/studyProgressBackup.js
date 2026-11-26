/**
 * Backup, export, import και reset της προόδου στη νέα μορφή (Φάση 6a). Κανένα legacy κλειδί δεν διαβάζεται ή γράφεται.
 *
 * Κατάσταση του store (ίδια ταξινόμηση με τον ProgressService):
 *   pending  σημάδι συναλλαγής (εκκρεμές ή κατεστραμμένο) ή αδύνατος έλεγχος → ΚΑΜΙΑ αλλαγή· μόνο raw export
 *   corrupt  άκυρο JSON / schema → μόνο πλήρης αντικατάσταση από αρχείο (μετά από raw safety backup) ή raw export
 *   ok       export, import (συγχώνευση με προεπισκόπηση), reset ανά μάθημα
 *
 * Safety backup (πριν από κάθε reset / import / αντικατάσταση): οι raw τιμές αυτούσιες (μαζί με όποιο κατεστραμμένο
 * namespace), ως αρχείο ΚΑΙ ως τοπικό αντίγραφο `study-progress-backup-<ISO>` (τα τελευταία 3). Επιτυχές ΜΟΝΟ όταν το
 * τοπικό αντίγραφο ξαναδιαβαστεί byte-identical· αλλιώς η πρόοδος δεν αλλάζει (ποιο σφάλμα και τι μένει ανά σημείο
 * αποτυχίας: createSafetyBackup).
 *
 * Import (J6): planImport → (προεπισκόπηση, επιβεβαίωση) → applyImport. Το plan κρατά αποτύπωμα SHA-256 των raw τιμών και
 * του αρχείου· το applyImport, στο ίδιο σύγχρονο βήμα πριν από κάθε εγγραφή, ελέγχει ξανά σημάδι και αποτυπώματα. Αλλαγή →
 * StaleImportError, καμία εγγραφή, νέα προεπισκόπηση.
 */
import { createStoreCore, EVENTS_KEY, STATE_KEY } from '../core/progress/progressStore.js'
import { runTransaction, TXN_KEY } from '../core/progress/transaction.js'
import { sha256Hex } from '../core/progress/sha256.js'
import { courseNamespaces, courseProgress, parseStoreData, resetTime, CHECKLISTS_VERSION, WRONG_BOOK_VERSION } from '../core/progress/courseProgress.js'
import { checklistsStateKey, resetStateKey, wrongBookStateKey } from '../core/progress/namespaces.js'
import { canonicalJson, ImportRejected, planMerge } from '../core/progress/importMerge.js'

export const BACKUP_KEY_PREFIX = 'study-progress-backup-'
export const MAX_LOCAL_BACKUPS = 3
export const RAW_EXPORT_FORMAT = 'study-progress-raw'
export { ImportRejected }

const defaultStorage = () => globalThis.localStorage

export class PendingTransactionError extends Error {
  /** @param {'pending' | 'unverifiable'} reason */
  constructor(reason) {
    super(reason === 'pending' ? 'Εκκρεμεί ανάκτηση προηγούμενης αλλαγής· δεν άλλαξε τίποτα' : 'Δεν ήταν δυνατός ο έλεγχος για μη ολοκληρωμένη αλλαγή· δεν άλλαξε τίποτα')
    this.name = 'PendingTransactionError'
    this.reason = reason
  }
}
export class BackupError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BackupError'
  }
}
/** Η τοπική πρόοδος ή το αρχείο άλλαξαν μετά την προεπισκόπηση· η επιβεβαίωση ακυρώθηκε, δεν γράφτηκε τίποτα. */
export class StaleImportError extends Error {
  constructor() {
    super('Η τοπική πρόοδος άλλαξε μετά την προεπισκόπηση· έλεγξε ξανά')
    this.name = 'StaleImportError'
  }
}
/** Η ενέργεια δεν επιτρέπεται στην τρέχουσα κατάσταση του store (π.χ. reset όταν η πρόοδος δεν διαβάζεται). */
export class ProgressActionError extends Error {
  /** @param {string} message @param {'corrupt' | 'unsupported'} reason */
  constructor(message, reason) {
    super(message)
    this.name = 'ProgressActionError'
    this.reason = reason
  }
}

function assertNoPendingTransaction(storage) {
  let marker
  try {
    marker = storage.getItem(TXN_KEY)
  } catch {
    throw new PendingTransactionError('unverifiable')
  }
  if (marker !== null) throw new PendingTransactionError('pending')
}

/**
 * @returns {{ status: 'pending' } | { status: 'corrupt', raw, issues: string[] } | { status: 'ok', raw, data: { events, state }, parsed }}
 */
export function storeStatus(storage = defaultStorage()) {
  try {
    if (storage.getItem(TXN_KEY) !== null) return { status: 'pending' }
  } catch {
    return { status: 'pending' }
  }
  const core = createStoreCore(storage)
  const raw = core.readRaw()
  let data
  try {
    data = core.parseRaw(raw)
  } catch (e) {
    return { status: 'corrupt', raw, issues: [e.message] }
  }
  const parsed = parseStoreData(data)
  if (!parsed.ok) return { status: 'corrupt', raw, issues: parsed.issues }
  return { status: 'ok', raw, data, parsed }
}

const stamp = (iso) => iso.replace(/[:.]/g, '-')
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Export της νέας μορφής (`study-progress`). Το store πρέπει να διαβάζεται. */
export function buildStoreExport({ storage = defaultStorage(), now = () => Date.now() } = {}) {
  return createStoreCore(storage, { now }).exportSync()
}

/** Raw export: οι τιμές αυτούσιες (και το σημάδι συναλλαγής). Μόνο ανάγνωση· δουλεύει σε κάθε κατάσταση. */
export function buildRawExport({ storage = defaultStorage(), now = () => Date.now(), reason = 'export' } = {}) {
  const get = (k) => {
    try {
      return storage.getItem(k)
    } catch {
      return null
    }
  }
  return { format: RAW_EXPORT_FORMAT, version: 1, reason, exportedAt: new Date(now()).toISOString(), keys: { [EVENTS_KEY]: get(EVENTS_KEY), [STATE_KEY]: get(STATE_KEY), [TXN_KEY]: get(TXN_KEY) } }
}

/** Λήψη αρχείου: η νέα μορφή όταν το store διαβάζεται, αλλιώς raw (τίποτα δεν χάνεται). */
export function exportProgressToFile({ storage = defaultStorage(), download = downloadJson, now = () => Date.now() } = {}) {
  const st = storeStatus(storage)
  const data = st.status === 'ok' ? buildStoreExport({ storage, now }) : buildRawExport({ storage, now })
  download(data, `study-progress-${st.status === 'ok' ? '' : 'raw-'}${stamp(data.exportedAt)}.json`)
  return data
}

export function listLocalBackups(storage = defaultStorage()) {
  const out = []
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k?.startsWith(BACKUP_KEY_PREFIX)) out.push(k)
  }
  return out.sort()
}

/**
 * Raw safety backup (τοπικό αντίγραφο, επαληθευμένο, + αρχείο). Σειρά: έλεγχος σύγκρουσης ονόματος (getItem) → εγγραφή
 * → επαλήθευση (getItem, byte-identical) → λήψη → κλάδεμα στα MAX_LOCAL_BACKUPS νεότερα. Ο καλών (reset / import)
 * αλλάζει την πρόοδο ΜΟΝΟ αν αυτή η συνάρτηση επιστρέψει· σε κάθε σφάλμα η πρόοδος μένει ως έχει.
 *
 * Αποτυχίες:
 *  - εγγραφή ή επαλήθευση → BackupError. Το νέο κλειδί σβήνεται best-effort: αν αποτύχει και η διαγραφή, μπορεί να
 *    μείνει (ανεπαλήθευτο). Τα παλιά backups δεν αγγίζονται.
 *  - λήψη (download) → διαδίδεται το ΑΡΧΙΚΟ σφάλμα (όχι BackupError). Το νέο, επαληθευμένο backup μένει αποθηκευμένο·
 *    τα παλιά δεν έχουν ακόμη κλαδευτεί.
 *  - έλεγχος σύγκρουσης ονόματος (getItem πετάει) → διαδίδεται το ΑΡΧΙΚΟ σφάλμα· δεν γράφεται τίποτα.
 *  - κλάδεμα → κανένα σφάλμα: best-effort που σταματά στην πρώτη αποτυχημένη διαγραφή. Όσες διαγραφές έγιναν μένουν,
 *    οι επόμενες δεν επιχειρούνται, το νέο backup δεν ακυρώνεται (τα τοπικά backups μπορεί να υπερβούν το όριο).
 * @returns {{ data: object, key: string }}
 */
export function createSafetyBackup(reason, { storage = defaultStorage(), download = downloadJson, now = () => Date.now() } = {}) {
  const data = buildRawExport({ storage, now, reason })
  const serialized = JSON.stringify(data)
  let key = `${BACKUP_KEY_PREFIX}${data.exportedAt}`
  for (let n = 1; storage.getItem(key) !== null; n++) key = `${BACKUP_KEY_PREFIX}${data.exportedAt}-${String(n).padStart(3, '0')}`
  const discard = () => {
    try {
      storage.removeItem(key)
    } catch {
      /* best effort */
    }
  }
  try {
    storage.setItem(key, serialized)
  } catch (e) {
    discard()
    throw new BackupError(`Το αντίγραφο ασφαλείας δεν αποθηκεύτηκε (${e?.name ?? 'error'})· δεν άλλαξε τίποτα`)
  }
  let readBack = null
  try {
    readBack = storage.getItem(key)
  } catch {
    readBack = null
  }
  if (readBack !== serialized) {
    discard()
    throw new BackupError('Το αντίγραφο ασφαλείας δεν επαληθεύτηκε· δεν άλλαξε τίποτα')
  }
  download(data, `study-progress-backup-before-${reason}-${stamp(data.exportedAt)}.json`)
  try {
    const all = listLocalBackups(storage)
    for (const old of all.slice(0, Math.max(0, all.length - MAX_LOCAL_BACKUPS))) storage.removeItem(old)
  } catch {
    /* η απομάκρυνση παλιών αντιγράφων δεν επηρεάζει το νέο */
  }
  return { data, key }
}

/** Μπορεί να γίνει reset του μαθήματος; (για το κείμενο του διαλόγου) */
export function describeCourseReset(courseId, { storage = defaultStorage(), adapters } = {}) {
  if (!Object.hasOwn(adapters ?? {}, courseId)) return { allowed: false, reason: 'unsupported' }
  const st = storeStatus(storage)
  if (st.status !== 'ok') return { allowed: false, reason: st.status }
  const r = courseProgress({ courseId, content: adapters[courseId], events: st.parsed.byCourse.get(courseId) ?? [], state: st.data.state })
  return { allowed: true, unavailable: r.status !== 'ready' }
}

/**
 * Reset ΕΝΟΣ μαθήματος (J5): επαληθευμένο raw backup → state { reset: { at }, wrongBook κενό, checklists κενά }.
 * at = max(now, H_c + 1, previousReset + 1)· τα events ΔΕΝ σβήνονται. Και σε μάθημα unavailable (το κατεστραμμένο
 * namespace εξαιρείται από το H_c και αντικαθίσταται)· ΟΧΙ σε σημάδι συναλλαγής ή όταν το store δεν διαβάζεται.
 */
export function resetCourseSafely({ courseId, adapters, storage = defaultStorage(), download = downloadJson, now = () => Date.now() }) {
  if (!Object.hasOwn(adapters ?? {}, courseId)) throw new ProgressActionError(`Το μάθημα «${courseId}» δεν έχει πρόοδο`, 'unsupported')
  assertNoPendingTransaction(storage)
  const st = storeStatus(storage)
  if (st.status === 'pending') throw new PendingTransactionError('pending')
  if (st.status === 'corrupt') throw new ProgressActionError('Η πρόοδος δεν διαβάζεται με ασφάλεια· το reset δεν επιτρέπεται', 'corrupt')
  const ns = courseNamespaces(courseId, st.data.state)
  let high = ns.high
  for (const ev of st.parsed.byCourse.get(courseId) ?? []) high = Math.max(high, ev.t)
  const at = resetTime({ now: now(), high, previousReset: ns.resetAt })
  const backup = createSafetyBackup('reset', { storage, download, now })
  createStoreCore(storage, { now }).commitSync({
    state: {
      [resetStateKey(courseId)]: { at: new Date(at).toISOString(), reason: 'reset' },
      [wrongBookStateKey(courseId)]: { version: WRONG_BOOK_VERSION, entries: [] },
      [checklistsStateKey(courseId)]: { version: CHECKLISTS_VERSION, topics: {} },
    },
  })
  return { backup, at }
}

/** Διαβάζει αρχείο χωρίς να γράψει τίποτα. */
export async function readImportFile(file) {
  try {
    return { ok: true, data: JSON.parse(await file.text()) }
  } catch {
    return { ok: false, errors: ['Το αρχείο δεν είναι έγκυρο JSON.'], data: null }
  }
}

const fingerprintOf = (raw) => sha256Hex(`${raw.events ?? '\u0001null'}\u0000${raw.state ?? '\u0001null'}`)

/**
 * Προεπισκόπηση import χωρίς εγγραφή. Store που δεν διαβάζεται → mode `replace` (πλήρης αντικατάσταση).
 * Σημάδι συναλλαγής → PendingTransactionError (κανένα import). Άκυρο αρχείο / σύγκρουση → ImportRejected.
 */
export function planImport(data, { storage = defaultStorage(), adapters }) {
  assertNoPendingTransaction(storage)
  const st = storeStatus(storage)
  if (st.status === 'pending') throw new PendingTransactionError('pending')
  const plan = planMerge({ local: st.status === 'ok' ? st.data : null, file: data, adapters })
  return { ...plan, fingerprint: fingerprintOf(st.raw), fileFingerprint: sha256Hex(canonicalJson(data)) }
}

/**
 * Εφαρμογή ενός plan. Στο ίδιο σύγχρονο βήμα, ΠΡΙΝ από κάθε εγγραφή: κανένα σημάδι, ίδια αποτυπώματα (αλλιώς
 * StaleImportError, καμία εγγραφή). Μετά: raw safety backup → μία συναλλαγή (και τα δύο κλειδιά).
 */
export function applyImport(plan, data, { storage = defaultStorage(), adapters, download = downloadJson, now = () => Date.now() }) {
  assertNoPendingTransaction(storage)
  const st = storeStatus(storage)
  if (st.status === 'pending') throw new PendingTransactionError('pending')
  if (fingerprintOf(st.raw) !== plan.fingerprint || sha256Hex(canonicalJson(data)) !== plan.fileFingerprint) throw new StaleImportError()
  const fresh = planMerge({ local: st.status === 'ok' ? st.data : null, file: data, adapters })
  if (fresh.mode !== plan.mode) throw new StaleImportError()
  const backup = createSafetyBackup(fresh.mode === 'replace' ? 'replace' : 'import', { storage, download, now })
  const { changed } = runTransaction(storage, {
    op: fresh.mode === 'replace' ? 'replace' : 'import',
    targets: { [EVENTS_KEY]: JSON.stringify(fresh.result.events), [STATE_KEY]: JSON.stringify(fresh.result.state) },
    now,
  })
  return { backup, changed, mode: fresh.mode }
}
