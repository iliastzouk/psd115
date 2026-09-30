import { courseHomePath, courseIdentity, courseUnits } from '../core/routing/navigation.js'
import { presentationFor, unitPresentation } from '../pages/routing/coursePresentation.js'

/**
 * Header/drawer του ενεργού μαθήματος (Phase 1C-C). Ταυτότητα από το registry, units από τη δομή
 * του μαθήματος· μάθημα χωρίς περιεχόμενο δεν παίρνει units (ούτε του PSD115). Τα κείμενα
 * «Εβδ. N» κ.λπ. είναι μόνο παρουσίαση (coursePresentation.js).
 * @param {string} courseId
 * @returns {{ code: string, title: string, homePath: string,
 *   nav: { to: string, end?: boolean, courseId?: string, unitId?: string, short: string, long: string }[] }}
 */
export function courseHeader(courseId) {
  const course = courseIdentity(courseId)
  const homePath = courseHomePath(courseId)
  return {
    code: course.code,
    title: presentationFor(courseId)?.headerTitle ?? course.title,
    homePath,
    nav: [
      { to: homePath, end: true, short: 'Αρχική', long: 'Αρχική' },
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
