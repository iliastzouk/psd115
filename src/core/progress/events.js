/**
 * Schema και έλεγχος των progress events (append-only log).
 * Pure JS, χωρίς browser APIs — τρέχει και σε Node (tests).
 *
 * Canonical shape:
 *   { id, t, item, kind, ok?, grade?, conf?, ctx, session? }
 *
 * Το log είναι η μοναδική πηγή αλήθειας για απαντήσεις/κάρτες/αυτοαξιολόγηση.
 * Παράγωγες τιμές (ακρίβεια, mastery, weak topics, σύνολα) ΔΕΝ αποθηκεύονται — υπολογίζονται.
 */

export const EVENT_KINDS = /** @type {const} */ (['answer', 'flip', 'self'])
export const EVENT_CONTEXTS = /** @type {const} */ (['quiz', 'lesson', 'flash', 'exam', 'review'])

const FIELDS = new Set(['id', 't', 'item', 'kind', 'ok', 'grade', 'conf', 'ctx', 'session'])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

/**
 * 2020-01-01 UTC σε ms. Σταθερό κάτω όριο (δεν εξαρτάται από την τρέχουσα ώρα): πιάνει
 * timestamps σε δευτερόλεπτα αντί για ms. Δεν υπάρχει άνω όριο — ένα event με ρολόι
 * συσκευής στο μέλλον παραμένει έγκυρο δεδομένο.
 */
const MIN_T = Date.UTC(2020, 0, 1)

/**
 * Υποχρεωτικά: id, t, item, kind, ctx. Προαιρετικά: ok, grade, conf, session.
 * Μόνο δομικός έλεγχος — κανένας κανόνας για το ποια προαιρετικά πεδία «πρέπει» να έχει κάθε kind.
 * @typedef {{
 *   id: string,
 *   t: number,
 *   item: string,
 *   kind: 'answer' | 'flip' | 'self',
 *   ok?: 0 | 1,
 *   grade?: 0 | 1 | 2 | 3,
 *   conf?: 1 | 2 | 3,
 *   ctx: 'quiz' | 'lesson' | 'flash' | 'exam' | 'review',
 *   session?: string,
 * }} ProgressEvent
 */

/**
 * @param {unknown} ev
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateEvent(ev) {
  const errors = []
  if (ev === null || typeof ev !== 'object' || Array.isArray(ev)) return { ok: false, errors: ['το event πρέπει να είναι αντικείμενο'] }

  for (const k of Object.keys(ev)) if (!FIELDS.has(k)) errors.push(`άγνωστο πεδίο «${k}»`)

  if (typeof ev.id !== 'string' || !UUID_RE.test(ev.id)) errors.push('id: αναμενόταν UUID')
  if (!Number.isSafeInteger(ev.t) || ev.t < MIN_T) errors.push('t: αναμενόταν Unix timestamp σε ms (ακέραιος, από 2020)')
  // Το ακριβές format του global ID θα οριστεί στο Phase 1· εδώ μόνο σταθερό, μη κενό string.
  if (typeof ev.item !== 'string' || ev.item.trim() === '' || ev.item !== ev.item.trim()) {
    errors.push('item: αναμενόταν μη κενό string χωρίς κενά στην αρχή/τέλος')
  }
  if (!EVENT_KINDS.includes(ev.kind)) errors.push(`kind: επιτρέπονται ${EVENT_KINDS.join(', ')}`)
  if (!EVENT_CONTEXTS.includes(ev.ctx)) errors.push(`ctx: επιτρέπονται ${EVENT_CONTEXTS.join(', ')}`)

  if ('ok' in ev && ev.ok !== 0 && ev.ok !== 1) errors.push('ok: επιτρέπονται 0 ή 1')
  if ('grade' in ev && ![0, 1, 2, 3].includes(ev.grade)) errors.push('grade: επιτρέπονται 0–3')
  if ('conf' in ev && ![1, 2, 3].includes(ev.conf)) errors.push('conf: επιτρέπονται 1–3')
  if ('session' in ev && (typeof ev.session !== 'string' || !SESSION_RE.test(ev.session))) {
    errors.push('session: αναμενόταν σύντομο αναγνωριστικό')
  }

  return errors.length ? { ok: false, errors } : { ok: true }
}

export function newEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  // Fallback (παλιοί browsers): UUID v4 από Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** Δύο events με ίδιο id είναι «ίδια» μόνο αν έχουν ακριβώς τα ίδια πεδία. */
export function sameEvent(a, b) {
  const ka = Object.keys(a).sort()
  const kb = Object.keys(b).sort()
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k])
}
