/**
 * Import της νέας μορφής (Φάση 6a, J6) — pure: υπολογίζει το τελικό store και την προεπισκόπηση, ΧΩΡΙΣ να γράψει.
 * Η εγγραφή (αποτύπωμα, safety backup, συναλλαγή) είναι στο utils/studyProgressBackup.js.
 *
 * Ταξινόμηση events: ίδια με την ανάγνωση (courseProgress.js, J4). Orphans και μαθήματα χωρίς adapter → αποδοχή (opaque).
 *
 * Συγχώνευση ανά υποστηριζόμενο μάθημα, με R = max(Rl, Rf) (απόν = −∞) και τον καθολικό κανόνα «τίποτα με t < R»:
 *   events      ένωση με βάση το id· ίδιο id με άλλο περιεχόμενο → απόρριψη όλου
 *   wrongBook   φίλτρο t ≥ R και στις δύο πλευρές → ένωση με βάση το uid (ίδιο uid με άλλο περιεχόμενο → απόρριψη όλου)
 *               → canonicalWrongBook(R)
 *   checklists  ανά θέμα (t ≥ R): μόνο στη μία πλευρά → κρατιέται· ίδιες τιμές → καμία αλλαγή· διαφορετικές → του αρχείου
 *   reset       R
 * Opaque κλειδιά state (ό,τι δεν είναι namespace υποστηριζόμενου μαθήματος): διαφορετική τιμή → του αρχείου.
 * Τοπικό namespace που υπάρχει αλλά είναι άκυρο → αντικαθίσταται από του αρχείου (απόν = κενό).
 *
 * Απόρριψη όλου: άκυρο αρχείο ή namespace αρχείου · σύγκρουση id/uid · μάθημα που από ready θα γινόταν unavailable.
 * Μάθημα ήδη unavailable που παραμένει → δεν μπλοκάρει (preview «παραμένει μη διαθέσιμο»).
 *
 * Ρητή επιβεβαίωση (`requiresConfirmation`) όταν οποιοδήποτε τοπικό στοιχείο αφαιρείται, κρύβεται ή αλλάζει τιμή,
 * όταν αντικαθίσταται μάθημα unavailable, ή στην πλήρη αντικατάσταση (mode `replace`, τοπικό store που δεν διαβάζεται).
 * Ο έλεγχος γίνεται πάνω στα ίδια τα στοιχεία (ids, uids, κάρτες, θέματα), όχι στα πλήθη.
 *
 * Περιορισμός (J6): το μεγαλύτερο timestamp δεν αποδεικνύει την πραγματική σειρά σε διαφορετικές συσκευές· ένα reset από
 * συσκευή με ρολόι μπροστά μπορεί να κρύψει νεότερες ενέργειες. Η προεπισκόπηση τις δείχνει ως «δεν θα υπολογιστούν».
 */
import { sameEvent } from './events.js'
import { EXPORT_FORMAT, EXPORT_VERSION } from './progressStore.js'
import { CHECKLISTS_VERSION, WRONG_BOOK_VERSION, canonicalWrongBook, courseNamespaces, courseProgress, parseStoreData } from './courseProgress.js'
import { checklistsStateKey, resetStateKey, wrongBookStateKey } from './namespaces.js'

