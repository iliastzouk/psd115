/**
 * Progress snapshot (Phase 1E-4a) — pure read model, ανεξάρτητο από μάθημα. Χωρίς storage, React ή URLs.
 *
 *   legacy entries                    → legacyToSnapshot()      → Snapshot
 *   baseline + events + state          → buildProgressSnapshot() → Snapshot
 *   Snapshot                           → snapshotToLegacy()      → legacy entries (projection)
 *   Snapshot                           → stateFromSnapshot()     → state namespaces (υλοποίηση wrongBook/checklists)
 *
 * Ό,τι αφορά συγκεκριμένο μάθημα (ομάδες, ερωτήσεις, κάρτες, θέματα, παλιά κλειδιά) έρχεται ΜΟΝΟ από το
 * content adapter (contentAdapter.js).
 *
 * Snapshot v1 (ένα ανά μάθημα):
 *   { format: 'progress-snapshot', version: 1, courseId,
 *     quizAnswered, quizCorrect,                       // derived (wrong = answered − correct)
 *     byGroup: { [groupId]: { correct, wrong } },      // derived· groupId = ό,τι δίνει το content adapter
 *     flashcardSeenIds: string[],                      // derived· GLOBAL IDs, σειρά πρώτης εμφάνισης
 *     wrongBook: WrongEntry[],                         // state
 *     checklists: { [topicId]: { items: boolean[] } } } // state, κλειδί το canonical topicId
 *
 *   WrongEntry = { uid, item (global), group (string | null), question, explanation, userLabel, correctLabel,
 *                  t (ms | null — null = άγνωστο, π.χ. παλιές εγγραφές· ΠΟΤΕ επινοημένο) }
 *
 * Κανόνες του buildProgressSnapshot:
 *  - κουίζ: baseline + `answer` events με ctx 'quiz' (μόνο). Ομάδα μέσω `content.groupOf`· άγνωστη → μετριέται
 *    στα σύνολα, όχι σε ομάδα.
 *  - κάρτες: baseline seen ∪ items των `flip` events με ctx 'flash'. Ίδια κάρτα ξανά → καμία αλλαγή.
 *  - wrongBook / checklists: από το state namespace του μαθήματος αν ΥΠΑΡΧΕΙ το κλειδί (ακόμα κι αν είναι κενό)·
 *    αν λείπει (πριν την υλοποίηση στο cutover) → του baseline. ΠΟΤΕ από answer events.
 *  - reset (`progress:reset:<courseId>`): αγνοούνται το baseline και τα events με t < at.
 *  - events άλλων μαθημάτων αγνοούνται· event πριν από το baseline → σφάλμα (δεν «χωράει» στο παρελθόν του).
 *  - ίδιο event (ίδιο id, ίδιο περιεχόμενο) μετριέται μία φορά· ίδιο id με άλλο περιεχόμενο → σφάλμα.
 * Κανένα input δεν τροποποιείται· άκυρα δεδομένα → `{ ok: false, errors }`, ποτέ σιωπηλή «διόρθωση».
 */
import { parseGlobalId, toGlobalId } from '../academic/ids.js'
import { sameEvent, validateEvent } from './events.js'
import { checkContentAdapter } from './contentAdapter.js'
import {
  CHECKLISTS_STATE_VERSION,
  WRONG_BOOK_STATE_VERSION,
  checklistsStateKey,
  resetStateKey,
  wrongBookStateKey,
} from './namespaces.js'

export const SNAPSHOT_FORMAT = 'progress-snapshot'
export const SNAPSHOT_VERSION = 1

