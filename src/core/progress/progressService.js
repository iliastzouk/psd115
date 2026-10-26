/**
 * ProgressService (Phase 1E-4b) — η ΜΟΝΗ runtime πηγή αλήθειας για την πρόοδο. Χωρίς React, DOM ή storage:
 * το backend δίνεται ως εξάρτηση. Δημιουργείται ΜΙΑ φορά (main.jsx), πριν από το πρώτο render.
 *
 * Legacy mode (1E-4b):
 *   backend.read() → legacyToSnapshot(runtime) → ΕΝΑ immutable ProgressState στη μνήμη
 *   mutation → νέο Snapshot → snapshotToLegacy → backend.write(μόνο τα κλειδιά που άλλαξαν) → νέο state → notify
 *
 *   ProgressState = { version: 1, status: 'ready' | 'degraded', issues: string[], courses: { [courseId]: Snapshot },
 *                     writeFailure: { at: number, kind: 'quota' | 'other' } | null }
 *
 * - Η δημιουργία ΔΕΝ γράφει τίποτα. Καμία εγγραφή χωρίς ενέργεια του χρήστη.
 * - `getSnapshot()` επιστρέφει το ΙΔΙΟ αντικείμενο μέχρι την επόμενη πραγματική αλλαγή (useSyncExternalStore).
 *   Κάθε αλλαγή φτιάχνει νέο root· το προηγούμενο δεν τροποποιείται (deep-frozen).
 * - Αλλαγή που δεν αλλάζει τίποτα (π.χ. κάρτα που ήδη είδε) → καμία εγγραφή, κανένα notify.
 * - Degraded (κατεστραμμένα δεδομένα / αμφίβολη ανάκτηση): καμία εγγραφή, ποτέ «μηδενικά που αποθηκεύονται»·
 *   η μελέτη συνεχίζει χωρίς αποθήκευση.
 * - Εκκρεμές σημάδι συναλλαγής κατά τη λειτουργία (`backend.pending()`, μετά από αποτυχημένο rollback): η εγγραφή
 *   απορρίπτεται και το service περνά σε degraded ΧΩΡΙΣ να εφαρμόσει την αλλαγή στη μνήμη (κανένα «αποθηκεύτηκε»).
 *   Μένει το τελευταίο snapshot πριν από την ενέργεια — αυτό που θα επαναφέρει η ανάκτηση στην επόμενη εκκίνηση.
 *   Fail-closed: αν ο ίδιος ο έλεγχος του σημαδιού αποτύχει, ισχύει το ίδιο (degraded), χωρίς εξαίρεση προς τον καλούντα.
 * - Αποτυχία εγγραφής ΧΩΡΙΣ εκκρεμές σημάδι (Φάση 2, π.χ. quota): η αλλαγή ΔΕΝ εφαρμόζεται (μνήμη ≡ storage), `false`,
 *   το status μένει `ready` και καταγράφεται `writeFailure`. Η επόμενη ενέργεια αποθηκεύει ΜΟΝΟ τη δική της αλλαγή — η
 *   αποτυχημένη δεν επαναλαμβάνεται αυτόματα. Το `writeFailure` καθαρίζει με πραγματικά επιτυχημένη εγγραφή ή με
 *   `dismissWriteFailure()` (που απλώς κρύβει την ειδοποίηση). Προγραμματιστικά σφάλματα πετούν όπως πριν.
 * - Δεν ξέρει τίποτα για shadow events ή baseline: ο shadow recorder μένει στους handlers (1E-3).
 */
import { toGlobalId } from '../academic/ids.js'
import { emptySnapshot, legacyToSnapshot, snapshotToLegacy, validateSnapshot } from './snapshot.js'

export const PROGRESS_STATE_VERSION = 1
/** Ίδιο όριο με το legacy wrongBook (τα παλαιότερα φεύγουν πρώτα). */
export const WRONG_BOOK_LIMIT = 60
/** Αποτελέσματα του recoverInterrupted που αφήνουν αμφίβολη κατάσταση → degraded. */
const UNSAFE_RECOVERY = new Set(['failed', 'corrupt-marker'])
const PENDING_ISSUE = 'μη ολοκληρωμένη αλλαγή αποθήκευσης· η ανάκτηση γίνεται στην επόμενη φόρτωση της σελίδας'
/** Αναγνωρίσιμα στοιχεία σφάλματος «γεμάτος χώρος» (name/code) — ποτέ το κείμενο του μηνύματος. */
const QUOTA_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])
const QUOTA_CODES = new Set([22, 1014])
/** Τυλιγμένα σφάλματα συναλλαγής δεν κρατούν την αρχική αιτία → `other`. */
const failureKind = (e) => (QUOTA_NAMES.has(e?.name) || QUOTA_CODES.has(e?.code) ? 'quota' : 'other')
const PENDING_UNKNOWN_ISSUE = 'δεν ήταν δυνατός ο έλεγχος για μη ολοκληρωμένη αλλαγή αποθήκευσης· καμία εγγραφή μέχρι την επόμενη φόρτωση της σελίδας'

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
 *   backend: {
 *     read: () => Record<string, string>,
 *     write: (changes: Record<string, string>) => void,   // πετάει αν η εγγραφή απορριφθεί/αποτύχει
 *     pending?: () => boolean,  // εκκρεμεί σημάδι συναλλαγής (ανάκτηση στην επόμενη εκκίνηση)· αν πετάξει → fail-closed (degraded)
 *   },
 *   recovery?: { status: string },                           // αποτέλεσμα του recoverInterrupted
 *   newUid?: () => string,
 *   warn?: (...a: unknown[]) => void,
 *   now?: () => number,                                      // χρόνος του writeFailure
 * }} opts
 */
