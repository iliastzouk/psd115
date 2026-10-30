/**
 * ProgressService πολλών μαθημάτων πάνω στο νέο store (Φάση 6a) — η ΜΟΝΗ runtime πηγή αλήθειας για την πρόοδο.
 * Χωρίς React ή DOM· το storage δίνεται ως εξάρτηση. Δημιουργείται ΜΙΑ φορά (main.jsx), πριν από το πρώτο render.
 *
 *   storage → store core (readSync) → parseStoreData → courseProgress ανά μάθημα → ΕΝΑ immutable ProgressState
 *   forCourse(c).ενέργεια → φρέσκια ανάγνωση → αλλαγή (events + state) → commitSync → ξανά ανάγνωση → νέο state → notify
 *
 *   ProgressState = { version: 1, status: 'ready' | 'degraded', reason: null | 'corrupt' | 'pending' | 'unrecoverable' | 'no-storage',
 *                     issues: string[], warnings: string[], writeFailure: { at, kind: 'quota' | 'other' } | null,
 *                     courses: { [courseId]: Snapshot },          // μόνο μαθήματα σε ready
 *                     unavailable: { [courseId]: string[] } }     // J4: μόνο αυτό το μάθημα δεν διαβάζεται με ασφάλεια
 *
 * Εγγυήσεις (μεταφέρονται από τις Φάσεις 1–3 του legacy service):
 * - Η δημιουργία ΔΕΝ γράφει τίποτα. Καμία εγγραφή χωρίς ενέργεια του χρήστη· κανένα namespace δεν δημιουργείται στην εκκίνηση.
 * - `getSnapshot()` = ΙΔΙΟ αντικείμενο μέχρι την επόμενη πραγματική αλλαγή (deep-frozen, useSyncExternalStore).
 * - Ενέργεια που δεν αλλάζει τίποτα (π.χ. κάρτα που ήδη είδε) → καμία εγγραφή, κανένα notify.
 * - Global degraded (J4): άκυρο JSON / schema / διπλό id / μη global item, σημάδι συναλλαγής (ή αδύνατος έλεγχος, fail-closed),
 *   μη ασφαλής ανάκτηση → καμία εγγραφή για κανένα μάθημα· ποτέ «μηδενικά που αποθηκεύονται».
 * - Unavailable (J4): άκυρο namespace ή event λάθος τύπου ενός μαθήματος → μόνο αυτό το μάθημα χωρίς πρόοδο και ενέργειες.
 *   Οι εγγραφές άλλων μαθημάτων αλλάζουν μόνο τα δικά τους κλειδιά· τα δεδομένα του μένουν ίδια σε τιμή.
 * - Αποτυχία εγγραφής χωρίς σημάδι (Φάση 2): η αλλαγή ΔΕΝ εφαρμόζεται, `false`, status `ready`, `writeFailure`. Καθαρίζει
 *   μόνο όταν ΟΛΕΣ οι αλλαγές που απέτυχαν έχουν πλέον γίνει (ο χρήστης τις επανέλαβε) ή με `dismissWriteFailure()`.
 * - Πολλά tabs (Φάση 3): κάθε ενέργεια ξαναδιαβάζει πρώτα το storage· `refresh()` μόνο διαβάζει. Χωρίς cross-tab lock: δύο
 *   πραγματικά ταυτόχρονες εγγραφές μπορούν ακόμα να χάσουν μία αλλαγή (docs §20).
 * - Χρόνοι (J5): ένα `t` ανά λογική ενέργεια = max(now, reset, H_c + 1)· αυστηρά αυξανόμενος χρόνος καταγραφής ανά μάθημα.
 */
import { toGlobalId } from '../academic/ids.js'
import { newEventId } from './events.js'
import { checklistsStateKey, wrongBookStateKey } from './namespaces.js'
import { createStoreCore, ProgressStoreError } from './progressStore.js'
import {
  CHECKLISTS_VERSION,
  WRONG_BOOK_VERSION,
  canonicalWrongBook,
  courseNamespaces,
  courseProgress,
  nextTime,
  parseStoreData,
} from './courseProgress.js'

export const PROGRESS_STATE_VERSION = 1
/** Αποτελέσματα του recoverInterrupted που αφήνουν αμφίβολη κατάσταση → degraded (`unrecoverable`). */
const UNSAFE_RECOVERY = new Set(['failed', 'corrupt-marker'])
const QUOTA_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])
const QUOTA_CODES = new Set([22, 1014])
const failureKind = (e) => {
  const c = e?.cause ?? e
  return QUOTA_NAMES.has(c?.name) || QUOTA_CODES.has(c?.code) ? 'quota' : 'other'
}

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o)
    for (const v of Object.values(o)) deepFreeze(v)
  }
  return o
}
const sameItems = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])

