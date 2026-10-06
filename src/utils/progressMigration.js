/**
 * Εκτέλεση του legacy → frozen baseline migration (Phase 1E-2). ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΟ από προεπιλογή:
 * καμία οθόνη/εκκίνηση της εφαρμογής δεν το καλεί, και χωρίς `enabled: true` δεν διαβάζει ούτε γράφει τίποτα.
 *
 * Σειρά: έλεγχος τρέχοντος νέου store → buildLegacyBaseline (έλεγχος legacy) → idempotency/conflict με το
 * σημάδι → safety backup v2 → μία εγγραφή του `study-progress-state-v1` μέσω συναλλαγής (verify/rollback).
 * Τα `psd115-*` ΔΕΝ αλλάζουν. Το `study-progress-events-v1` ΔΕΝ γράφεται (μηδέν events).
 */
import { createProgressStore, EVENTS_KEY, STATE_KEY } from '../core/progress/progressStore.js'
import { RESET_MARKER_KEY, SHADOW_STATE_KEY } from '../core/progress/keys.js'
import { reconcileShadow } from '../core/progress/reconcile.js'
import {
  BASELINE_FORMAT,
  BASELINE_VERSION,
  buildLegacyBaseline,
  LEGACY_BASELINE_KEY,
  legacySourceHash,
  MIGRATION_MARKER_KEY,
} from '../core/progress/legacyBaseline.js'
import { createSafetyBackup, readProgressEntries, readStoreEntries } from './progressBackup.js'
import { runTransaction } from './progressTransaction.js'
import { validateStoreEntries } from './progressValidate.js'

/** Feature flag. Παραμένει false μέχρι να εγκριθεί η ενεργοποίηση (μετά το 1E-3/1E-4). */
export const LEGACY_BASELINE_MIGRATION_ENABLED = false

/**
 * @param {{ storage?: Storage, now?: () => number, enabled?: boolean, backup?: (storage: Storage) => void }} [opts]
 * @returns {Promise<{ status: 'disabled' | 'migrated' | 'already-migrated' | 'conflict' | 'rejected', errors?: string[], warnings?: string[], sourceHash?: string }>}
 */
export async function migrateLegacyBaseline({
  storage = globalThis.localStorage,
  now = () => Date.now(),
  enabled = LEGACY_BASELINE_MIGRATION_ENABLED,
  backup = (s) => createSafetyBackup('migration', { storage: s }),
} = {}) {
  if (!enabled) return { status: 'disabled' }

  const store = validateStoreEntries(readStoreEntries(storage))
  if (!store.ok) return { status: 'rejected', errors: store.errors.map((e) => `νέο store: ${e}`) }
  const stateRaw = storage.getItem(STATE_KEY)
  const state = stateRaw === null ? {} : JSON.parse(stateRaw)

  const built = buildLegacyBaseline(readProgressEntries(storage), { now })
  if (!built.ok) return { status: 'rejected', errors: built.errors, warnings: built.warnings }
  const { sourceHash } = built.marker

  const marker = state[MIGRATION_MARKER_KEY]
  const existing = state[LEGACY_BASELINE_KEY]
  if (marker !== undefined || existing !== undefined) {
    if (marker?.sourceHash === sourceHash && existing?.sourceHash === sourceHash) {
      return { status: 'already-migrated', sourceHash }
    }
    return {
      status: 'conflict',
      sourceHash,
      errors: [
        marker === undefined
          ? 'υπάρχει baseline χωρίς σημάδι migration· δεν αντικαθίσταται'
          : `υπάρχει ήδη migration με διαφορετικό source hash (${marker?.sourceHash}) από το τρέχον (${sourceHash})· δεν αντικαθίσταται`,
      ],
    }
  }

  // Αρχικό migration: επιτρέπεται μόνο με άδειο log (απόν ή []). Events χωρίς σημάδι migration θα
  // προστίθεντο πάνω από το baseline χωρίς να ξέρουμε αν είναι ήδη μέσα του → ρητή άρνηση, καμία εγγραφή.
  const eventsRaw = storage.getItem(EVENTS_KEY)
  const existingEvents = eventsRaw === null ? 0 : JSON.parse(eventsRaw).length
  if (existingEvents > 0) {
    return {
      status: 'conflict',
      sourceHash,
      errors: [`το νέο store έχει ήδη ${existingEvents} events χωρίς σημάδι migration· το αρχικό baseline απαιτεί άδειο log`],
    }
  }

  backup(storage)
  const next = { ...state, [LEGACY_BASELINE_KEY]: built.baseline, [MIGRATION_MARKER_KEY]: built.marker }
  runTransaction(storage, { op: 'migration:psd115-v1', targets: { [STATE_KEY]: JSON.stringify(next) }, now })
  return { status: 'migrated', sourceHash, warnings: built.warnings }
}

