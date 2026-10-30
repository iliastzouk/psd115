/**
 * Πρόοδος ανά μάθημα από το νέο store (Φάση 6a) — pure, χωρίς storage, React ή URLs. Καθαρή αρχή: κανένα legacy baseline.
 *
 *   { events, state } του store → parseStoreData()  → έλεγχοι για ΟΛΟ το store (global degraded)
 *                               → courseProgress()  → ready + Snapshot | unavailable (μόνο αυτό το μάθημα)
 *
 * Ταξινόμηση events (J4) — ίδια στην ανάγνωση, στην εγγραφή (ProgressService) και στο import:
 *  - άκυρο schema · ίδιο id με άλλο περιεχόμενο · `item` που δεν είναι global id          → global (parseStoreData)
 *  - μάθημα χωρίς adapter (ή εκτός registry)                                              → opaque: κρατιέται, δεν μετρά
 *  - `answer`+`quiz` σε κάρτα · `flip`+`flash` σε ερώτηση, με t ≥ R                         → unavailable το μάθημα
 *  - id που δεν υπάρχει πια στο περιεχόμενο (κάθε kind/ctx)                                → orphan: κρατιέται, δεν μετρά
 *  - `self` ή άλλος συνδυασμός kind/ctx σε υπαρκτό id (οποιουδήποτε τύπου)                  → κρατιέται, δεν μετρά
 *  Μετρούν ΜΟΝΟ `answer`+`quiz` (ερώτηση) και `flip`+`flash` (κάρτα).
 *
 * Reset (J5/J6): R = `progress:reset:<courseId>.at` (απόν = −∞). Καθολικός κανόνας: τίποτα με t < R δεν εμφανίζεται —
 * events, wrongBook, checklists. Τα δεδομένα με t < R κρατιούνται (append-only log) αλλά δεν έχουν σημασία.
 *
 * Namespaces (J6-Γ): απόν = έγκυρη κενή κατάσταση· παρόν αλλά άκυρο → unavailable (μόνο αυτό το μάθημα).
 *   progress:wrongbook:<c>   { version: 1, entries: [{ uid, item, group, question, explanation, userLabel, correctLabel, t }] }
 *   progress:checklists:<c>  { version: 2, topics: { [topicId]: { items: boolean[], t } } }
 *   progress:reset:<c>       { at: ISO 8601 (ms), reason?: string }
 */
import { parseGlobalId } from '../academic/ids.js'
import { sameEvent, validateEvent } from './events.js'
import { checkContentAdapter } from './contentAdapter.js'
import { checklistsStateKey, resetStateKey, wrongBookStateKey } from './namespaces.js'
import { emptySnapshot } from './snapshotShape.js'

export const WRONG_BOOK_VERSION = 1
/** v2 (Φάση 6a): κάθε θέμα έχει και `t` (τελευταία αλλαγή), ώστε το reset να εφαρμόζεται και στα checklists. */
export const CHECKLISTS_VERSION = 2
/** Ίδιο όριο με το legacy wrongBook (τα πρώτα στη σειρά (t, uid) φεύγουν). */
export const WRONG_BOOK_LIMIT = 60
const MIN_T = Date.UTC(2020, 0, 1)
const WRONG_TEXT_FIELDS = ['question', 'explanation', 'userLabel', 'correctLabel']
const WRONG_FIELDS = ['uid', 'item', 'group', ...WRONG_TEXT_FIELDS, 't']

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isTime = (v) => Number.isSafeInteger(v) && v >= MIN_T
const isBoolArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'boolean')

/**
 * Η ΜΟΝΗ κανονικοποίηση του wrongBook (J5), σε κάθε διαδρομή: snapshot, προσθήκη λάθους, import, προεπισκόπηση.
 * Φίλτρο t ≥ resetAt → σειρά (t, uid) → τα τελευταία `limit`. Δεν τροποποιεί την είσοδο.
 */
export function canonicalWrongBook(entries, { resetAt = -Infinity, limit = WRONG_BOOK_LIMIT } = {}) {
  return entries
    .filter((e) => e.t >= resetAt)
    .sort((a, b) => a.t - b.t || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0))
    .slice(-limit)
}

/** J5: χρόνος reset — αυστηρά μετά από κάθε χρονικό δεδομένο του μαθήματος και από το προηγούμενο reset. */
export const resetTime = ({ now, high, previousReset }) => Math.max(now, high + 1, previousReset + 1)
/** J5: χρόνος μιας νέας εγγραφής (event, wrongBook, checklist) — ένας ανά λογική ενέργεια. */
export const nextTime = ({ now, resetAt, high }) => Math.max(now, resetAt, high + 1)

