import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * After route changes, scroll to top and move keyboard/screen-reader focus to main.
 * Hash-only updates are ignored so in-page anchors still behave normally.
 */
export default function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const el = document.getElementById('main-content')
    if (el instanceof HTMLElement) {
      el.focus({ preventScroll: true })
    }
  }, [location.pathname, location.search])

  return null
}
