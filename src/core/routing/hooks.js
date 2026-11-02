import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveLocation } from './resolve.js'

/** Η επιλυμένη ταυτότητα της τρέχουσας διεύθυνσης (δες resolve.js). */
export function useRouteIdentity() {
  const { pathname, search } = useLocation()
  return useMemo(() => resolveLocation(pathname, search), [pathname, search])
}