/** Το παλιό σχήμα προόδου μελέτης της εφαρμογής (ένα αντικείμενο ανά μάθημα). */
const LEGACY_STUDY_FIELDS = ['quizAnswered', 'quizCorrect', 'byCategory', 'flashcardSeenIds', 'wrongBook']
const LEGACY_WRONG_FIELDS = ['uid', 'id', 'categoryId', 'question', 'explanation', 'userLabel', 'correctLabel']
const WRONG_TEXT_FIELDS = ['question', 'explanation', 'userLabel', 'correctLabel']
const WRONG_FIELDS = ['uid', 'item', 'group', ...WRONG_TEXT_FIELDS, 't']
const MIN_T = Date.UTC(2020, 0, 1)

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isCount = (v) => Number.isSafeInteger(v) && v >= 0
const isBoolArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'boolean')
const isTime = (v) => v === null || (Number.isSafeInteger(v) && v >= MIN_T)
const zeroCounts = () => ({ correct: 0, wrong: 0 })

/** @param {string} courseId */
export function emptySnapshot(courseId) {
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    courseId,
    quizAnswered: 0,
    quizCorrect: 0,
    byGroup: {},
    flashcardSeenIds: [],
    wrongBook: [],
    checklists: {},
  }
}

function parseTime(iso, where, errors) {
  const ms = typeof iso === 'string' ? Date.parse(iso) : NaN
  if (!Number.isFinite(ms)) errors.push(`${where}: αναμενόταν ημερομηνία ISO`)
  return ms
}

/** Έλεγχος περιεχομένου: strict → σφάλμα (εισαγωγή από legacy) · αλλιώς → warning και διατήρηση (ιστορικά δεδομένα). */
function contentIssue(strict, message, errors, warnings) {
  if (strict) errors.push(message)
  else warnings.push(`${message} (διατηρείται)`)
}

/**
 * Παλιό αντικείμενο προόδου → μέρη του snapshot (κουίζ, κάρτες, wrongBook). Ελέγχει τα πάντα· δεν «διορθώνει».
 */
