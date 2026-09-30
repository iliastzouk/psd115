import { Navigate, useLocation } from 'react-router-dom'
import { resolveLegacy } from '../../core/routing/legacy.js'
import { getUnit } from '../../core/routing/catalog.js'
import { unitPath } from '../../core/routing/paths.js'
import NotFound from './NotFound.jsx'

/** Παλιές διαδρομές /week/... → canonical, μέσω του ρητού legacy πίνακα. Άγνωστες → Not Found. */
export default function LegacyRedirect() {
  const { pathname, search, hash } = useLocation()
  const result = resolveLegacy(pathname)
  if (result.target) {
    const [path, query = ''] = result.target.split('?')
    const params = new URLSearchParams(query)
    for (const [k, v] of new URLSearchParams(search)) if (!params.has(k)) params.append(k, v)
    const qs = params.toString().replace(/%3A/gi, ':').replace(/%2F/gi, '/')
    return <Navigate to={`${path}${qs ? `?${qs}` : ''}${hash}`} replace />
  }
  const unit = result.unit ? getUnit(result.unit.courseId, result.unit.unitId) : null
  return (
    <NotFound
      message="Αυτή η παλιά διεύθυνση δεν αντιστοιχεί σε κάποια ενότητα."
      links={unit ? [{ to: unitPath(result.unit.courseId, unit.id), label: unit.label }] : []}
    />
  )
}
