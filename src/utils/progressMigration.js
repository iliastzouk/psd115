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
import { buildLegacyBaseline, LEGACY_BASELINE_KEY, MIGRATION_MARKER_KEY } from '../core/progress/legacyBaseline.js'
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

/**
 * Ελεγχόμενη ενεργοποίηση shadow mode (Phase 1E-3): migration (idempotent) ΚΑΙ μετά runtime ενεργοποίηση.
 * Δεν καλείται από την εφαρμογή. Για να γράψει events χρειάζεται ΕΠΙΣΗΣ ανοιχτό build flag (progressShadow).
 * Ο shadow mode ξεκινά πάντα ΜΕΤΑ το baseline: χωρίς επιτυχημένο migration δεν ενεργοποιείται.
 */
export async function activateShadow({ storage = globalThis.localStorage, now = () => Date.now(), backup } = {}) {
  const migration = await migrateLegacyBaseline({ storage, now, enabled: true, ...(backup ? { backup } : {}) })
  if (migration.status !== 'migrated' && migration.status !== 'already-migrated') return { status: 'not-activated', migration }
  const store = createProgressStore({ storage, now })
  const prev = (await store.getState(SHADOW_STATE_KEY)) ?? {}
  await store.setState(SHADOW_STATE_KEY, { failures: 0, recentFailures: [], ...prev, enabled: true, activatedAt: prev.activatedAt ?? new Date(now()).toISOString() })
  return { status: 'active', migration }
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