/**
 * Έλεγχοι για όλο το store. Αποτυχία → global degraded (καμία εγγραφή για κανένα μάθημα).
 * @param {{ events: unknown[], state: object }} data parsed τιμές (store core)
 * @returns {{ ok: true, byCourse: Map<string, object[]>, warnings: string[] } | { ok: false, issues: string[] }}
 */
export function parseStoreData({ events, state }) {
  const issues = []
  if (!Array.isArray(events)) return { ok: false, issues: ['events: αναμενόταν πίνακας'] }
  if (!isObj(state)) return { ok: false, issues: ['state: αναμενόταν αντικείμενο'] }
  const warnings = []
  const byId = new Map()
  const byCourse = new Map()
  events.forEach((ev, i) => {
    const v = validateEvent(ev)
    if (!v.ok) return issues.push(`events[${i}]: ${v.errors.join(', ')}`)
    const id = parseGlobalId(ev.item)
    if (!id) return issues.push(`events[${i}]: το item «${ev.item}» δεν είναι global id`)
    const prev = byId.get(ev.id)
    if (prev) {
      if (!sameEvent(prev, ev)) issues.push(`events[${i}]: το id ${ev.id} υπάρχει ήδη με διαφορετικό περιεχόμενο`)
      else warnings.push(`events[${i}]: διπλό event ${ev.id} (μετριέται μία φορά)`)
      return
    }
    byId.set(ev.id, ev)
    if (!byCourse.has(id.courseId)) byCourse.set(id.courseId, [])
    byCourse.get(id.courseId).push(ev)
  })
  return issues.length ? { ok: false, issues } : { ok: true, byCourse, warnings }
}

/**
 * Τα namespaces ενός μαθήματος: τιμές + σφάλματα ανά namespace. Το `high` (J5: H_c) = μέγιστο t των ΕΓΚΥΡΩΝ wrongBook /
 * checklists· όχι το reset (μετρά χωριστά: previousReset + 1, resetAt).
 * @returns {{ resetAt: number, wrongBook: object[], checklists: Record<string, { items: boolean[], t: number }>,
 *            invalid: string[], issues: string[], high: number }}
 */
export function courseNamespaces(courseId, state) {
  const issues = []
  const invalid = []
  let high = -Infinity
  const bad = (key, message) => {
    if (!invalid.includes(key)) invalid.push(key)
    issues.push(`${key}: ${message}`)
  }

  const rKey = resetStateKey(courseId)
  let resetAt = -Infinity
  if (rKey in state) {
    const r = state[rKey]
    const ms = isObj(r) && typeof r.at === 'string' ? Date.parse(r.at) : NaN
    const extra = isObj(r) ? Object.keys(r).filter((k) => k !== 'at' && k !== 'reason') : []
    if (!Number.isSafeInteger(ms) || ms < MIN_T || extra.length || (isObj(r) && 'reason' in r && typeof r.reason !== 'string')) {
      bad(rKey, 'αναμενόταν { at: ISO, reason? }')
    } else resetAt = ms
  }

  const wKey = wrongBookStateKey(courseId)
  let wrongBook = []
  if (wKey in state) {
    const w = state[wKey]
    const errs = []
    if (!isObj(w) || w.version !== WRONG_BOOK_VERSION || !Array.isArray(w.entries) || Object.keys(w).length !== 2) {
      errs.push(`αναμενόταν { version: ${WRONG_BOOK_VERSION}, entries: [] }`)
    } else {
      const uids = new Set()
      w.entries.forEach((e, i) => {
        const at = `entries[${i}]`
        if (!isObj(e)) return errs.push(`${at}: αναμενόταν αντικείμενο`)
        for (const k of Object.keys(e)) if (!WRONG_FIELDS.includes(k)) errs.push(`${at}: άγνωστο πεδίο «${k}»`)
        for (const k of WRONG_FIELDS) if (!(k in e)) errs.push(`${at}: λείπει το «${k}»`)
        if (typeof e.uid !== 'string' || !e.uid) errs.push(`${at}.uid: αναμενόταν μη κενό string`)
        else if (uids.has(e.uid)) errs.push(`${at}: διπλό uid «${e.uid}»`)
        else uids.add(e.uid)
        for (const k of WRONG_TEXT_FIELDS) if (k in e && typeof e[k] !== 'string') errs.push(`${at}.${k}: αναμενόταν string`)
        if (e.group !== null && (typeof e.group !== 'string' || !e.group)) errs.push(`${at}.group: string ή null`)
        if (!isTime(e.t)) errs.push(`${at}.t: Unix ms (από 2020)`)
        if (parseGlobalId(e.item)?.courseId !== courseId) errs.push(`${at}.item: αναμενόταν global id του «${courseId}»`)
      })
    }
    if (errs.length) for (const m of errs) bad(wKey, m)
    else {
      wrongBook = w.entries.map((e) => ({ ...e }))
      for (const e of wrongBook) high = Math.max(high, e.t)
    }
  }

  const cKey = checklistsStateKey(courseId)
  let checklists = {}
  if (cKey in state) {
    const c = state[cKey]
    const errs = []
    if (!isObj(c) || c.version !== CHECKLISTS_VERSION || !isObj(c.topics) || Object.keys(c).length !== 2) {
      errs.push(`αναμενόταν { version: ${CHECKLISTS_VERSION}, topics: {} }`)
    } else {
      for (const [topicId, entry] of Object.entries(c.topics)) {
        const keys = isObj(entry) ? Object.keys(entry).sort().join(',') : ''
        if (keys !== 'items,t' || !isBoolArray(entry.items) || !isTime(entry.t)) errs.push(`topics.${topicId}: αναμενόταν { items: boolean[], t }`)
      }
    }
    if (errs.length) for (const m of errs) bad(cKey, m)
    else {
      checklists = Object.fromEntries(Object.entries(c.topics).map(([k, v]) => [k, { items: [...v.items], t: v.t }]))
      for (const v of Object.values(checklists)) high = Math.max(high, v.t)
    }
  }
  return { resetAt, wrongBook, checklists, invalid, issues, high }
}

