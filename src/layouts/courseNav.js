import { courseHomePath, courseIdentity, courseUnits } from '../core/routing/navigation.js'
import { presentationFor, unitPresentation } from '../pages/routing/coursePresentation.js'

/** Όνομα της εφαρμογής (Φάση 6c): επικεφαλίδα, footer, αρχική μαθημάτων, τίτλος του browser (index.html). */
export const APP_NAME = 'Exam Prep by Ilias Tzoukas'

/**
 * Header/drawer (Phase 1C-C· Φάση 6c: και χωρίς μάθημα). Ταυτότητα από το registry, units από τη δομή του μαθήματος·
 * μάθημα χωρίς περιεχόμενο δεν παίρνει units. Χωρίς ενεργό μάθημα (`null`): μόνο το όνομα της εφαρμογής και τα μαθήματα.
 * Τα κείμενα «Εβδ. N» κ.λπ. είναι μόνο παρουσίαση (coursePresentation.js).
 * @param {string | null} courseId
 * @returns {{ appName: string, code: string | null, title: string | null, homePath: string,
 *   nav: { to: string, end?: boolean, courseId?: string, unitId?: string, short: string, long: string }[] }}
 */
export function courseHeader(courseId) {
  const course = courseId ? courseIdentity(courseId) : null
  if (!course) return { appName: APP_NAME, code: null, title: null, homePath: '/', nav: [{ to: '/', end: true, short: 'Αρχική', long: 'Αρχική' }] }
  const homePath = courseHomePath(courseId)
  return {
    appName: APP_NAME,
    code: course.code,
    title: presentationFor(courseId)?.headerTitle ?? course.title,
    homePath,
    nav: [
      { to: homePath, end: true, short: 'Αρχική', long: 'Αρχική μαθήματος' },
      ...courseUnits(courseId).map((u) => ({
        to: u.path,
        courseId,
        unitId: u.unitId,
        short: unitPresentation(courseId, u.unitId)?.short ?? u.label,
        long: u.label,
      })),
    ],
  }
}

/**
 * Ενότητες «Μαθήματα» (τρέχον και επόμενα εξάμηνα, μαθήματα χωρίς εξάμηνο) και «Προηγούμενα» του μενού, από το
 * courseHub. Άδειες ενότητες δεν εμφανίζονται· ένα μάθημα εμφανίζεται μία φορά (στην πρώτη του ενότητα).
 * @param {ReturnType<typeof import('../core/routing/courseHub.js').courseHub>} hub
 * @returns {{ title: string, items: { to: string, courseId: string, label: string }[] }[]}
 */
export function courseMenu(hub) {
  const groups = { Μαθήματα: [], Προηγούμενα: [] }
  const seen = new Set()
  for (const s of hub.sections) {
    const group = s.role === 'past' ? groups.Προηγούμενα : groups.Μαθήματα
    for (const c of s.courses) {
      if (seen.has(c.courseId)) continue
      seen.add(c.courseId)
      group.push({ to: c.path, courseId: c.courseId, label: `${c.code} — ${c.title}` })
    }
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length)
    .map(([title, items]) => ({ title, items }))
}