function legacyStudyParts(study, { courseId, content, strict, where }, errors, warnings) {
  const parts = { quizAnswered: 0, quizCorrect: 0, byGroup: {}, flashcardSeenIds: [], wrongBook: [] }
  if (study === undefined) return parts
  if (!isObj(study)) {
    errors.push(`${where}: αναμενόταν αντικείμενο`)
    return parts
  }
  for (const k of Object.keys(study)) if (!LEGACY_STUDY_FIELDS.includes(k)) errors.push(`${where}: άγνωστο πεδίο «${k}»`)

  const answered = study.quizAnswered ?? 0
  const correct = study.quizCorrect ?? 0
  if (!isCount(answered)) errors.push(`${where}.quizAnswered: αναμενόταν μη αρνητικός ακέραιος`)
  if (!isCount(correct)) errors.push(`${where}.quizCorrect: αναμενόταν μη αρνητικός ακέραιος`)
  if (isCount(answered) && isCount(correct) && correct > answered) errors.push(`${where}: quizCorrect (${correct}) > quizAnswered (${answered})`)
  parts.quizAnswered = answered
  parts.quizCorrect = correct

  const byCategory = study.byCategory ?? {}
  if (!isObj(byCategory)) errors.push(`${where}.byCategory: αναμενόταν αντικείμενο`)
  else {
    let sumAll = 0
    let sumCorrect = 0
    for (const [group, s] of Object.entries(byCategory)) {
      if (!content.hasGroup(group)) contentIssue(strict, `${where}.byCategory: άγνωστη ομάδα «${group}»`, errors, warnings)
      if (!isObj(s) || Object.keys(s).some((k) => k !== 'correct' && k !== 'wrong') || !isCount(s.correct) || !isCount(s.wrong)) {
        errors.push(`${where}.byCategory.${group}: αναμενόταν { correct, wrong } μη αρνητικοί ακέραιοι`)
        continue
      }
      parts.byGroup[group] = { correct: s.correct, wrong: s.wrong }
      sumAll += s.correct + s.wrong
      sumCorrect += s.correct
    }
    // Ασυνέπεια αθροισμάτων: αναφέρεται, δεν «διορθώνεται» — διατηρούνται και τα δύο όπως είναι.
    if (sumAll !== answered || sumCorrect !== correct) {
      warnings.push(`${where}: τα αθροίσματα του byCategory (${sumCorrect}/${sumAll}) διαφέρουν από quizCorrect/quizAnswered (${correct}/${answered})`)
    }
  }

  const seen = study.flashcardSeenIds ?? []
  if (!Array.isArray(seen)) errors.push(`${where}.flashcardSeenIds: αναμενόταν πίνακας`)
  else {
    const dup = new Set()
    for (const id of seen) {
      if (typeof id !== 'string' || !id) {
        errors.push(`${where}.flashcardSeenIds: άκυρο id ${JSON.stringify(id)}`)
        continue
      }
      if (dup.has(id)) {
        errors.push(`${where}.flashcardSeenIds: διπλή κάρτα «${id}»`)
        continue
      }
      dup.add(id)
      if (!content.isCard(id)) contentIssue(strict, `${where}.flashcardSeenIds: άγνωστη κάρτα «${id}»`, errors, warnings)
      const item = globalOrError(courseId, id, `${where}.flashcardSeenIds`, errors)
      if (item) parts.flashcardSeenIds.push(item)
    }
  }

  const wrongBook = study.wrongBook ?? []
  if (!Array.isArray(wrongBook)) errors.push(`${where}.wrongBook: αναμενόταν πίνακας`)
  else {
    const uids = new Set()
    wrongBook.forEach((w, i) => {
      const at = `${where}.wrongBook[${i}]`
      if (!isObj(w)) return errors.push(`${at}: αναμενόταν αντικείμενο`)
      const before = errors.length
      for (const k of Object.keys(w)) if (!LEGACY_WRONG_FIELDS.includes(k)) errors.push(`${at}: άγνωστο πεδίο «${k}»`)
      for (const k of LEGACY_WRONG_FIELDS) if (typeof w[k] !== 'string') errors.push(`${at}.${k}: αναμενόταν string`)
      if (errors.length > before) return
      if (uids.has(w.uid)) return errors.push(`${at}: διπλό uid «${w.uid}»`)
      uids.add(w.uid)
      if (!content.isQuestion(w.id)) contentIssue(strict, `${at}: άγνωστη ερώτηση «${w.id}»`, errors, warnings)
      if (!content.hasGroup(w.categoryId)) contentIssue(strict, `${at}: άγνωστη ομάδα «${w.categoryId}»`, errors, warnings)
      const item = globalOrError(courseId, w.id, `${at}.id`, errors)
      if (!item) return
      parts.wrongBook.push({
        uid: w.uid,
        item,
        group: w.categoryId,
        question: w.question,
        explanation: w.explanation,
        userLabel: w.userLabel,
        correctLabel: w.correctLabel,
        t: null, // οι παλιές εγγραφές δεν έχουν χρόνο· δεν επινοείται
      })
    })
  }
  return parts
}

function globalOrError(courseId, localId, where, errors) {
  try {
    return toGlobalId(courseId, localId)
  } catch (e) {
    errors.push(`${where}: ${e.message}`)
    return null
  }
}

function checkChecklistItems(items, where, errors) {
  if (!isBoolArray(items)) {
    errors.push(`${where}: αναμενόταν πίνακας true/false`)
    return false
  }
  return true
}

/** Έλεγχος μιας εγγραφής wrongBook του νέου μοντέλου. */
function checkWrongEntry(e, { courseId, content }, where, errors, warnings) {
  if (!isObj(e)) return errors.push(`${where}: αναμενόταν αντικείμενο`)
  const before = errors.length
  for (const k of Object.keys(e)) if (!WRONG_FIELDS.includes(k)) errors.push(`${where}: άγνωστο πεδίο «${k}»`)
  for (const k of WRONG_FIELDS) if (!(k in e)) errors.push(`${where}: λείπει το «${k}»`)
  if (typeof e.uid !== 'string' || !e.uid) errors.push(`${where}.uid: αναμενόταν μη κενό string`)
  for (const k of WRONG_TEXT_FIELDS) if (k in e && typeof e[k] !== 'string') errors.push(`${where}.${k}: αναμενόταν string`)
  if ('group' in e && e.group !== null && (typeof e.group !== 'string' || !e.group)) errors.push(`${where}.group: string ή null`)
  if ('t' in e && !isTime(e.t)) errors.push(`${where}.t: Unix ms (από 2020) ή null`)
  const id = parseGlobalId(e.item)
  if (!id || id.courseId !== courseId) errors.push(`${where}.item: αναμενόταν global ID του «${courseId}»`)
  if (errors.length > before) return
  if (!content.isQuestion(id.localId)) warnings.push(`${where}: άγνωστη ερώτηση «${e.item}» (διατηρείται)`)
}

