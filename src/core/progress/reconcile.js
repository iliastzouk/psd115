/**
 * Reconciliation shadow ↔ legacy (1E-3· πλήρες από το 1E-4c-1) — pure, χωρίς γνώση μαθήματος.
 *
 *   legacy  = legacyToSnapshot(τρέχοντα legacy κλειδιά, runtime)
 *   shadow  = buildProgressSnapshot(baseline, events, state)
 *   in-sync ⟺ ίδιο snapshot σε ΟΛΑ τα πεδία: quizAnswered, quizCorrect, byGroup, flashcardSeenIds, wrongBook, checklists
 *
 * Κανονικοποιήσεις (ρητές, και οι μόνες):
 *  - wrongBook: αγνοείται το `t` (το legacy δεν το αποθηκεύει)· όλα τα υπόλοιπα πεδία και η σειρά συγκρίνονται.
 *  - flashcardSeenIds: σύνολο (η σημασιολογία των καρτών είναι set membership).
 *  - αντικείμενα (byGroup, checklists): χωρίς σημασία η σειρά των κλειδιών· οι τιμές και οι πίνακες αυστηρά.
 * Τα checklists συγκρίνονται αυστηρά (απόν ≠ πίνακας με false).
 *
 * Legacy δεδομένα που το snapshot ΔΕΝ αναπαριστά (άγνωστα κλειδιά, checklists χωρίς θέμα — 1E-4c-2, F3): το reconciliation
 * ΔΕΝ βγάζει in-sync όσο υπάρχουν· επιστρέφονται στο `unrepresented`. in-sync ⟺ κενό diff ΚΑΙ κενό unrepresented.
 */
import { buildProgressSnapshot, legacyToSnapshot } from './snapshot.js'

const FIELDS = ['quizAnswered', 'quizCorrect', 'byGroup', 'flashcardSeenIds', 'wrongBook', 'checklists']

/** JSON με ταξινομημένα κλειδιά αντικειμένων (οι πίνακες κρατούν τη σειρά τους). */
function canonical(value) {
  return JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : v))
}

function normalize(snapshot) {
  return {
    quizAnswered: snapshot.quizAnswered,
    quizCorrect: snapshot.quizCorrect,
    byGroup: snapshot.byGroup,
    flashcardSeenIds: [...snapshot.flashcardSeenIds].sort(),
    wrongBook: snapshot.wrongBook.map(({ t, ...entry }) => entry),
    checklists: snapshot.checklists,
  }
}

/**
 * @param {{
 *   content: import('./contentAdapter.js').ContentAdapter,
 *   baseline: object,                       // frozen legacy baseline
 *   legacyEntries: Record<string, string>,  // τρέχοντα raw legacy κλειδιά
 *   events?: object[],
 *   state?: object,                         // ολόκληρο το state του store (reset, wrongbook, checklists namespaces)
 * }} input
 * @returns {{ ok: boolean, diff: Record<string, { legacy: unknown, shadow: unknown }>, unrepresented: { key: string, reason: string }[],
 *            errors: string[], legacy?: object, shadow?: object }}
 */
export function reconcileShadow({ content, baseline, legacyEntries, events = [], state = {} }) {
  const legacy = legacyToSnapshot(legacyEntries, { content, mode: 'runtime' })
  const shadow = buildProgressSnapshot({ courseId: baseline?.courseId, content, baseline, events, state })
  const errors = [...(legacy.ok ? [] : legacy.errors.map((e) => `legacy: ${e}`)), ...(shadow.ok ? [] : shadow.errors.map((e) => `shadow: ${e}`))]
  if (errors.length) return { ok: false, diff: {}, unrepresented: [], errors }
  const a = normalize(legacy.snapshot)
  const b = normalize(shadow.snapshot)
  const diff = {}
  for (const field of FIELDS) if (canonical(a[field]) !== canonical(b[field])) diff[field] = { legacy: a[field], shadow: b[field] }
  const unrepresented = legacy.unrepresented ?? []
  return { ok: Object.keys(diff).length === 0 && unrepresented.length === 0, diff, unrepresented, errors, legacy: legacy.snapshot, shadow: shadow.snapshot }
}