/** Ακεραιότητα baseline + σημαδιού ΧΩΡΙΣ σύγκριση με το τρέχον legacy (το legacy αλλάζει νόμιμα μετά το migration). */
function baselineIntegrity(baseline, marker) {
  const errors = []
  if (!baseline || !marker) errors.push(baseline ? 'λείπει το σημάδι migration' : 'λείπει το baseline')
  else {
    if (baseline.format !== BASELINE_FORMAT || baseline.version !== BASELINE_VERSION) errors.push('άγνωστη μορφή/έκδοση baseline')
    if (marker.sourceHash !== baseline.sourceHash) errors.push('το σημάδι και το baseline έχουν διαφορετικό source hash')
    if (marker.at !== baseline.capturedAt) errors.push('το σημάδι και το baseline έχουν διαφορετικό χρόνο')
    // Το frozen raw snapshot πρέπει να δίνει ακόμα το δικό του hash (δεν αλλοιώθηκε).
    if (!baseline.raw || legacySourceHash(baseline.raw) !== baseline.sourceHash) errors.push('το raw snapshot του baseline δεν αντιστοιχεί στο source hash του')
  }
  return errors
}

/**
 * Ελεγχόμενη ενεργοποίηση shadow mode (Phase 1E-3). Δεν καλείται από την εφαρμογή. Για να γράψει events
 * χρειάζεται ΕΠΙΣΗΣ ανοιχτό build flag (progressShadow). Idempotent:
 *  - Αρχική (χωρίς σημάδι/baseline): legacy → έλεγχος → frozen baseline + σημάδι → enable.
 *  - Επανενεργοποίηση (υπάρχει σημάδι/baseline): ΔΕΝ ξαναϋπολογίζεται hash από το τρέχον legacy
 *    (αλλάζει νόμιμα μαζί με τα events). Ελέγχεται η ακεραιότητα baseline/σημαδιού και ότι το
 *    reconciliation είναι in-sync· αλλιώς άρνηση χωρίς καμία εγγραφή (π.χ. αλλαγές legacy όσο ήταν off).
 * @returns {Promise<{ status: 'active' | 'not-activated', mode?: 'initial' | 'reactivation', reason?: string, migration?: object, report?: object, errors?: string[] }>}
 */
export async function activateShadow({ storage = globalThis.localStorage, now = () => Date.now(), backup } = {}) {
  const store = createProgressStore({ storage, now })
  const current = validateStoreEntries(readStoreEntries(storage))
  if (!current.ok) return { status: 'not-activated', reason: 'corrupt-store', errors: current.errors }

  const marker = await store.getState(MIGRATION_MARKER_KEY)
  const baseline = await store.getState(LEGACY_BASELINE_KEY)
  let mode
  let migration
  if (marker === undefined && baseline === undefined) {
    mode = 'initial'
    migration = await migrateLegacyBaseline({ storage, now, enabled: true, ...(backup ? { backup } : {}) })
    if (migration.status !== 'migrated') return { status: 'not-activated', mode, reason: 'migration', migration }
  } else {
    mode = 'reactivation'
    const errors = baselineIntegrity(baseline, marker)
    if (errors.length) return { status: 'not-activated', mode, reason: 'integrity', errors }
    const rec = await shadowReconciliation({ storage })
    if (rec.status !== 'in-sync') return { status: 'not-activated', mode, reason: 'diverged', report: rec.report }
  }

  const prev = (await store.getState(SHADOW_STATE_KEY)) ?? {}
  if (prev.enabled !== true) {
    await store.setState(SHADOW_STATE_KEY, { failures: 0, recentFailures: [], ...prev, enabled: true, activatedAt: prev.activatedAt ?? new Date(now()).toISOString() })
  }
  return { status: 'active', mode, ...(migration ? { migration } : {}) }
}

/** Kill switch: σταματά τα shadow writes χωρίς build· τα υπάρχοντα events/baseline μένουν. */
export async function deactivateShadow({ storage = globalThis.localStorage, now = () => Date.now() } = {}) {
  const store = createProgressStore({ storage, now })
  const prev = (await store.getState(SHADOW_STATE_KEY)) ?? {}
  await store.setState(SHADOW_STATE_KEY, { ...prev, enabled: false })
}

/** Reconciliation από το storage (shadow ↔ legacy). Μόνο ανάγνωση. */
export async function shadowReconciliation({ storage = globalThis.localStorage } = {}) {
  const store = createProgressStore({ storage })
  const baseline = await store.getState(LEGACY_BASELINE_KEY)
  if (!baseline) return { status: 'no-baseline' }
  const legacyRaw = storage.getItem('psd115-w1-study')
  const legacy = legacyRaw ? JSON.parse(legacyRaw) : {}
  const report = reconcileShadow({ baseline, legacy, events: await store.query(), reset: (await store.getState(RESET_MARKER_KEY)) ?? null })
  return { status: report.ok ? 'in-sync' : 'diverged', report, shadow: (await store.getState(SHADOW_STATE_KEY)) ?? null }
}