let created = 0
/** Πόσα services δημιουργήθηκαν σε αυτό το runtime (για το smoke: πρέπει να είναι 1). */
export const createdServiceCount = () => created

/**
 * @param {{
 *   adapters: Record<string, import('./contentAdapter.js').ContentAdapter>,   // ένα ανά υποστηριζόμενο μάθημα
 *   storage: Storage,
 *   recovery?: { status: string },          // αποτέλεσμα του recoverInterrupted (εκκίνηση)
 *   now?: () => number,
 *   newId?: () => string,                   // ids των events
 *   newUid?: () => string,                  // uid εγγραφής wrongBook όταν δεν δίνεται
 *   warn?: (...a: unknown[]) => void,
 * }} opts
 */
export function createStoreProgressService({ adapters, storage, recovery = { status: 'none' }, now = () => Date.now(), newId = newEventId, newUid = newEventId, warn = () => {} }) {
  created += 1
  let core = null
  try {
    core = createStoreCore(storage, { now })
  } catch {
    /* χωρίς storage (π.χ. αποκλεισμένο localStorage): degraded, η μελέτη συνεχίζει χωρίς αποθήκευση */
  }
  const listeners = new Set()
  /** Ανά μάθημα σε ready: { resetAt, high, visible } της τελευταίας ανάγνωσης (εσωτερικό· όχι στο state). */
  let details = {}
  /** Αλλαγές που απέτυχαν (Φάση 2): `{ courseId, done(detail, snapshot) → boolean, failure }`. */
  let unsaved = []

  const freezeState = (s) =>
    deepFreeze({ version: PROGRESS_STATE_VERSION, status: 'ready', reason: null, issues: [], warnings: [], writeFailure: null, courses: {}, unavailable: {}, ...s })
  const degraded = (reason, issues) => {
    details = {}
    return freezeState({ status: 'degraded', reason, issues })
  }

  /** Εκκρεμεί (ή είναι κατεστραμμένο) σημάδι συναλλαγής; Fail-closed: αν ο έλεγχος αποτύχει, ναι. Ποτέ δεν πετάει. */
  function blocked() {
    try {
      return core.pending() ? 'μη ολοκληρωμένη αλλαγή αποθήκευσης· η ανάκτηση γίνεται στην επόμενη φόρτωση της σελίδας' : null
    } catch {
      return 'δεν ήταν δυνατός ο έλεγχος για μη ολοκληρωμένη αλλαγή αποθήκευσης· καμία εγγραφή μέχρι την επόμενη φόρτωση της σελίδας'
    }
  }

  /** Ανάγνωση + επικύρωση (ίδια για τη φόρτωση και για κάθε φρέσκια ανάγνωση). Μόνο ανάγνωση. */
  function readStored() {
    if (!core) return { ok: false, reason: 'no-storage', issues: ['δεν υπάρχει διαθέσιμος χώρος αποθήκευσης στον browser'] }
    const b = blocked()
    if (b) return { ok: false, reason: 'pending', issues: [b] }
    let data
    try {
      data = core.readSync()
    } catch (e) {
      return { ok: false, reason: 'corrupt', issues: [e instanceof ProgressStoreError ? e.message : `ανάγνωση: ${e?.message ?? e}`] }
    }
    const parsed = parseStoreData(data)
    if (!parsed.ok) return { ok: false, reason: 'corrupt', issues: parsed.issues }
    const courses = {}
    const unavailable = {}
    const nextDetails = {}
    const warnings = [...parsed.warnings]
    for (const [courseId, content] of Object.entries(adapters)) {
      const r = courseProgress({ courseId, content, events: parsed.byCourse.get(courseId) ?? [], state: data.state })
      warnings.push(...r.warnings.map((w) => `${courseId}: ${w}`))
      if (r.status === 'ready') {
        courses[courseId] = r.snapshot
        nextDetails[courseId] = { resetAt: r.resetAt, high: r.high, visible: r.visible }
      } else unavailable[courseId] = r.issues
    }
    for (const courseId of parsed.byCourse.keys()) {
      if (!Object.hasOwn(adapters, courseId)) warnings.push(`${courseId}: events μαθήματος χωρίς υποστήριξη προόδου (κρατιούνται, δεν μετρούν)`)
    }
    return { ok: true, courses, unavailable, details: nextDetails, warnings }
  }

  function load() {
    if (UNSAFE_RECOVERY.has(recovery?.status)) return degraded('unrecoverable', [`ανάκτηση μετά από διακοπή: ${recovery.status}`])
    const r = readStored()
    if (!r.ok) return degraded(r.reason, r.issues)
    details = r.details
    return freezeState({ courses: r.courses, unavailable: r.unavailable, warnings: r.warnings })
  }

  let state = load()

  function notify() {
    for (const listener of [...listeners]) listener()
  }

  const sameView = (r) =>
    JSON.stringify([r.courses, r.unavailable]) === JSON.stringify([state.courses, state.unavailable])

  /**
   * Φέρνει τη μνήμη στην τρέχουσα αποθηκευμένη κατάσταση. Μόνο ανάγνωση. Αποτυχία → degraded (κρατά το reason), notify.
   * Notify μόνο σε πραγματική αλλαγή. Το `writeFailure` δεν αγγίζεται.
   * @returns {boolean} αν το state είναι ready μετά την ανάγνωση
   */
  function syncFromStorage() {
    if (state.status !== 'ready') return false
    const r = readStored()
    if (!r.ok) {
      state = degraded(r.reason, r.issues)
      notify()
      return false
    }
    details = r.details
    if (!sameView(r)) {
      state = freezeState({ ...state, courses: r.courses, unavailable: r.unavailable, warnings: r.warnings })
      notify()
    }
    return true
  }

  /**
   * Γράφει μια αλλαγή ενός μαθήματος. `done(detail, snapshot)`: αν το αποτέλεσμα της αλλαγής ισχύει πλέον (Φάση 2).
   * @returns {boolean} αν αποθηκεύτηκε
   */
  function commit(courseId, change, done) {
    try {
      core.commitSync(change)
    } catch (e) {
      // Προγραμματιστικό σφάλμα (άκυρο event που φτιάξαμε εμείς κ.λπ.) → πετάει. Αποτυχία εγγραφής → Φάση 2 ή degraded.
      if (!(e instanceof ProgressStoreError) || (!e.outcome && e.code !== 'boundary')) throw e
      warn('[progress] η αποθήκευση απέτυχε:', e.message)
      const b = blocked()
      if (b) {
        state = degraded('pending', [b])
        notify()
        return false
      }
      const failure = deepFreeze({ at: now(), kind: failureKind(e) })
      unsaved = [...unsaved, { courseId, done, failure }]
      state = freezeState({ ...state, writeFailure: failure })
      notify()
      return false
    }
    const r = readStored()
    if (!r.ok) {
      state = degraded(r.reason, r.issues)
      notify()
      return true
    }
    details = r.details
    // Η ειδοποίηση φεύγει ΜΟΝΟ όταν όλες οι αλλαγές που απέτυχαν έχουν πλέον γίνει — όχι επειδή πέτυχε άσχετη εγγραφή.
    unsaved = unsaved.filter((u) => !(details[u.courseId] && u.done(details[u.courseId], r.courses[u.courseId])))
    const writeFailure = unsaved.length ? unsaved[unsaved.length - 1].failure : null
    state = freezeState({ ...state, writeFailure, courses: r.courses, unavailable: r.unavailable, warnings: r.warnings })
    notify()
    return true
  }

  const answerCount = (detail, item, ok) => detail.visible.filter((e) => e.kind === 'answer' && e.ctx === 'quiz' && e.item === item && e.ok === ok).length

  /** Το μάθημα σε ready μετά από φρέσκια ανάγνωση: { snapshot, detail } ή null (καμία ενέργεια). */
  function fresh(courseId) {
    if (!syncFromStorage()) return null
    const snapshot = state.courses[courseId]
    return snapshot ? { snapshot, detail: details[courseId] } : null
  }

  const timeFor = (detail) => nextTime({ now: now(), resetAt: detail.resetAt, high: detail.high })

  function actionsFor(courseId) {
    const content = adapters[courseId]
    const wbKey = wrongBookStateKey(courseId)
    const clKey = checklistsStateKey(courseId)
    return Object.freeze({
      /**
       * Μία απάντηση στο κεντρικό κουίζ. Λάθος → και εγγραφή wrongBook, στο ΙΔΙΟ atomic commit και με το ΙΔΙΟ `t`.
       * Άγνωστη ερώτηση του μαθήματος → false, χωρίς εγγραφή.
       */
      answerQuestion({ questionId, ok, wrong }) {
        if (!content.isQuestion(questionId)) return false
        const cur = fresh(courseId)
        if (!cur) return false
        const t = timeFor(cur.detail)
        const item = toGlobalId(courseId, questionId)
        const okBit = ok ? 1 : 0
        const event = { id: newId(), t, item, kind: 'answer', ok: okBit, ctx: 'quiz' }
        const change = { events: [event] }
        if (!ok) {
          const { uid, question = '', explanation = '', userLabel = '', correctLabel = '' } = wrong ?? {}
          const entry = { uid: typeof uid === 'string' && uid ? uid : newUid(), item, group: content.groupOf(questionId), question, explanation, userLabel, correctLabel, t }
          const ns = courseNamespaces(courseId, core.readState())
          change.state = { [wbKey]: { version: WRONG_BOOK_VERSION, entries: canonicalWrongBook([...ns.wrongBook, entry], { resetAt: cur.detail.resetAt }) } }
        }
        const n0 = answerCount(cur.detail, item, okBit)
        return commit(courseId, change, (d) => answerCount(d, item, okBit) > n0)
      },

      /** «Επόμενη κάρτα»: η κάρτα μπαίνει στο σύνολο των καρτών που είδε, μία φορά. Άγνωστη κάρτα → false. */
      markCardSeen(cardId) {
        if (!content.isCard(cardId)) return false
        const cur = fresh(courseId)
        if (!cur) return false
        const item = toGlobalId(courseId, cardId)
        if (cur.snapshot.flashcardSeenIds.includes(item)) return false
        const event = { id: newId(), t: timeFor(cur.detail), item, kind: 'flip', ctx: 'flash' }
        return commit(courseId, { events: [event] }, (_d, s) => Boolean(s?.flashcardSeenIds.includes(item)))
      },

      removeWrong(uid) {
        const cur = fresh(courseId)
        if (!cur || !cur.snapshot.wrongBook.some((w) => w.uid === uid)) return false
        const entries = cur.snapshot.wrongBook.filter((w) => w.uid !== uid).map((w) => ({ ...w }))
        return commit(courseId, { state: { [wbKey]: { version: WRONG_BOOK_VERSION, entries } } }, (_d, s) => Boolean(s && !s.wrongBook.some((w) => w.uid === uid)))
      },

      clearWrongBook() {
        const cur = fresh(courseId)
        if (!cur || !cur.snapshot.wrongBook.length) return false
        return commit(courseId, { state: { [wbKey]: { version: WRONG_BOOK_VERSION, entries: [] } } }, (_d, s) => Boolean(s && !s.wrongBook.length))
      },

      /** @param {string} topicId canonical @param {boolean[]} items */
      setChecklist(topicId, items) {
        if (!content.hasTopic(topicId)) throw new Error(`ProgressService: άγνωστο θέμα «${topicId}»`)
        if (!Array.isArray(items) || !items.every((x) => typeof x === 'boolean')) throw new Error('ProgressService: checklist = πίνακας true/false')
        const cur = fresh(courseId)
        if (!cur) return false
        const prev = cur.snapshot.checklists[topicId]?.items
        if (prev && sameItems(prev, items)) return false
        const ns = courseNamespaces(courseId, core.readState())
        // Μόνο τα θέματα που ισχύουν μετά το reset μένουν· ένα `t` για την αλλαγή.
        const topics = Object.fromEntries(Object.entries(ns.checklists).filter(([, v]) => v.t >= cur.detail.resetAt))
        topics[topicId] = { items: [...items], t: timeFor(cur.detail) }
        return commit(courseId, { state: { [clKey]: { version: CHECKLISTS_VERSION, topics } } }, (_d, s) => Boolean(s?.checklists[topicId] && sameItems(s.checklists[topicId].items, items)))
      },
    })
  }

  const scoped = new Map()
  const supports = (courseId) => typeof courseId === 'string' && Object.hasOwn(adapters, courseId)

  return Object.freeze({
    getSnapshot: () => state,

    /** @param {() => void} listener @returns {() => void} */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    /** Μαθήματα που εξυπηρετεί (ένα ανά adapter). */
    courseIds: Object.freeze(Object.keys(adapters)),
    /** Οι content adapters (για reset / import, που χρειάζονται τους ίδιους κανόνες). */
    adapters,
    supports,

    /**
     * J1: οι ενέργειες ΕΝΟΣ μαθήματος. Καμία ενέργεια δεν δέχεται courseId, άρα δεν μπορεί να γράψει σε άλλο μάθημα.
     * Μάθημα που δεν εξυπηρετείται → σφάλμα.
     */
    forCourse(courseId) {
      if (!supports(courseId)) throw new Error(`ProgressService: το μάθημα «${courseId}» δεν εξυπηρετείται`)
      if (!scoped.has(courseId)) scoped.set(courseId, actionsFor(courseId))
      return scoped.get(courseId)
    },

    /** Κρύβει την ειδοποίηση αποτυχίας αποθήκευσης. ΔΕΝ σημαίνει ότι η αλλαγή αποθηκεύτηκε· snapshot/storage ίδια. */
    dismissWriteFailure() {
      if (!state.writeFailure) return
      unsaved = []
      state = freezeState({ ...state, writeFailure: null })
      notify()
    },

    /** Ξαναδιαβάζει το storage (π.χ. αλλαγή από άλλο tab). Μόνο ανάγνωση. @returns {boolean} αν άλλαξε το state */
    refresh() {
      const before = state
      syncFromStorage()
      return state !== before
    },

    /** Μετά από εγγραφή υποδομής (reset, import, αντικατάσταση): νέα ανάγνωση από την αρχή, notify. */
    resync() {
      unsaved = []
      state = load()
      notify()
    },
  })
}
