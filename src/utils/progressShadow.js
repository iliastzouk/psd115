/**
 * Shadow mode (Phase 1E-3): οι πραγματικές ενέργειες γράφονται ΚΑΙ ως events στο νέο store.
 * Το legacy (`psd115-*`) παραμένει η μόνη πηγή του UI· το νέο store δεν διαβάζεται από την εφαρμογή.
 *
 * Τρεις πύλες — χωρίς οποιαδήποτε από αυτές: καμία ανάγνωση/εγγραφή στο νέο store:
 *   1. build flag (LEGACY_PROGRESS_SHADOW_ENABLED, false· μόνο το ειδικό smoke build το ανοίγει)
 *   2. υπάρχει σημάδι migration (όριο: δεν γράφονται events πριν από το baseline)
 *   3. runtime κατάσταση `shadow:psd115.enabled === true` (ενεργοποίηση/απενεργοποίηση χωρίς build)
 *
 * Σειρά: το event γράφεται ΣΥΓΧΡΟΝΑ μέσα στον handler του κλικ (το `append` εκτελείται αμέσως), πριν το
 * React γράψει το legacy αντικείμενο (useEffect). Αποτυχία του event δεν επηρεάζει ΠΟΤΕ την ενέργεια του
 * χρήστη: καταγράφεται (best effort) στο `shadow:psd115` και φαίνεται στο reconciliation.
 * Καλείται από τον handler (όχι από setState updater/effect), ώστε το StrictMode να μη διπλασιάζει events.
 */
import { flashcards, quizQuestions } from '../../content/courses/psd115/questions.js'
import { progressItem } from '../core/progress/items.js'
import { newEventId } from '../core/progress/events.js'
import { MIGRATION_MARKER_KEY, SHADOW_STATE_KEY } from '../core/progress/keys.js'
import { createProgressStore, STATE_KEY } from '../core/progress/progressStore.js'

/** Build flag. Μένει false μέχρι την εγκεκριμένη ενεργοποίηση. */
export const LEGACY_PROGRESS_SHADOW_ENABLED = false
/** Μόνο για το ειδικό smoke build (VITE_PROGRESS_SHADOW_SMOKE=1)· στο production build είναι σταθερά false. */
const SMOKE_BUILD = import.meta.env?.VITE_PROGRESS_SHADOW_SMOKE === '1'
export const SHADOW_BUILD_ENABLED = LEGACY_PROGRESS_SHADOW_ENABLED || SMOKE_BUILD

const COURSE_ID = 'psd115'
const MAX_RECENT_FAILURES = 20
const questionIds = new Set(quizQuestions.map((q) => q.id))
const cardIds = new Set(flashcards.map((c) => c.id))

/**
 * @param {{ storage?: Storage, now?: () => number, enabled?: boolean, newId?: () => string, warn?: (...a: unknown[]) => void }} [opts]
 */
export function createShadowRecorder({
  storage,
  now = () => Date.now(),
  enabled = SHADOW_BUILD_ENABLED,
  newId = newEventId,
  warn = (...a) => console.warn('[progress shadow]', ...a),
} = {}) {
  const resolve = () => storage ?? globalThis.localStorage

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

  /**
   * @returns {Promise<{ status: 'disabled' | 'inactive' | 'recorded' | 'failed', event?: object, error?: string }>} ποτέ δεν απορρίπτεται
   */
  function record(action, item, build) {
    if (!enabled) return Promise.resolve({ status: 'disabled' })
    let st
    try {
      st = resolve()
      const raw = st.getItem(STATE_KEY)
      const state = raw === null ? {} : JSON.parse(raw)
      if (!state[MIGRATION_MARKER_KEY] || state[SHADOW_STATE_KEY]?.enabled !== true) return Promise.resolve({ status: 'inactive' })
      const event = build()
      // Το σώμα του append τρέχει συγχρονικά: η εγγραφή γίνεται ΤΩΡΑ, μέσα στον handler.
      return createProgressStore({ storage: st, now })
        .append(event)
        .then(
          () => ({ status: 'recorded', event }),
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
    /** Μία απάντηση στο κεντρικό κουίζ. `ok`: αν η απάντηση ήταν σωστή (όπως την υπολόγισε το legacy). */
    recordQuizAnswer({ questionId, ok }) {
      return record('quiz-answer', questionId, () => {
        if (!questionIds.has(questionId)) throw new Error(`άγνωστη ερώτηση «${questionId}»`)
        return { id: newId(), t: now(), item: progressItem(COURSE_ID, questionId), kind: 'answer', ok: ok ? 1 : 0, ctx: 'quiz' }
      })
    },
    /**
     * «Επόμενη κάρτα» / «Από την αρχή»: η ΜΟΝΗ persisted ενέργεια καρτών (το γύρισμα δεν αποθηκεύεται).
     * Αντιστοιχεί σε `kind: 'flip'`, `ctx: 'flash'` — από όποια σελίδα κι αν γίνει (κάρτες ή μάθημα),
     * όπως και το legacy `flashcardSeenIds` είναι ένα κοινό σύνολο. Γράφεται σε κάθε πάτημα.
     */
    recordFlashcardSeen({ cardId }) {
      return record('card-seen', cardId, () => {
        if (!cardIds.has(cardId)) throw new Error(`άγνωστη κάρτα «${cardId}»`)
        return { id: newId(), t: now(), item: progressItem(COURSE_ID, cardId), kind: 'flip', ctx: 'flash' }
      })
    },
  }
}

const appRecorder = createShadowRecorder()
/** Για την εφαρμογή (useStudySession). Με το build flag κλειστό: επιστρέφει αμέσως, χωρίς πρόσβαση στο storage. */
export const recordQuizAnswer = (args) => appRecorder.recordQuizAnswer(args)
export const recordFlashcardSeen = (args) => appRecorder.recordFlashcardSeen(args)