function readWrongBookState(value, ctx, errors, warnings) {
  const where = wrongBookStateKey(ctx.courseId)
  if (!isObj(value) || value.version !== WRONG_BOOK_STATE_VERSION || !Array.isArray(value.entries) || Object.keys(value).length !== 2) {
    errors.push(`${where}: αναμενόταν { version: ${WRONG_BOOK_STATE_VERSION}, entries: [] }`)
    return []
  }
  const uids = new Set()
  value.entries.forEach((e, i) => {
    checkWrongEntry(e, ctx, `${where}.entries[${i}]`, errors, warnings)
    if (isObj(e) && typeof e.uid === 'string') {
      if (uids.has(e.uid)) errors.push(`${where}.entries[${i}]: διπλό uid «${e.uid}»`)
      uids.add(e.uid)
    }
  })
  return structuredClone(value.entries)
}

function readChecklistsState(value, { courseId, content }, errors, warnings) {
  const where = checklistsStateKey(courseId)
  if (!isObj(value) || value.version !== CHECKLISTS_STATE_VERSION || !isObj(value.topics) || Object.keys(value).length !== 2) {
    errors.push(`${where}: αναμενόταν { version: ${CHECKLISTS_STATE_VERSION}, topics: {} }`)
    return {}
  }
  const out = {}
  for (const [topicId, entry] of Object.entries(value.topics)) {
    const at = `${where}.topics.${topicId}`
    if (!isObj(entry) || Object.keys(entry).length !== 1) {
      errors.push(`${at}: αναμενόταν { items }`)
      continue
    }
    if (!checkChecklistItems(entry.items, `${at}.items`, errors)) continue
    // Orphan (θέμα που δεν υπάρχει πια στο περιεχόμενο): κρατιέται, δεν σβήνεται· απλώς δεν εμφανίζεται.
    if (!content.hasTopic(topicId)) warnings.push(`${at}: άγνωστο θέμα (orphan, διατηρείται)`)
    out[topicId] = { items: [...entry.items] }
  }
  return out
}

/**
 * Παλιά κλειδιά ενός μαθήματος → Snapshot. Οι ρυθμίσεις (theme κ.λπ.) δεν είναι πρόοδος: επιστρέφονται χωριστά.
 *
 *   mode 'strict'  (προεπιλογή· migration): ό,τι δεν αναγνωρίζεται ή δεν αντιστοιχεί σε περιεχόμενο → απόρριψη.
 *   mode 'runtime' (ανάγνωση της εφαρμογής): άγνωστα κλειδιά και IDs που δεν υπάρχουν πια στο περιεχόμενο →
 *                  warning και διατήρηση (τα κλειδιά δεν αγγίζονται)· ΔΟΜΙΚΑ σφάλματα (μη έγκυρο JSON, λάθος τύποι)
 *                  → `degraded`, ποτέ «μηδενικά».
 * @param {Record<string, string>} entries raw legacy κλειδιά (χωρίς backups)
 * @param {{ content: import('./contentAdapter.js').ContentAdapter, mode?: 'strict' | 'runtime' }} opts
 * @returns {{ ok: true, status: 'ready', snapshot: object, settings: string[], warnings: string[] }
 *         | { ok: false, status: 'degraded', errors: string[], issues: string[], warnings: string[] }}
 */
