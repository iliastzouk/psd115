/**
 * Shadow mode (Phase 1E-3): οι πραγματικές ενέργειες γράφονται ΚΑΙ ως events στο νέο store.
 * Το legacy (`psd115-*`) παραμένει η μόνη πηγή του UI· το νέο store δεν διαβάζεται από την εφαρμογή.
 *
 * Τρεις πύλες — χωρίς οποιαδήποτε από αυτές: καμία ανάγνωση/εγγραφή στο νέο store:
 *   1. build flag (LEGACY_PROGRESS_SHADOW_ENABLED, false· μόνο το ειδικό smoke build το ανοίγει)
 *   2. υπάρχει σημάδι migration (όριο: δεν γράφονται events πριν από το baseline)
 *   3. runtime κατάσταση `shadow:psd115.enabled === true` (ενεργοποίηση/απενεργοποίηση χωρίς build)
 *
 * 1E-4c-2: και τα wrongBook / checklists (state namespaces) καθρεφτίζονται, στο ίδιο atomic commit με το event.
 *
 * Σειρά: το event γράφεται ΣΥΓΧΡΟΝΑ μέσα στον handler του κλικ (το `append` εκτελείται αμέσως), πριν το
 * React γράψει το legacy αντικείμενο (useEffect). Αποτυχία του event δεν επηρεάζει ΠΟΤΕ την ενέργεια του
 * χρήστη: καταγράφεται (best effort) στο `shadow:psd115` και φαίνεται στο reconciliation.
 * Καλείται από τον handler (όχι από setState updater/effect), ώστε το StrictMode να μη διπλασιάζει events.
 */
import { progressItem } from '../core/progress/items.js'
import { newEventId } from '../core/progress/events.js'
import { MIGRATION_MARKER_KEY, SHADOW_STATE_KEY } from '../core/progress/keys.js'
import { createProgressStore, STATE_KEY } from '../core/progress/progressStore.js'
import { CHECKLISTS_STATE_VERSION, checklistsStateKey, WRONG_BOOK_STATE_VERSION, wrongBookStateKey } from '../core/progress/namespaces.js'
import { WRONG_BOOK_LIMIT } from '../core/progress/progressService.js'

/** Build flag. Μένει false μέχρι την εγκεκριμένη ενεργοποίηση. */
export const LEGACY_PROGRESS_SHADOW_ENABLED = false
/** Μόνο για το ειδικό smoke build (VITE_PROGRESS_SHADOW_SMOKE=1)· στο production build είναι σταθερά false. */
const SMOKE_BUILD = import.meta.env?.VITE_PROGRESS_SHADOW_SMOKE === '1'
export const SHADOW_BUILD_ENABLED = LEGACY_PROGRESS_SHADOW_ENABLED || SMOKE_BUILD

const MAX_RECENT_FAILURES = 20

/**
 * Το μάθημα και το περιεχόμενό του δίνονται ως παράμετροι (content adapter): ο recorder δεν ξέρει κανένα μάθημα.
 *
 * Mirror (1E-4c-2): εκτός από τα events, ο recorder ενημερώνει και τα state namespaces wrongBook / checklists του
 * μαθήματος, στο ΙΔΙΟ atomic commit με το event (progressStore.commit). Τα namespaces δημιουργούνται ΜΟΝΟ από το
 * migration (υλοποίηση)· αν λείπουν, ο recorder αποτυγχάνει (F4) — ποτέ δεν τα φτιάχνει από το μηδέν.
 *
 * `isActive` (F5): όταν επιστρέφει false (π.χ. ProgressService σε degraded mode) ο recorder δεν διαβάζει ούτε γράφει.
 * @param {{ courseId: string, content: import('../core/progress/contentAdapter.js').ContentAdapter, storage?: Storage,
 *           now?: () => number, enabled?: boolean, isActive?: () => boolean, newId?: () => string,
 *           warn?: (...a: unknown[]) => void }} opts
 */
