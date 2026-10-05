/**
 * Εκτέλεση του legacy → frozen baseline migration (Phase 1E-2). ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΟ από προεπιλογή:
 * καμία οθόνη/εκκίνηση της εφαρμογής δεν το καλεί, και χωρίς `enabled: true` δεν διαβάζει ούτε γράφει τίποτα.
 *
 * Σειρά: έλεγχος τρέχοντος νέου store → buildLegacyBaseline (έλεγχος legacy) → idempotency/conflict με το
 * σημάδι → safety backup v2 → μία εγγραφή του `study-progress-state-v1` μέσω συναλλαγής (verify/rollback).
 * Τα `psd115-*` ΔΕΝ αλλάζουν. Το `study-progress-events-v1` ΔΕΝ γράφεται (μηδέν events).
 */
import { STATE_KEY } from '../core/progress/progressStore.js'
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

  backup(storage)
  const next = { ...state, [LEGACY_BASELINE_KEY]: built.baseline, [MIGRATION_MARKER_KEY]: built.marker }
  runTransaction(storage, { op: 'migration:psd115-v1', targets: { [STATE_KEY]: JSON.stringify(next) }, now })
  return { status: 'migrated', sourceHash, warnings: built.warnings }
}
