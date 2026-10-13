/**
 * ProgressService (Phase 1E-4b) — η ΜΟΝΗ runtime πηγή αλήθειας για την πρόοδο. Χωρίς React, DOM ή storage:
 * το backend δίνεται ως εξάρτηση. Δημιουργείται ΜΙΑ φορά (main.jsx), πριν από το πρώτο render.
 *
 * Legacy mode (1E-4b):
 *   backend.read() → legacyToSnapshot(runtime) → ΕΝΑ immutable ProgressState στη μνήμη
 *   mutation → νέο Snapshot → snapshotToLegacy → backend.write(μόνο τα κλειδιά που άλλαξαν) → νέο state → notify
 *
 *   ProgressState = { version: 1, status: 'ready' | 'degraded', issues: string[], courses: { [courseId]: Snapshot } }
 *
 * - Η δημιουργία ΔΕΝ γράφει τίποτα. Καμία εγγραφή χωρίς ενέργεια του χρήστη.
 * - `getSnapshot()` επιστρέφει το ΙΔΙΟ αντικείμενο μέχρι την επόμενη πραγματική αλλαγή (useSyncExternalStore).
 *   Κάθε αλλαγή φτιάχνει νέο root· το προηγούμενο δεν τροποποιείται (deep-frozen).
 * - Αλλαγή που δεν αλλάζει τίποτα (π.χ. κάρτα που ήδη είδε) → καμία εγγραφή, κανένα notify.
 * - Degraded (κατεστραμμένα δεδομένα / αμφίβολη ανάκτηση): καμία εγγραφή, ποτέ «μηδενικά που αποθηκεύονται»·
 *   η μελέτη συνεχίζει χωρίς αποθήκευση.
 * - Δεν ξέρει τίποτα για shadow events ή baseline: ο shadow recorder μένει στους handlers (1E-3).
 */
import { toGlobalId } from '../academic/ids.js'
import { emptySnapshot, legacyToSnapshot, snapshotToLegacy, validateSnapshot } from './snapshot.js'

export const PROGRESS_STATE_VERSION = 1
/** Ίδιο όριο με το legacy wrongBook (τα παλαιότερα φεύγουν πρώτα). */
export const WRONG_BOOK_LIMIT = 60
/** Αποτελέσματα του recoverInterrupted που αφήνουν αμφίβολη κατάσταση → degraded. */
const UNSAFE_RECOVERY = new Set(['failed', 'corrupt-marker'])

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    for (const v of Object.values(o)) deepFreeze(v)
  }
  return o
}

const defaultUid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const sameItems = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

let created = 0
/** Πόσα services δημιουργήθηκαν σε αυτό το runtime (για το smoke: πρέπει να είναι 1). */
export const createdServiceCount = () => created

/**
 * @param {{
 *   courseId: string,
 *   content: import('./contentAdapter.js').ContentAdapter,   // με legacy codec (legacy mode)
 *   backend: { read: () => Record<string, string>, write: (changes: Record<string, string>) => void },
 *   recovery?: { status: string },                           // αποτέλεσμα του recoverInterrupted
 *   newUid?: () => string,
 *   warn?: (...a: unknown[]) => void,
 * }} opts
 */