export function createShadowRecorder({
  courseId,
  content,
  storage,
  now = () => Date.now(),
  enabled = SHADOW_BUILD_ENABLED,
  isActive = () => true,
  newId = newEventId,
  warn = (...a) => console.warn('[progress shadow]', ...a),
} = {}) {
  const resolve = () => storage ?? globalThis.localStorage
  const wbKey = wrongBookStateKey(courseId)
  const clKey = checklistsStateKey(courseId)

  /** Καταγραφή αποτυχίας (best effort): ποτέ δεν πετάει. */
  async function noteFailure(st, action, item, err) {
    const message = String(err?.message ?? err).slice(0, 300)
    warn(action, item, message)
    try {
      const store = createProgressStore({ storage: st, now })
      const prev = (await store.getState(SHADOW_STATE_KEY)) ?? {}
      const recentFailures = [...(prev.recentFailures ?? []), { at: new Date(now()).toISOString(), action, item, error: message }].slice(-MAX_RECENT_FAILURES)
      await store.setState(SHADOW_STATE_KEY, { ...prev, failures: (prev.failures ?? 0) + 1, recentFailures })
    } catch {
      /* ούτε η καταγραφή είναι δυνατή (π.χ. κατεστραμμένο state)· το reconciliation θα δείξει την απόκλιση */
    }
  }

  /** Το namespace πρέπει να υπάρχει ήδη (υλοποιείται από το migration· F4). */
  function existing(state, key) {
    const value = state[key]
    if (value === undefined) throw new Error(`λείπει το «${key}» (δεν υλοποιήθηκε από το migration)`)
    return value
  }
  function wrongEntries(state) {
    const wb = existing(state, wbKey)
    if (wb?.version !== WRONG_BOOK_STATE_VERSION || !Array.isArray(wb.entries)) throw new Error(`«${wbKey}»: άκυρο σχήμα`)
    return wb.entries
  }
  function checklistTopics(state) {
    const cl = existing(state, clKey)
    if (cl?.version !== CHECKLISTS_STATE_VERSION || !cl.topics || typeof cl.topics !== 'object' || Array.isArray(cl.topics)) {
      throw new Error(`«${clKey}»: άκυρο σχήμα`)
    }
    return cl.topics
  }

  /**
   * `build(state)` → `{ events?, state? }` (ένα commit) ή `null` (τίποτα δεν αλλάζει).
   * @returns {Promise<{ status: 'disabled' | 'inactive' | 'unchanged' | 'recorded' | 'failed', event?: object, error?: string }>} ποτέ δεν απορρίπτεται
   */
  function record(action, item, build) {
    if (!enabled) return Promise.resolve({ status: 'disabled' })
    let st
    try {
      if (!isActive()) return Promise.resolve({ status: 'inactive' })
      st = resolve()
      const raw = st.getItem(STATE_KEY)
      const state = raw === null ? {} : JSON.parse(raw)
      if (!state[MIGRATION_MARKER_KEY] || state[SHADOW_STATE_KEY]?.enabled !== true) return Promise.resolve({ status: 'inactive' })
      const change = build(state)
      if (!change) return Promise.resolve({ status: 'unchanged' })
      // Το σώμα του commit τρέχει συγχρονικά: η εγγραφή (events + state μαζί) γίνεται ΤΩΡΑ, μέσα στον handler.
      return createProgressStore({ storage: st, now })
        .commit(change)
        .then(
          () => ({ status: 'recorded', event: change.events?.[0] }),
          async (err) => {
            await noteFailure(st, action, item, err)
            return { status: 'failed', error: String(err?.message ?? err) }
          },
        )
    } catch (err) {
      return (st ? noteFailure(st, action, item, err) : Promise.resolve()).then(() => ({ status: 'failed', error: String(err?.message ?? err) }))
    }
  }

  return {
    /**
     * Μία απάντηση στο κεντρικό κουίζ. `ok`: αν η απάντηση ήταν σωστή (όπως την υπολόγισε το legacy).
     * Λάθος → και εγγραφή στο wrongBook namespace με το ΙΔΙΟ `wrong.uid` που παίρνει το ProgressService (F1).
     */
    recordQuizAnswer({ questionId, ok, wrong }) {
      return record('quiz-answer', questionId, (state) => {
        if (!content.isQuestion(questionId)) throw new Error(`άγνωστη ερώτηση «${questionId}»`)
        const event = { id: newId(), t: now(), item: progressItem(courseId, questionId), kind: 'answer', ok: ok ? 1 : 0, ctx: 'quiz' }
        if (ok) return { events: [event] }
        const { uid, question, explanation, userLabel, correctLabel } = wrong ?? {}
        if (typeof uid !== 'string' || !uid) throw new Error('λάθος απάντηση χωρίς wrong.uid')
        const entries = [
          ...wrongEntries(state),
          { uid, item: event.item, group: content.groupOf(questionId), question, explanation, userLabel, correctLabel, t: event.t },
        ]
        while (entries.length > WRONG_BOOK_LIMIT) entries.shift()
        return { events: [event], state: { [wbKey]: { version: WRONG_BOOK_STATE_VERSION, entries } } }
      })
    },
    /**
     * «Επόμενη κάρτα» / «Από την αρχή»: η ΜΟΝΗ persisted ενέργεια καρτών (το γύρισμα δεν αποθηκεύεται).
     * Αντιστοιχεί σε `kind: 'flip'`, `ctx: 'flash'` — από όποια σελίδα κι αν γίνει (κάρτες ή μάθημα),
     * όπως και το legacy `flashcardSeenIds` είναι ένα κοινό σύνολο. Γράφεται σε κάθε πάτημα.
     */
    recordFlashcardSeen({ cardId }) {
      return record('card-seen', cardId, () => {
        if (!content.isCard(cardId)) throw new Error(`άγνωστη κάρτα «${cardId}»`)
        return { events: [{ id: newId(), t: now(), item: progressItem(courseId, cardId), kind: 'flip', ctx: 'flash' }] }
      })
    },
    /** Αφαίρεση μίας εγγραφής του wrongBook (μόνο state). */
    recordWrongBookRemove({ uid }) {
      return record('wrongbook-remove', uid, (state) => {
        const entries = wrongEntries(state)
        const next = entries.filter((e) => e.uid !== uid)
        return next.length === entries.length ? null : { state: { [wbKey]: { version: WRONG_BOOK_STATE_VERSION, entries: next } } }
      })
    },
    /** Άδειασμα του wrongBook (μόνο state). */
    recordWrongBookClear() {
      return record('wrongbook-clear', null, (state) =>
        wrongEntries(state).length ? { state: { [wbKey]: { version: WRONG_BOOK_STATE_VERSION, entries: [] } } } : null,
      )
    },
    /** Checklist ενός θέματος (μόνο state)· ίδιοι κανόνες με το ProgressService.setChecklist. */
    recordChecklist({ topicId, items }) {
      return record('checklist', topicId, (state) => {
        if (!content.hasTopic(topicId)) throw new Error(`άγνωστο θέμα «${topicId}»`)
        if (!Array.isArray(items) || !items.every((x) => typeof x === 'boolean')) throw new Error('checklist = πίνακας true/false')
        const topics = checklistTopics(state)
        const prev = topics[topicId]?.items
        if (prev && prev.length === items.length && prev.every((x, i) => x === items[i])) return null
        return { state: { [clKey]: { version: CHECKLISTS_STATE_VERSION, topics: { ...topics, [topicId]: { items: [...items] } } } } }
      })
    },
  }
}

// ---- Ο recorder της εφαρμογής: δημιουργείται και εγκαθίσταται ΜΙΑ φορά στο main.jsx (όπως το ProgressService). ----
let installed = null

/** Μόνο από το main.jsx, μία φορά. Δεύτερη κλήση → σφάλμα. */
export function installShadowRecorder(recorder) {
  if (installed) throw new Error('shadow recorder: έχει ήδη εγκατασταθεί')
  installed = recorder
}

const notInstalled = () => Promise.resolve({ status: 'disabled' })
/** Για την εφαρμογή (useStudySession). Με το build flag κλειστό: επιστρέφει αμέσως, χωρίς πρόσβαση στο storage. */
export const recordQuizAnswer = (args) => (installed ? installed.recordQuizAnswer(args) : notInstalled())
export const recordFlashcardSeen = (args) => (installed ? installed.recordFlashcardSeen(args) : notInstalled())
export const recordWrongBookRemove = (args) => (installed ? installed.recordWrongBookRemove(args) : notInstalled())
export const recordWrongBookClear = () => (installed ? installed.recordWrongBookClear() : notInstalled())
export const recordChecklist = (args) => (installed ? installed.recordChecklist(args) : notInstalled())