export function legacyToSnapshot(entries, { content, mode = 'strict' }) {
  const warnings = []
  const fail = (errors) => ({ ok: false, status: 'degraded', errors, issues: errors, warnings })
  const adapterErrors = checkContentAdapter(content)
  if (adapterErrors.length) return fail(adapterErrors)
  if (!content.legacy) return fail([`το «${content.courseId}» δεν έχει παλιά (legacy) αποθήκευση`])
  if (!isObj(entries)) return fail(['τα legacy κλειδιά πρέπει να είναι αντικείμενο κλειδί → raw string'])
  const errors = []
  for (const [key, raw] of Object.entries(entries)) if (typeof raw !== 'string') errors.push(`${key}: η τιμή πρέπει να είναι raw string`)
  if (errors.length) return fail(errors)

  const strict = mode !== 'runtime'
  const { courseId } = content
  const decoded = content.legacy.decode(entries)
  errors.push(...decoded.errors)
  for (const u of decoded.unknown ?? []) contentIssue(strict, u, errors, warnings)
  const parts = legacyStudyParts(decoded.study, { courseId, content, strict, where: 'study' }, errors, warnings)

  const checklists = {}
  for (const { key, topicId, items } of decoded.checklists) {
    if (topicId === null || !content.hasTopic(topicId)) {
      contentIssue(strict, `${key}: δεν αντιστοιχεί σε θέμα του μαθήματος`, errors, warnings)
      continue
    }
    if (checklists[topicId]) {
      errors.push(`${key}: δεύτερο checklist για το θέμα «${topicId}»`)
      continue
    }
    if (checkChecklistItems(items, key, errors)) checklists[topicId] = { items: [...items] }
  }
  if (errors.length) return { ...fail(errors), warnings }
  return {
    ok: true,
    status: 'ready',
    snapshot: { ...emptySnapshot(courseId), ...parts, checklists },
    settings: [...decoded.settings].sort(),
    warnings,
  }
}

/**
 * Ό,τι βλέπει ο χρήστης για ΕΝΑ μάθημα = baseline (ή τίποτα) + πραγματικά events + state.
 * @param {{
 *   courseId: string,
 *   content: import('./contentAdapter.js').ContentAdapter,
 *   baseline?: object | null,   // frozen legacy baseline (format legacy-baseline) ή null (μάθημα χωρίς legacy)
 *   events?: object[],          // ολόκληρο το log· κρατιούνται μόνο όσα ανήκουν στο courseId
 *   state?: object,             // ολόκληρο το state του store· διαβάζονται μόνο τα namespaces του courseId
 * }} input
 * @returns {{ ok: true, snapshot: object, warnings: string[] } | { ok: false, errors: string[], warnings: string[] }}
 */
