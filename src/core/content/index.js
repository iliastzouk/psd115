/**
 * Το ένα σημείο καταχώρισης του περιεχομένου (Φάση 6d-α): τα manifests του content/courses/index.js → κατάλογος του
 * routing (routing/catalog.js) και περιεχόμενο μελέτης (study/content.js). Νέο μάθημα = νέο manifest στο
 * content/courses/index.js· κανένα άλλο αρχείο της εφαρμογής δεν αλλάζει για να το καταχωρίσει.
 */
import { COURSES } from '../../../content/courses/index.js'
import { deriveCatalog, deriveStudyContent } from './registry.js'

export const CONTENT_CATALOG = deriveCatalog(COURSES)
export const STUDY_CONTENT = deriveStudyContent(COURSES)
