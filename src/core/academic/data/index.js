/**
 * Academic registry (Phase 1A). ΠΑΡΑΛΛΗΛΗ υποδομή: η εφαρμογή δεν το χρησιμοποιεί ακόμα —
 * μόνο tests και `scripts/validate-content.mjs`.
 */
import { program } from './program.js'
import { terms } from './terms.js'
import { courses } from './courses.js'
import { enrollments } from './enrollments.js'
import { recordings } from './recordings.js'

export const registry = { program, terms, courses, enrollments, recordings }