/**
 * Πρόοδος ΕΝΟΣ μαθήματος. `events` = τα events του μαθήματος (από parseStoreData), `state` = όλο το state.
 * @returns {{ status: 'ready', snapshot: object, resetAt: number, high: number, visible: object[], warnings: string[] }
 *         | { status: 'unavailable', issues: string[], invalid: string[], resetAt: number, high: number, warnings: string[] }}
 */
export function courseProgress({ courseId, content, events = [], state = {} }) {
  const adapterErrors = checkContentAdapter(content, courseId)
  if (adapterErrors.length) throw new Error(`courseProgress: ${adapterErrors.join('; ')}`)
  const ns = courseNamespaces(courseId, state)
  const warnings = []
  const issues = [...ns.issues]
  // H_c: ΟΛΑ τα events του μαθήματος (και κρυμμένα, orphan, self) + έγκυρα wrongBook / checklists (όχι το reset).
  let high = ns.high
  for (const ev of events) high = Math.max(high, ev.t)
  const R = ns.resetAt

  const out = emptySnapshot(courseId)
  const seen = new Set()
  const visible = []
  for (const ev of events) {
    if (ev.t < R) continue
    const { localId } = parseGlobalId(ev.item)
    const question = content.isQuestion(localId)
    const card = content.isCard(localId)
    if (!question && !card) {
      warnings.push(`orphan: ${ev.kind}/${ev.ctx} σε «${ev.item}», που δεν υπάρχει πια στο περιεχόμενο`)
      continue
    }
    visible.push(ev)
    if (ev.kind === 'answer' && ev.ctx === 'quiz') {
      if (!question) {
        issues.push(`το event ${ev.id} είναι απάντηση σε κάρτα («${ev.item}»)`)
        continue
      }
      out.quizAnswered += 1
      if (ev.ok === 1) out.quizCorrect += 1
      const group = content.groupOf(localId)
      if (typeof group === 'string') {
        const s = (out.byGroup[group] ??= { correct: 0, wrong: 0 })
        if (ev.ok === 1) s.correct += 1
        else s.wrong += 1
      }
    } else if (ev.kind === 'flip' && ev.ctx === 'flash') {
      if (!card) {
        issues.push(`το event ${ev.id} είναι κάρτα σε ερώτηση («${ev.item}»)`)
        continue
      }
      if (!seen.has(ev.item)) {
        seen.add(ev.item)
        out.flashcardSeenIds.push(ev.item)
      }
    }
    // self / άλλα kind+ctx σε υπαρκτό id: κρατιούνται, δεν μετρούν (κανένας έλεγχος τύπου).
  }
  if (issues.length) return { status: 'unavailable', issues, invalid: ns.invalid, resetAt: R, high, warnings }

  out.wrongBook = canonicalWrongBook(ns.wrongBook, { resetAt: R })
  for (const e of out.wrongBook) {
    if (!content.isQuestion(parseGlobalId(e.item).localId)) warnings.push(`wrongBook: άγνωστη ερώτηση «${e.item}» (διατηρείται)`)
  }
  for (const [topicId, entry] of Object.entries(ns.checklists)) {
    if (entry.t < R) continue
    if (!content.hasTopic(topicId)) warnings.push(`checklist: άγνωστο θέμα «${topicId}» (orphan, διατηρείται)`)
    out.checklists[topicId] = { items: [...entry.items] }
  }
  return { status: 'ready', snapshot: out, resetAt: R, high, visible, warnings }
}
