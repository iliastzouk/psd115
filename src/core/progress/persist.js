/**
 * Ζητά από τον browser να μη σβήνει αυτόματα τα δεδομένα του site (StorageManager.persist()).
 * Προαιρετικό και ασφαλές: αν δεν υποστηρίζεται ή αποτύχει, η εφαρμογή λειτουργεί κανονικά.
 * Δεν καλείται ακόμα από την εφαρμογή (Phase 0B: μόνο υποδομή).
 *
 * @param {{ navigator?: Navigator }} [opts] για tests
 * @returns {Promise<'granted' | 'already' | 'denied' | 'unsupported' | 'error'>}
 */
export async function requestPersistentStorage({ navigator: nav = globalThis.navigator } = {}) {
  const sm = nav?.storage
  if (!sm || typeof sm.persist !== 'function') return 'unsupported'
  try {
    if (typeof sm.persisted === 'function' && (await sm.persisted())) return 'already'
    return (await sm.persist()) ? 'granted' : 'denied'
  } catch {
    return 'error'
  }
}