export class ImportRejected extends Error {
  /** @param {string} message @param {string[]} [details] */
  constructor(message, details = []) {
    super(details.length ? `${message}: ${details.slice(0, 5).join('; ')}` : message)
    this.name = 'ImportRejected'
    this.details = details
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
/** JSON με ταξινομημένα κλειδιά (σύγκριση τιμών ανεξάρτητα από τη σειρά των κλειδιών). */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isObj(value)) return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`
  return JSON.stringify(value)
}
const same = (a, b) => canonicalJson(a) === canonicalJson(b)

/** Έλεγχος μορφής του αρχείου (όχι περιεχομένου). Παλιό `psd115-progress-export` → απόρριψη με σαφές μήνυμα. */
export function readExportFile(data) {
  if (isObj(data) && data.format === 'psd115-progress-export') {
    throw new ImportRejected('Το αρχείο είναι στην παλιά μορφή προόδου (psd115-progress-export), που δεν υποστηρίζεται πια')
  }
  const errors = []
  if (!isObj(data)) throw new ImportRejected('Το αρχείο δεν είναι αντικείμενο')
  if (data.format !== EXPORT_FORMAT) errors.push(`άγνωστο format ${JSON.stringify(data.format)}`)
  if (data.version !== EXPORT_VERSION) errors.push(`μη υποστηριζόμενη έκδοση ${JSON.stringify(data.version)}`)
  if (!Array.isArray(data.events)) errors.push('λείπει ο πίνακας events')
  if (!isObj(data.state)) errors.push('λείπει το αντικείμενο state')
  for (const k of Object.keys(data)) if (!['format', 'version', 'exportedAt', 'events', 'state'].includes(k)) errors.push(`άγνωστο πεδίο «${k}»`)
  if (errors.length) throw new ImportRejected('Μη συμβατό αρχείο', errors)
  const parsed = parseStoreData({ events: data.events, state: data.state })
  if (!parsed.ok) throw new ImportRejected('Άκυρα δεδομένα στο αρχείο· δεν εισήχθη τίποτα', parsed.issues)
  return { events: structuredClone(data.events), state: structuredClone(data.state), parsed }
}

const nsKeys = (courseId) => [wrongBookStateKey(courseId), checklistsStateKey(courseId), resetStateKey(courseId)]
const iso = (ms) => new Date(ms).toISOString()

function mergeCourse(courseId, local, file, errors) {
  const L = courseNamespaces(courseId, local)
  const F = courseNamespaces(courseId, file)
  const [wKey, cKey, rKey] = nsKeys(courseId)
  if (F.invalid.length) {
    errors.push(...F.issues.map((m) => `αρχείο: ${m}`))
    return null
  }
  const lValid = (key) => key in local && !L.invalid.includes(key)
  const Rl = lValid(rKey) ? L.resetAt : -Infinity
  const R = Math.max(Rl, F.resetAt)
  const out = {}

  if (R > -Infinity) {
    const src = Rl === R && lValid(rKey) ? local[rKey] : file[rKey]
    out[rKey] = structuredClone(src)
  }

  // J6: ΠΡΩΤΑ το τελικό όριο t ≥ R και στις δύο πλευρές, ΜΕΤΑ ο έλεγχος uid και η ένωση (εγγραφές που κρύβει το R δεν
  // μπορούν να απορρίψουν το import ούτε να ξαναγραφτούν).
  const byUid = new Map()
  for (const e of lValid(wKey) ? L.wrongBook : []) if (e.t >= R) byUid.set(e.uid, e)
  for (const e of F.wrongBook.filter((x) => x.t >= R)) {
    const prev = byUid.get(e.uid)
    if (prev && !same(prev, e)) errors.push(`${courseId}: το uid «${e.uid}» του wrongBook υπάρχει ήδη με διαφορετικό περιεχόμενο`)
    else byUid.set(e.uid, e)
  }
  if (wKey in local || wKey in file) out[wKey] = { version: WRONG_BOOK_VERSION, entries: canonicalWrongBook([...byUid.values()]) } // ήδη t ≥ R

  if (cKey in local || cKey in file) {
    const topics = {}
    const lt = lValid(cKey) ? L.checklists : {}
    for (const [topicId, v] of Object.entries(lt)) if (v.t >= R) topics[topicId] = v
    for (const [topicId, v] of Object.entries(F.checklists)) {
      if (v.t < R) continue
      const prev = topics[topicId]
      if (!prev || prev.items.length !== v.items.length || prev.items.some((x, i) => x !== v.items[i])) topics[topicId] = v
    }
    out[cKey] = { version: CHECKLISTS_VERSION, topics }
  }
  return { state: out, replacedCorrupt: L.invalid.filter((k) => k in local) }
}

function courseView(courseId, content, events, state) {
  const r = courseProgress({ courseId, content, events, state })
  const visible = new Map((r.visible ?? []).map((e) => [e.id, e]))
  return r.status === 'ready'
    ? { status: 'ready', snapshot: r.snapshot, visible, issues: [], warnings: r.warnings }
    : { status: 'unavailable', issues: r.issues, snapshot: null, visible: new Map(), warnings: r.warnings }
}
/** Ένα event όπως το δείχνει η προεπισκόπηση (review #18: τα ίδια τα στοιχεία, όχι πλήθη). */
const eventRef = (e) => ({ id: e.id, item: e.item, kind: e.kind, ctx: e.ctx, ...('ok' in e ? { ok: e.ok } : {}), t: e.t })

const resetIso = (courseId, state) => {
  const ns = courseNamespaces(courseId, state)
  return ns.resetAt > -Infinity ? iso(ns.resetAt) : null
}

function coursePreview(courseId, before, after, replacedCorrupt, beforeState, afterState) {
  const b = before?.snapshot
  const a = after.snapshot
  const minus = (x, y) => [...x].filter((v) => !y.has(v))
  const bVis = before?.visible ?? new Map()
  const aVis = after.visible
  const bSeen = new Set(b?.flashcardSeenIds ?? [])
  const aSeen = new Set(a?.flashcardSeenIds ?? [])
  const bW = new Map((b?.wrongBook ?? []).map((w) => [w.uid, w]))
  const aW = new Map((a?.wrongBook ?? []).map((w) => [w.uid, w]))
  const topicsB = b?.checklists ?? {}
  const topicsA = a?.checklists ?? {}
  const checklists = []
  for (const topicId of new Set([...Object.keys(topicsB), ...Object.keys(topicsA)])) {
    const x = topicsB[topicId]?.items ?? null
    const y = topicsA[topicId]?.items ?? null
    if (!same(x, y)) checklists.push({ topicId, before: x, after: y })
  }
  const p = {
    courseId,
    statusBefore: before ? before.status : null,
    statusAfter: after.status,
    quiz: { before: { answered: b?.quizAnswered ?? 0, correct: b?.quizCorrect ?? 0 }, after: { answered: a?.quizAnswered ?? 0, correct: a?.quizCorrect ?? 0 } },
    events: {
      added: minus(aVis.keys(), bVis).map((id) => eventRef(aVis.get(id))),
      hidden: minus(bVis.keys(), aVis).map((id) => eventRef(bVis.get(id))),
    },
    cards: { added: minus(aSeen, bSeen), hidden: minus(bSeen, aSeen) },
    wrongBook: {
      added: minus(new Set(aW.keys()), new Set(bW.keys())).map((uid) => ({ uid, question: aW.get(uid).question })),
      removed: minus(new Set(bW.keys()), new Set(aW.keys())).map((uid) => ({ uid, question: bW.get(uid).question })),
    },
    checklists,
    reset: { before: beforeState ? resetIso(courseId, beforeState) : null, after: resetIso(courseId, afterState) },
    replacedCorrupt,
    // Προειδοποιήσεις του τελικού αποτελέσματος (π.χ. orphan events): κρατιούνται αλλά δεν μετρούν.
    warnings: after.warnings ?? [],
  }
  p.loss =
    p.events.hidden.length > 0 ||
    p.cards.hidden.length > 0 ||
    p.wrongBook.removed.length > 0 ||
    checklists.some((c) => c.before !== null) ||
    replacedCorrupt.length > 0 ||
    (p.statusBefore === 'unavailable' && p.statusAfter === 'ready')
  p.changed = p.loss || p.events.added.length > 0 || p.cards.added.length > 0 || p.wrongBook.added.length > 0 || checklists.length > 0 || p.reset.before !== p.reset.after
  return p
}

/**
 * @param {{ local: { events: unknown[], state: object } | null,  // parsed τοπικό store· null = δεν διαβάζεται (replace)
 *           file: unknown, adapters: Record<string, import('./contentAdapter.js').ContentAdapter> }} input
 * @returns {{ mode: 'merge' | 'replace', result: { events: object[], state: object }, courses: object[],
 *             opaque: { key: string, change: 'added' | 'changed' }[], requiresConfirmation: boolean, warnings: string[] }}
 */
/** Events μαθημάτων χωρίς adapter (opaque): κρατιούνται, δεν μετρούν — η προεπισκόπηση τα αναφέρει. */
function opaqueEventWarnings(parsed, supported, onlyNew = null) {
  const out = []
  for (const [courseId, evs] of parsed.byCourse) {
    if (supported.includes(courseId)) continue
    const n = onlyNew ? evs.filter((e) => onlyNew.has(e.id)).length : evs.length
    if (n) out.push(`${courseId}: ${n} καταγραφές μαθήματος χωρίς υποστήριξη προόδου (κρατιούνται, δεν μετρούν)`)
  }
  return out
}

export function planMerge({ local, file, adapters }) {
  const f = readExportFile(file)
  const supported = Object.keys(adapters)
  const errors = []

  if (local === null) {
    const courses = []
    for (const c of supported) {
      const after = courseView(c, adapters[c], f.parsed.byCourse.get(c) ?? [], f.state)
      if (after.status !== 'ready') errors.push(`${c}: ${after.issues.join('; ')}`)
      else courses.push(coursePreview(c, null, after, [], null, f.state))
    }
    if (errors.length) throw new ImportRejected('Το αρχείο δεν δίνει έγκυρη πρόοδο· δεν εισήχθη τίποτα', errors)
    const warnings = [...f.parsed.warnings, ...opaqueEventWarnings(f.parsed, supported), ...courses.flatMap((p) => p.warnings.map((w) => `${p.courseId}: ${w}`))]
    return { mode: 'replace', result: { events: f.events, state: f.state }, courses, opaque: [], requiresConfirmation: true, warnings }
  }

  const lParsed = parseStoreData(local)
  if (!lParsed.ok) throw new Error('planMerge: το τοπικό store δεν διαβάζεται· χρησιμοποίησε local: null (αντικατάσταση)')

  // Events: ένωση με βάση το id.
  const byId = new Map(local.events.map((e) => [e.id, e]))
  const events = [...local.events]
  for (const ev of f.events) {
    const prev = byId.get(ev.id)
    if (!prev) {
      events.push(ev)
      byId.set(ev.id, ev)
    } else if (!sameEvent(prev, ev)) errors.push(`το event ${ev.id} υπάρχει ήδη με διαφορετικό περιεχόμενο`)
  }

  // State: namespaces υποστηριζόμενων μαθημάτων + opaque.
  const own = new Set(supported.flatMap(nsKeys))
  const state = {}
  const opaque = []
  for (const key of new Set([...Object.keys(local.state), ...Object.keys(f.state)])) {
    if (own.has(key)) continue
    const inL = key in local.state
    const inF = key in f.state
    if (inL && !inF) state[key] = local.state[key]
    else if (!inL && inF) {
      state[key] = f.state[key]
      opaque.push({ key, change: 'added' })
    } else if (same(local.state[key], f.state[key])) state[key] = local.state[key]
    else {
      state[key] = f.state[key]
      opaque.push({ key, change: 'changed' })
    }
  }
  const replaced = {}
  for (const c of supported) {
    const m = mergeCourse(c, local.state, f.state, errors)
    if (!m) continue
    Object.assign(state, m.state)
    replaced[c] = m.replacedCorrupt
  }
  if (errors.length) throw new ImportRejected('Σύγκρουση ή άκυρα δεδομένα· δεν εισήχθη τίποτα', errors)
  // Σειρά κλειδιών: πρώτα όπως στο τοπικό store (import χωρίς σημασιολογική αλλαγή → ίδιες raw τιμές, καμία εγγραφή).
  const ordered = {}
  for (const k of [...Object.keys(local.state), ...Object.keys(state)]) if (k in state && !(k in ordered)) ordered[k] = state[k]
  for (const k of Object.keys(state)) delete state[k]
  Object.assign(state, ordered)

  const merged = parseStoreData({ events, state })
  if (!merged.ok) throw new ImportRejected('Το τελικό αποτέλεσμα δεν είναι έγκυρο· δεν εισήχθη τίποτα', merged.issues)
  const courses = []
  for (const c of supported) {
    const before = courseView(c, adapters[c], lParsed.byCourse.get(c) ?? [], local.state)
    const after = courseView(c, adapters[c], merged.byCourse.get(c) ?? [], state)
    if (after.status !== 'ready' && before.status === 'ready') errors.push(`${c}: θα γινόταν μη διαθέσιμο (${after.issues.join('; ')})`)
    else if (after.status !== 'ready') courses.push({ courseId: c, statusBefore: 'unavailable', statusAfter: 'unavailable', remainsUnavailable: true, loss: false, changed: false, issues: after.issues, warnings: [] })
    else courses.push(coursePreview(c, before, after, replaced[c] ?? [], local.state, state))
  }
  if (errors.length) throw new ImportRejected('Το import θα έκανε μάθημα μη διαθέσιμο· δεν εισήχθη τίποτα', errors)
  const requiresConfirmation = courses.some((p) => p.loss) || opaque.some((o) => o.change === 'changed')
  const localIds = new Set(local.events.map((e) => e.id))
  const added = new Set(f.events.filter((e) => !localIds.has(e.id)).map((e) => e.id))
  const warnings = [
    ...f.parsed.warnings,
    ...opaqueEventWarnings(merged, supported, added),
    ...courses.flatMap((p) => (p.warnings ?? []).map((w) => `${p.courseId}: ${w}`)),
  ]
  return { mode: 'merge', result: { events, state }, courses, opaque, requiresConfirmation, warnings }
}