export function buildProgressSnapshot({ courseId, content, baseline = null, events = [], state = {} }) {
  const errors = checkContentAdapter(content, courseId)
  const warnings = []
  if (errors.length) return { ok: false, errors, warnings }
  if (!isObj(state)) return { ok: false, errors: ['state: αναμενόταν αντικείμενο'], warnings }
  if (!Array.isArray(events)) return { ok: false, errors: ['events: αναμενόταν πίνακας'], warnings }
  const ctx = { courseId, content }

  // Reset
  let resetAt = null
  const reset = state[resetStateKey(courseId)]
  if (reset !== undefined) {
    if (!isObj(reset)) errors.push(`${resetStateKey(courseId)}: αναμενόταν { at }`)
    else resetAt = parseTime(reset.at, `${resetStateKey(courseId)}.at`, errors)
  }

  // Baseline (frozen· δεν τροποποιείται)
  let baseAt = null
  let base = null
  let baseChecklists = {}
  if (baseline !== null) {
    if (!isObj(baseline) || !isObj(baseline.progress)) errors.push('baseline: αναμενόταν αντικείμενο με progress')
    else if (baseline.courseId !== courseId) errors.push(`baseline: είναι για «${baseline.courseId}», όχι για «${courseId}»`)
    else {
      baseAt = parseTime(baseline.capturedAt, 'baseline.capturedAt', errors)
      const { checklists = {}, ...study } = baseline.progress
      base = legacyStudyParts(study, { ...ctx, strict: false, where: 'baseline.progress' }, errors, warnings)
      if (!isObj(checklists)) errors.push('baseline.progress.checklists: αναμενόταν αντικείμενο')
      else {
        for (const [topicId, entry] of Object.entries(checklists)) {
          const at = `baseline.progress.checklists.${topicId}`
          if (!isObj(entry) || !checkChecklistItems(entry.items, `${at}.items`, errors)) continue
          if (!content.hasTopic(topicId)) warnings.push(`${at}: άγνωστο θέμα (orphan, διατηρείται)`)
          baseChecklists[topicId] = { items: [...entry.items] }
        }
      }
    }
  }
  if (errors.length) return { ok: false, errors, warnings }

  const useBaseline = base !== null && resetAt === null
  const out = emptySnapshot(courseId)
  if (useBaseline) {
    out.quizAnswered = base.quizAnswered
    out.quizCorrect = base.quizCorrect
    out.byGroup = structuredClone(base.byGroup)
    out.flashcardSeenIds = [...base.flashcardSeenIds]
  }

  // Events
  const seen = new Set(out.flashcardSeenIds)
  const byId = new Map()
  events.forEach((ev, i) => {
    const v = validateEvent(ev)
    if (!v.ok) return errors.push(`events[${i}]: ${v.errors.join(', ')}`)
    const prev = byId.get(ev.id)
    if (prev) {
      if (!sameEvent(prev, ev)) errors.push(`events[${i}]: το id ${ev.id} υπάρχει ήδη με διαφορετικό περιεχόμενο`)
      return // ίδιο event: μετριέται μία φορά
    }
    byId.set(ev.id, ev)
    const id = parseGlobalId(ev.item)
    if (!id || id.courseId !== courseId) return
    if (baseAt !== null && ev.t < baseAt) return errors.push(`events[${i}]: το event ${ev.id} είναι πριν από το baseline`)
    if (resetAt !== null && ev.t < resetAt) return
    if (ev.kind === 'answer' && ev.ctx === 'quiz') {
      out.quizAnswered += 1
      if (ev.ok === 1) out.quizCorrect += 1
      const group = content.groupOf(id.localId)
      if (typeof group === 'string') {
        const s = (out.byGroup[group] ??= zeroCounts())
        if (ev.ok === 1) s.correct += 1
        else s.wrong += 1
      }
    } else if (ev.kind === 'flip' && ev.ctx === 'flash' && !seen.has(ev.item)) {
      seen.add(ev.item)
      out.flashcardSeenIds.push(ev.item)
    }
  })

  // State: wrongBook / checklists (το κλειδί, αν υπάρχει, είναι ο μοναδικός ιδιοκτήτης)
  const wbKey = wrongBookStateKey(courseId)
  const clKey = checklistsStateKey(courseId)
  if (wbKey in state) out.wrongBook = readWrongBookState(state[wbKey], ctx, errors, warnings)
  else if (useBaseline) out.wrongBook = structuredClone(base.wrongBook)
  if (clKey in state) out.checklists = readChecklistsState(state[clKey], ctx, errors, warnings)
  else if (useBaseline) out.checklists = structuredClone(baseChecklists)

  if (errors.length) return { ok: false, errors, warnings }
  return { ok: true, snapshot: out, warnings }
}

