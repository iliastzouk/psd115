import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveLocation } from './resolve.js'

/** Η επιλυμένη ταυτότητα της τρέχουσας διεύθυνσης (δες resolve.js). */
export function useRouteIdentity() {
  const { pathname, search } = useLocation()
  return useMemo(() => resolveLocation(pathname, search), [pathname, search])
}

/**
 * Το legacy κλειδί (/week/N/...) της τρέχουσας σελίδας, για κώδικα που διαβάζει υπάρχον περιεχόμενο
 * δεμένο σε παλιές διαδρομές. Κενό string όταν δεν υπάρχει αντίστοιχο.
 */
export const useLegacyRouteKey = () => useRouteIdentity().legacyKey
