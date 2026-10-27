/**
 * Συγχρονισμός μεταξύ tabs (Φάση 3, G3). Ο browser ειδοποιεί τα ΑΛΛΑ tabs του ίδιου origin όταν αλλάζει το localStorage
 * (όχι το tab που έγραψε). Σε αλλαγή κλειδιού προόδου, του σημαδιού συναλλαγής ή σε `clear()` (key null):
 * `service.refresh()` — μόνο ανάγνωση· το service κρίνει μόνο του την τρέχουσα κατάσταση (και το σημάδι) από το storage.
 * Ο listener δεν γράφει ποτέ και δεν συμπεραίνει τίποτα από τα `oldValue`/`newValue` του event.
 */
import { isProgressKey } from './progressValidate.js'
import { TXN_KEY } from './progressTransaction.js'

/**
 * @param {{ refresh: () => unknown }} service
 * @param {{ target?: EventTarget, storage?: Storage }} [opts] `storage`: μόνο events αυτού του storage (όχι sessionStorage)
 * @returns {() => void} απεγκατάσταση
 */
export function installStorageSync(service, { target = globalThis.window, storage } = {}) {
  if (!target?.addEventListener) return () => {}
  const onStorage = (e) => {
    if (storage && e.storageArea !== storage) return
    if (e.key === null || e.key === TXN_KEY || isProgressKey(e.key)) service.refresh()
  }
  target.addEventListener('storage', onStorage)
  return () => target.removeEventListener('storage', onStorage)
}
