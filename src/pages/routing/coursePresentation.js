/**
 * Παρουσίαση ανά μάθημα (κείμενα/χρώματα) — ΟΧΙ ταυτότητα. Κλειδώνεται σε unitId / legacyKey που
 * έρχονται από το core/routing/navigation.js· δεν ορίζει δικές του units, topics ή URLs.
 * Μάθημα χωρίς εγγραφή εδώ εμφανίζεται με τα στοιχεία του registry.
 */
import { WEEK1_LESSON_NAV } from '../../../content/courses/psd115/units/k1/lessonNav.js'
import { WEEK2_LESSON_NAV } from '../../../content/courses/psd115/units/k2/lessonNav.js'
import { WEEK3_LESSON_NAV } from '../../../content/courses/psd115/units/k3/lessonNav.js'
import { WEEK4_LESSON_NAV } from '../../../content/courses/psd115/units/k4/lessonNav.js'

// Τίτλοι θεμάτων: από το lessonNav του περιεχομένου, αναζήτηση με το legacy κλειδί (adapter 1C-B).
const PSD115_TOPIC_TITLES = new Map(
  [...WEEK1_LESSON_NAV, ...WEEK2_LESSON_NAV, ...WEEK3_LESSON_NAV, ...WEEK4_LESSON_NAV].map((n) => [n.to, n.title]),
)

export const COURSE_PRESENTATION = {
  psd115: {
    headerTitle: 'Ψυχολογία 2',
    units: {
      k1: {
        short: 'Εβδ. 1',
        blurb: 'Ορισμός, φιλόσοφοι, σχολές, κλάδοι.',
        card: 'hover:border-teal-400 dark:hover:border-teal-600',
        badge: 'text-teal-600 dark:text-teal-400',
        heading: 'group-hover:text-teal-700 dark:group-hover:text-teal-300',
      },
      k2: {
        short: 'Εβδ. 2',
        blurb: 'Εμπειρισμός, παρατήρηση, πείραμα, δειγματοληψία, δεοντολογία.',
        card: 'hover:border-sky-400 dark:hover:border-sky-600',
        badge: 'text-sky-600 dark:text-sky-400',
        heading: 'group-hover:text-sky-700 dark:group-hover:text-sky-300',
      },
      k3: {
        short: 'Εβδ. 3',
        blurb: 'Νευρώνες, σύναψη, εγκέφαλος, ΗΕΓ, απεικόνιση (K3).',
        card: 'hover:border-emerald-400 dark:hover:border-emerald-600',
        badge: 'text-emerald-600 dark:text-emerald-400',
        heading: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300',
      },
      k4: {
        short: 'Εβδ. 4',
        blurb: 'Ουδοί, όραση, ακοή, αφή, όσφρηση, γεύση (K4).',
        card: 'hover:border-violet-400 dark:hover:border-violet-600',
        badge: 'text-violet-600 dark:text-violet-400',
        heading: 'group-hover:text-violet-700 dark:group-hover:text-violet-300',
      },
    },
    topicTitle: (topic) => PSD115_TOPIC_TITLES.get(topic.legacyKey) ?? topic.topicId,
  },
}

export const presentationFor = (courseId) => COURSE_PRESENTATION[courseId] ?? null
export const unitPresentation = (courseId, unitId) => presentationFor(courseId)?.units[unitId] ?? null
export const topicTitle = (topic) => presentationFor(topic.courseId)?.topicTitle(topic) ?? topic.topicId
