/**
 * Frozen legacy baseline (Phase 1E-2· γενικό από το 1E-4c-1) — pure, χωρίς storage/browser APIs.
 *
 *   legacy snapshot (raw κλειδιά) → buildLegacyBaseline({ content }) → { baseline, marker }  ·  μηδέν events
 *
 * Το baseline σημαίνει «αυτή ήταν η γνωστή κατάσταση του legacy συστήματος τη στιγμή του migration».
 * ΔΕΝ σημαίνει «ο χρήστης έκανε αυτά τα events τότε»: κανένα answer/flip/self δεν δημιουργείται, και το μόνο
 * timestamp που προέρχεται από το migration είναι το `capturedAt` / `marker.at`.
 *
 * Η επικύρωση και η αποκωδικοποίηση γίνονται ΜΟΝΟ από τον snapshot engine (`legacyToSnapshot`, strict) και το content
 * adapter του μαθήματος· εδώ δεν υπάρχει γνώση μαθήματος ή παλιών κλειδιών. Το σχήμα του baseline (v1) δεν άλλαξε:
 * το αποτέλεσμα είναι byte-identical με την υλοποίηση του 1E-2 (έλεγχος στα tests).
 * Ό,τι βλέπει ο χρήστης υπολογίζεται από το `buildProgressSnapshot` (snapshot.js).
 */
import { parseGlobalId } from '../academic/ids.js'
import { legacyToSnapshot } from './snapshot.js'
import { sha256Hex } from './sha256.js'

import { LEGACY_BASELINE_KEY } from './keys.js'
export { LEGACY_BASELINE_KEY, MIGRATION_MARKER_KEY, RESET_MARKER_KEY } from './keys.js'
export const BASELINE_FORMAT = 'legacy-baseline'
export const BASELINE_VERSION = 1
export const MIGRATION_VERSION = 1
/** Όριο του legacy wrongBook· πάνω από αυτό → προειδοποίηση (δεν «διορθώνεται»). */
const WRONG_BOOK_LIMIT = 60

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * Source hash: SHA-256 του αυτούσιου legacy payload, με ταξινομημένα κλειδιά. Ανεξάρτητο από
 * σειρά κλειδιών, exportedAt ή runtime. Ίδιο payload → ίδιο hash.
 * @param {Record<string, string>} entries raw legacy κλειδιά (χωρίς backups)
 */
export function legacySourceHash(entries) {
  const canonical = JSON.stringify(
    Object.keys(entries)
      .sort()
      .map((key) => [key, entries[key]]),
  )
  return `sha256:${sha256Hex(canonical)}`
}

/**
 * Ελέγχει το legacy snapshot και φτιάχνει baseline + marker. Δεν γράφει τίποτα.
 * @param {Record<string, string>} entries raw legacy κλειδιά (όπως `export.keys` / localStorage, χωρίς backups)
 * @param {{ now: () => number, content: import('./contentAdapter.js').ContentAdapter }} opts
 * @returns {{ ok: true, baseline: object, marker: object, warnings: string[], snapshot: object } | { ok: false, errors: string[], warnings: string[] }}
 */
export function buildLegacyBaseline(entries, { now, content }) {
  if (!isObj(entries)) return { ok: false, errors: ['το legacy snapshot πρέπει να είναι αντικείμενο κλειδί → raw string'], warnings: [] }
  const r = legacyToSnapshot(entries, { content, mode: 'strict' })
  const warnings = [...r.warnings]
  const errors = [...(r.ok ? [] : r.errors), ...(content?.legacy?.checkSettings?.(entries) ?? [])]
  if (errors.length) return { ok: false, errors, warnings }

  const s = r.snapshot
  const local = (item) => parseGlobalId(item).localId
  // legacyKey (μόνο πληροφορία συμβατότητας): ποιο παλιό κλειδί κράτησε το checklist κάθε θέματος.
  const legacyKeyOf = new Map(content.legacy.decode(entries).checklists.map((c) => [c.topicId, c.key]))
  if (s.wrongBook.length > WRONG_BOOK_LIMIT) warnings.push(`study.wrongBook: ${s.wrongBook.length} εγγραφές (> ${WRONG_BOOK_LIMIT})`)

  const raw = Object.fromEntries(Object.keys(entries).sort().map((key) => [key, entries[key]]))
  const sourceHash = legacySourceHash(raw)
  const capturedAt = new Date(now()).toISOString()
  const baseline = {
    format: BASELINE_FORMAT,
    version: BASELINE_VERSION,
    courseId: s.courseId,
    sourceHash,
    capturedAt,
    raw,
    progress: {
      quizAnswered: s.quizAnswered,
      quizCorrect: s.quizCorrect,
      byCategory: s.byGroup,
      flashcardSeenIds: s.flashcardSeenIds.map(local),
      wrongBook: s.wrongBook.map((w) => ({
        uid: w.uid,
        id: local(w.item),
        categoryId: w.group,
        question: w.question,
        explanation: w.explanation,
        userLabel: w.userLabel,
        correctLabel: w.correctLabel,
      })),
      checklists: Object.fromEntries(Object.entries(s.checklists).map(([topicId, c]) => [topicId, { items: c.items, legacyKey: legacyKeyOf.get(topicId) }])),
    },
  }
  const marker = { version: MIGRATION_VERSION, at: capturedAt, sourceHash, baselineKey: LEGACY_BASELINE_KEY, baselineVersion: BASELINE_VERSION }
  // `snapshot` (1E-4c-2): για την υλοποίηση των state namespaces στην ίδια εγγραφή με το baseline.
  return { ok: true, baseline, marker, warnings, snapshot: s }
}