export function createProgressService({
  courseId,
  content,
  backend,
  recovery = { status: 'none' },
  newUid = defaultUid,
  warn = () => {},
  now = () => Date.now(),
}) {
  created += 1
  const listeners = new Set()
  /** Τελευταίες γνωστές raw τιμές (για διατήρηση ό,τι δεν ανήκει στο snapshot μέσα σε κοινά κλειδιά). */
  let raw = {}

  const freezeState = (s) => deepFreeze({ version: PROGRESS_STATE_VERSION, writeFailure: null, ...s })
  const degraded = (issues) => {
    raw = {}
    return freezeState({ status: 'degraded', issues, courses: { [courseId]: emptySnapshot(courseId) } })
  }

  /**
   * Εμποδίζονται οι εγγραφές; Fail-closed: αν ο έλεγχος του σημαδιού συναλλαγής αποτύχει (π.χ. το storage πετάει),
   * η κατάσταση θεωρείται άγνωστη → ναι. Επιστρέφει το μήνυμα του degraded ή null. Ποτέ δεν πετάει.
   */
  function writesBlocked() {
    try {
      return backend.pending?.() ? PENDING_ISSUE : null
    } catch {
      return PENDING_UNKNOWN_ISSUE
    }
  }

  function load() {
    if (UNSAFE_RECOVERY.has(recovery?.status)) return degraded([`ανάκτηση μετά από διακοπή: ${recovery.status}`])
    const blocked = writesBlocked()
    if (blocked) return degraded([blocked])
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
        warn('[progress] η αποθήκευση απέτυχε:', e?.message ?? e)
        // Εκκρεμεί ανάκτηση (σημάδι συναλλαγής) ή ο έλεγχος δεν είναι δυνατός: degraded, η αλλαγή ΔΕΝ εφαρμόζεται,
        // καμία εγγραφή μέχρι το reload.
        const blocked = writesBlocked()
        if (blocked) {
          state = freezeState({ ...state, status: 'degraded', issues: [blocked] })
          notify()
          return false
        }
        // Αλλιώς (Φάση 2): η αλλαγή ΔΕΝ εφαρμόζεται — καμία ψευδής ένδειξη αποθήκευσης· ready, ειδοποίηση.
        state = freezeState({ ...state, writeFailure: { at: now(), kind: failureKind(e) } })
        notify()
        return false
      }
      // Πραγματικά επιτυχημένη εγγραφή → η ειδοποίηση φεύγει (no-op ενέργειες δεν φτάνουν εδώ).
      state = freezeState({ ...state, writeFailure: null, courses: { ...state.courses, [courseId]: next } })
      notify()
      return true
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
     * `wrong.uid` (1E-4c-2): αν δοθεί, χρησιμοποιείται αυτό (ίδιο με τον shadow recorder)· αλλιώς νέο.
     * @param {{ questionId: string, ok: boolean, wrong?: { uid?: string, question: string, explanation: string, userLabel: string, correctLabel: string } }} a
     */
    answerQuestion({ questionId, ok, wrong }) {
      const s = current()
      if (!s) return false
      const group = content.groupOf(questionId)
      if (typeof group !== 'string') throw new Error(`ProgressService: άγνωστη ερώτηση «${questionId}»`)
      const g = s.byGroup[group] ?? { correct: 0, wrong: 0 }
      let wrongBook = s.wrongBook
      if (!ok) {
        const { uid, question, explanation, userLabel, correctLabel } = wrong ?? {}
        wrongBook = [...s.wrongBook, { uid: typeof uid === 'string' && uid ? uid : newUid(), item: toGlobalId(courseId, questionId), group, question, explanation, userLabel, correctLabel, t: null }]
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

    /** Κρύβει την ειδοποίηση αποτυχίας αποθήκευσης. ΔΕΝ σημαίνει ότι η αλλαγή αποθηκεύτηκε· snapshot/storage ίδια. */
    dismissWriteFailure() {
      if (!state.writeFailure) return
      state = freezeState({ ...state, writeFailure: null })
      notify()
    },

    /** Ξαναδιαβάζει το backend μετά από εγγραφή υποδομής (reset). Νέο state, notify. */
    resync() {
      state = load()
      notify()
    },
  })
}
