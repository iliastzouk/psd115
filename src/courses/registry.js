/**
 * Μητρώο μαθημάτων. Πρόσθεσε εδώ νέο μάθημα· η αρχική σελίδα, το header και οι διαδρομές `/:courseId`
 * διαβάζουν από αυτή τη λίστα.
 *
 * - `group: 'current'`  → μάθημα του τρέχοντος εξαμήνου
 * - `group: 'carryOver'` → χρωστούμενο από προηγούμενο εξάμηνο (δίνεται στο τρέχον)
 * - `group: 'archive'`  → ολοκληρωμένο εξάμηνο, το υλικό μένει διαθέσιμο
 * - `ready: true`        → υπάρχει περιεχόμενο (εβδομάδες)· αλλιώς εμφανίζεται «Σύντομα»
 */

/** Τρέχουσα ακαδημαϊκή περίοδος (εμφανίζεται στην αρχική). */
export const CURRENT_TERM = { id: 'fall-2026', label: 'Fall 2026', semester: '3ο εξάμηνο' }

/**
 * @typedef {{
 *   id: string,
 *   code: string,
 *   title: string,
 *   term: string,
 *   semester: string,
 *   group: 'current' | 'carryOver' | 'archive',
 *   examDate?: string,
 *   examTime?: string,
 *   instructor?: string,
 *   accent: 'teal' | 'sky' | 'emerald' | 'violet' | 'amber' | 'rose',
 *   ready: boolean,
 *   weeks?: { to: string, short: string, long: string, title?: string, summary?: string }[],
 * }} Course
 */

/** @type {Course[]} */
export const COURSES = [
  {
    id: 'psd200',
    code: 'PSD200',
    title: 'Αναπτυξιακή Ψυχολογία Ι',
    term: 'Fall 2026',
    semester: '3ο εξάμηνο',
    group: 'current',
    examDate: '2027-01-20',
    examTime: '18:00–20:30',
    accent: 'sky',
    ready: false,
  },
  {
    id: 'psd215',
    code: 'PSD215',
    title: 'Εκπαιδευτική Ψυχολογία',
    term: 'Fall 2026',
    semester: '3ο εξάμηνο',
    group: 'current',
    examDate: '2027-01-25',
    examTime: '18:00–20:30',
    accent: 'emerald',
    ready: false,
  },
  {
    id: 'psd210',
    code: 'PSD210',
    title: 'Θεωρίες Προσωπικότητας',
    term: 'Fall 2026',
    semester: '3ο εξάμηνο',
    group: 'current',
    examDate: '2027-01-29',
    examTime: '18:00–20:30',
    accent: 'violet',
    ready: false,
  },
  {
    id: 'psd110',
    code: 'PSD110',
    title: 'Εισαγωγή στην Ηθική',
    term: 'Fall 2026',
    semester: '1ο εξάμηνο',
    group: 'carryOver',
    examDate: '2027-01-21',
    examTime: '18:00–20:30',
    instructor: 'Evangelos Protopapadakis',
    accent: 'amber',
    ready: false,
  },
  {
    id: 'psd125',
    code: 'PSD125/PSD124',
    title: 'Κοινωνική Ψυχολογία',
    term: 'Fall 2026',
    semester: '1ο εξάμηνο',
    group: 'carryOver',
    instructor: 'Antonis Katsouros',
    accent: 'rose',
    ready: false,
  },
  {
    id: 'psd115',
    code: 'PSD115',
    title: 'Ψυχολογία ΙΙ',
    term: 'Spring 2026',
    semester: '2ο εξάμηνο',
    group: 'archive',
    accent: 'teal',
    ready: true,
    weeks: [
      { to: '/psd115/week/1', short: 'Εβδ. 1', long: 'Εβδομάδα 1' },
      { to: '/psd115/week/2', short: 'Εβδ. 2', long: 'Εβδομάδα 2' },
      { to: '/psd115/week/3', short: 'Εβδ. 3', long: 'Εβδομάδα 3' },
      { to: '/psd115/week/4', short: 'Εβδ. 4', long: 'Εβδομάδα 4' },
    ],
  },
]

export function getCourse(id) {
  return COURSES.find((c) => c.id === id) ?? null
}

/** Μάθημα από το πρώτο τμήμα του pathname (`/psd115/week/1` → psd115). */
export function courseFromPath(pathname) {
  const seg = pathname.split('/')[1] ?? ''
  return getCourse(seg.toLowerCase())
}

/** Ταξινόμηση κατά ημερομηνία εξέτασης (χωρίς ημερομηνία → στο τέλος). */
export function byExamDate(a, b) {
  if (!a.examDate) return 1
  if (!b.examDate) return -1
  return a.examDate.localeCompare(b.examDate)
}

export function formatExamDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('el-GR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Ημέρες μέχρι την εξέταση (0 = σήμερα, αρνητικό = πέρασε). */
export function daysUntil(iso, now = new Date()) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const exam = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((exam - today) / 86400000)
}