/** Δομικός έλεγχος ενός Snapshot v1. @returns {string[]} */
export function validateSnapshot(snapshot, { content } = {}) {
  const errors = []
  if (!isObj(snapshot)) return ['snapshot: αναμενόταν αντικείμενο']
  if (snapshot.format !== SNAPSHOT_FORMAT || snapshot.version !== SNAPSHOT_VERSION) errors.push('snapshot: άγνωστη μορφή/έκδοση')
  const keys = Object.keys(emptySnapshot('x'))
  for (const k of Object.keys(snapshot)) if (!keys.includes(k)) errors.push(`snapshot: άγνωστο πεδίο «${k}»`)
  const { courseId } = snapshot
  const ctx = { courseId, content: content ?? { isQuestion: () => true } }
  if (!isCount(snapshot.quizAnswered) || !isCount(snapshot.quizCorrect) || snapshot.quizCorrect > snapshot.quizAnswered) {
    errors.push('snapshot: άκυρα quizAnswered/quizCorrect')
  }
  if (!isObj(snapshot.byGroup) || !Object.values(snapshot.byGroup).every((s) => isObj(s) && isCount(s.correct) && isCount(s.wrong))) {
    errors.push('snapshot.byGroup: αναμενόταν { [ομάδα]: { correct, wrong } }')
  }
  const seen = snapshot.flashcardSeenIds
  if (!Array.isArray(seen) || new Set(seen).size !== seen.length || !seen.every((x) => parseGlobalId(x)?.courseId === courseId)) {
    errors.push(`snapshot.flashcardSeenIds: μοναδικά global IDs του «${courseId}»`)
  }
  if (!Array.isArray(snapshot.wrongBook)) errors.push('snapshot.wrongBook: αναμενόταν πίνακας')
  else snapshot.wrongBook.forEach((e, i) => checkWrongEntry(e, ctx, `snapshot.wrongBook[${i}]`, errors, []))
  if (!isObj(snapshot.checklists) || !Object.values(snapshot.checklists).every((c) => isObj(c) && isBoolArray(c.items))) {
    errors.push('snapshot.checklists: αναμενόταν { [topicId]: { items } }')
  }
  return errors
}

/**
 * Snapshot → παλιά κλειδιά (projection). Χάνεται μόνο ό,τι το παλιό σχήμα δεν έχει θέση να κρατήσει (`t` του
 * wrongBook)· θέματα χωρίς legacy κλειδί επιστρέφονται στο `unprojected`. `previous` = οι τρέχουσες raw τιμές, ώστε
 * ό,τι δεν ανήκει στο snapshot (π.χ. orphan μέσα σε κοινό κλειδί) να διατηρείται.
 * @returns {{ ok: true, entries: Record<string, string>, unprojected: string[] } | { ok: false, errors: string[] }}
 */
export function snapshotToLegacy(snapshot, { content, previous = {} }) {
  const errors = checkContentAdapter(content, snapshot?.courseId)
  if (errors.length) return { ok: false, errors }
  if (!content.legacy) return { ok: false, errors: [`το «${content.courseId}» δεν έχει παλιά (legacy) αποθήκευση`] }
  errors.push(...validateSnapshot(snapshot, { content }))
  if (errors.length) return { ok: false, errors }

  const local = (item) => parseGlobalId(item).localId
  const wrongBook = []
  snapshot.wrongBook.forEach((e, i) => {
    if (e.group === null) return errors.push(`snapshot.wrongBook[${i}]: χωρίς ομάδα δεν χωράει στο παλιό σχήμα`)
    wrongBook.push({
      uid: e.uid,
      id: local(e.item),
      categoryId: e.group,
      question: e.question,
      explanation: e.explanation,
      userLabel: e.userLabel,
      correctLabel: e.correctLabel,
    })
  })
  if (errors.length) return { ok: false, errors }
  const study = {
    quizAnswered: snapshot.quizAnswered,
    quizCorrect: snapshot.quizCorrect,
    byCategory: structuredClone(snapshot.byGroup),
    flashcardSeenIds: snapshot.flashcardSeenIds.map(local),
    wrongBook,
  }
  const checklists = Object.fromEntries(Object.entries(snapshot.checklists).map(([topicId, c]) => [topicId, [...c.items]]))
  const { entries, unprojected } = content.legacy.encode({ study, checklists }, { previous })
  return { ok: true, entries, unprojected: [...unprojected].sort() }
}

/** Τα state namespaces (wrongBook, checklists) ενός snapshot — ό,τι θα γραφτεί κατά την υλοποίηση στο cutover. */
export function stateFromSnapshot(snapshot) {
  return {
    [wrongBookStateKey(snapshot.courseId)]: { version: WRONG_BOOK_STATE_VERSION, entries: structuredClone(snapshot.wrongBook) },
    [checklistsStateKey(snapshot.courseId)]: { version: CHECKLISTS_STATE_VERSION, topics: structuredClone(snapshot.checklists) },
  }
}