export function createProgressService({ courseId, content, backend, recovery = { status: 'none' }, newUid = defaultUid, warn = () => {} }) {
  created += 1
  const listeners = new Set()
  /** Τελευταίες γνωστές raw τιμές (για διατήρηση ό,τι δεν ανήκει στο snapshot μέσα σε κοινά κλειδιά). */
  let raw = {}

  const freezeState = (s) => deepFreeze({ version: PROGRESS_STATE_VERSION, ...s })
  const degraded = (issues) => {
    raw = {}
    return freezeState({ status: 'degraded', issues, courses: { [courseId]: emptySnapshot(courseId) } })
  }

  function load() {
    if (UNSAFE_RECOVERY.has(recovery?.status)) return degraded([`ανάκτηση μετά από διακοπή: ${recovery.status}`])
    let entries
    try {
      entries = backend.read()
    } catch (e) {
      return degraded([`ανάγνωση: ${e?.message ?? e}`])
    }
    const r = legacyToSnapshot(entries, { content, mode: 'runtime' })
    if (!r.ok) return degraded(r.issues)
    raw = { ...entries }
    return freezeState({ status: 'ready', issues: r.warnings, courses: { [courseId]: r.snapshot } })
  }

  let state = load()

  function notify() {
    for (const listener of [...listeners]) listener()
  }

  /** Εφαρμόζει ένα νέο snapshot του μαθήματος: εγγραφή μόνο των κλειδιών που άλλαξαν, νέο state, notify. */
  function commit(next) {
    const errors = validateSnapshot(next, { content })
    if (errors.length) throw new Error(`ProgressService: άκυρο snapshot (${errors.join('; ')})`)
    const before = snapshotToLegacy(state.courses[courseId], { content, previous: raw })
    const after = snapshotToLegacy(next, { content, previous: raw })
    if (!before.ok || !after.ok) throw new Error(`ProgressService: projection (${[...(before.errors ?? []), ...(after.errors ?? [])].join('; ')})`)
    const changes = {}
    for (const [key, value] of Object.entries(after.entries)) if (before.entries[key] !== value) changes[key] = value
    if (Object.keys(changes).length) {
      try {
        backend.write(changes)
        raw = { ...raw, ...changes }
      } catch (e) {
        // Όπως το legacy: η αποτυχία εγγραφής (π.χ. quota) δεν σταματά τη μελέτη. Η εμφάνισή της = follow-up.
        warn('[progress] η αποθήκευση απέτυχε:', e?.message ?? e)
      }
    }
    state = freezeState({ ...state, courses: { ...state.courses, [courseId]: next } })
    notify()
    return true
  }

  const current = () => (state.status === 'ready' ? state.courses[courseId] : null)

  return Object.freeze({
    courseId,
    getSnapshot: () => state,

    /** @param {() => void} listener @returns {() => void} */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    /**
     * Μία απάντηση στο κεντρικό κουίζ. Λάθος → εγγραφή στο wrongBook (ό,τι είδε ο χρήστης).
     * @param {{ questionId: string, ok: boolean, wrong?: { question: string, explanation: string, userLabel: string, correctLabel: string } }} a
     */
    answerQuestion({ questionId, ok, wrong }) {
      const s = current()
      if (!s) return false
      const group = content.groupOf(questionId)
      if (typeof group !== 'string') throw new Error(`ProgressService: άγνωστη ερώτηση «${questionId}»`)
      const g = s.byGroup[group] ?? { correct: 0, wrong: 0 }
      let wrongBook = s.wrongBook
      if (!ok) {
        const { question, explanation, userLabel, correctLabel } = wrong ?? {}
        wrongBook = [...s.wrongBook, { uid: newUid(), item: toGlobalId(courseId, questionId), group, question, explanation, userLabel, correctLabel, t: null }]
        while (wrongBook.length > WRONG_BOOK_LIMIT) wrongBook.shift()
      }
      return commit({
        ...s,
        quizAnswered: s.quizAnswered + 1,
        quizCorrect: s.quizCorrect + (ok ? 1 : 0),
        byGroup: { ...s.byGroup, [group]: { correct: g.correct + (ok ? 1 : 0), wrong: g.wrong + (ok ? 0 : 1) } },
        wrongBook,
      })
    },

    /** «Επόμενη κάρτα»: η κάρτα μπαίνει στο σύνολο των καρτών που είδε (μία φορά). */
    markCardSeen(cardId) {
      const s = current()
      if (!s) return false
      const item = toGlobalId(courseId, cardId)
      if (s.flashcardSeenIds.includes(item)) return false
      return commit({ ...s, flashcardSeenIds: [...s.flashcardSeenIds, item] })
    },

    removeWrong(uid) {
      const s = current()
      if (!s) return false
      const wrongBook = s.wrongBook.filter((w) => w.uid !== uid)
      return wrongBook.length === s.wrongBook.length ? false : commit({ ...s, wrongBook })
    },

    clearWrongBook() {
      const s = current()
      if (!s || !s.wrongBook.length) return false
      return commit({ ...s, wrongBook: [] })
    },

    /** @param {string} topicId canonical @param {boolean[]} items */
    setChecklist(topicId, items) {
      const s = current()
      if (!s) return false
      if (!content.hasTopic(topicId)) throw new Error(`ProgressService: άγνωστο θέμα «${topicId}»`)
      if (!Array.isArray(items) || !items.every((x) => typeof x === 'boolean')) throw new Error('ProgressService: checklist = πίνακας true/false')
      const prev = s.checklists[topicId]?.items
      if (prev && sameItems(prev, items)) return false
      return commit({ ...s, checklists: { ...s.checklists, [topicId]: { items: [...items] } } })
    },

    /** Ξαναδιαβάζει το backend μετά από εγγραφή υποδομής (reset). Νέο state, notify. */
    resync() {
      state = load()
      notify()
    },
  })
}
