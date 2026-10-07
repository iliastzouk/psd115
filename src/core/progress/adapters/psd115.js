/**
 * PSD115 — content adapter της προόδου (Phase 1E-4a). Το ΜΟΝΟ σημείο του νέου progress layer που ξέρει
 * το περιεχόμενο και τα παλιά κλειδιά αποθήκευσης του PSD115:
 *   - ομάδα στατιστικών = categoryId της ερώτησης (questions.js)
 *   - θέματα = topics.js (canonical topicId · legacySlug μόνο για τα παλιά κλειδιά)
 *   - παλιά κλειδιά: psd115-w1-study · psd115-w1-<slug>-checklist (unit της Εβδ. 1)
 *                    psd115-w<N>-checklists = { slug: [...] } (unit της Εβδ. N ≥ 2)
 *                    psd115-w1-theme / psd115-disclaimer-v1 = ρυθμίσεις, όχι πρόοδος
 * Η εβδομάδα μιας unit διαβάζεται ΜΟΝΟ από το `route` του course.js (ρητά δεδομένα, όχι ανάλυση URL εφαρμογής).
 */
import { CATEGORIES, flashcards, quizQuestions } from '../../../../content/courses/psd115/questions.js'
import { course } from '../../../../content/courses/psd115/course.js'
import { topics } from '../../../../content/courses/psd115/topics.js'

const STUDY_KEY = 'psd115-w1-study'
const SETTINGS_KEYS = new Set(['psd115-w1-theme', 'psd115-disclaimer-v1'])
const BACKUP_PREFIX = 'psd115-backup-'
const W1_CHECKLIST_RE = /^psd115-w1-([a-z0-9-]+)-checklist$/
const WEEK_CHECKLISTS_RE = /^psd115-w([2-9])-checklists$/
const WEEK_ROUTE_RE = /^\/week\/(\d+)$/

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * @param {{ course: object, topics: object[], categories: { id: string }[], quizQuestions: object[], flashcards: object[] }} content
 *   (παραμετρικό ώστε τα tests να ελέγχουν π.χ. μετακίνηση θέματος σε άλλη unit)
 * @returns {import('../contentAdapter.js').ContentAdapter}
 */
export function createPsd115ProgressAdapter({ course: c, topics: tps, categories, quizQuestions: qs, flashcards: fcs }) {
  const groups = new Set(categories.map((x) => x.id))
  const groupByQuestion = new Map(qs.map((q) => [q.id, q.categoryId]))
  const cards = new Set(fcs.map((x) => x.id))
  const topicById = new Map(tps.map((t) => [t.id, t]))
  const weekOfUnit = new Map(
    c.units.map((u) => {
      const m = typeof u.route === 'string' ? u.route.match(WEEK_ROUTE_RE) : null
      return [u.id, m ? Number(m[1]) : null]
    }),
  )
  const unitOfWeek = (n) => [...weekOfUnit].find(([, w]) => w === n)?.[0] ?? null
  const topicFor = (unitId, slug) => tps.find((t) => t.unit === unitId && t.legacySlug === slug)?.id ?? null

  function parse(key, raw, errors) {
    try {
      return { ok: true, value: JSON.parse(raw) }
    } catch {
      errors.push(`${key}: μη έγκυρο JSON`)
      return { ok: false }
    }
  }

  const legacy = {
    decode(entries) {
      const errors = []
      const settings = []
      const checklists = []
      const unknown = []
      let study
      for (const key of Object.keys(entries).sort()) {
        const raw = entries[key]
        if (key === STUDY_KEY) {
          const p = parse(key, raw, errors)
          if (p.ok) study = p.value
          continue
        }
        if (SETTINGS_KEYS.has(key)) {
          settings.push(key)
          continue
        }
        if (key.startsWith(BACKUP_PREFIX)) {
          unknown.push(`${key}: τα αντίγραφα ασφαλείας δεν είναι πρόοδος`)
          continue
        }
        let m = key.match(W1_CHECKLIST_RE)
        if (m) {
          const p = parse(key, raw, errors)
          if (p.ok) checklists.push({ key, topicId: topicFor(unitOfWeek(1), m[1]), items: p.value })
          continue
        }
        m = key.match(WEEK_CHECKLISTS_RE)
        if (m) {
          const unitId = unitOfWeek(Number(m[1]))
          if (!unitId) {
            unknown.push(`${key}: άγνωστη εβδομάδα ${m[1]}`)
            continue
          }
          const p = parse(key, raw, errors)
          if (!p.ok) continue
          if (!isObj(p.value)) {
            errors.push(`${key}: αναμενόταν αντικείμενο slug → [true/false]`)
            continue
          }
          for (const [slug, items] of Object.entries(p.value)) checklists.push({ key: `${key}#${slug}`, topicId: topicFor(unitId, slug), items })
          continue
        }
        unknown.push(`${key}: άγνωστο κλειδί προόδου`)
      }
      return { study, checklists, settings, unknown, errors }
    },

    encode({ study, checklists }, { previous = {} } = {}) {
      const entries = { [STUDY_KEY]: JSON.stringify(study) }
      const weekly = {}
      // Slugs ενός εβδομαδιαίου κλειδιού που δεν αντιστοιχούν σε θέμα (orphan): κρατιούνται όπως ήταν.
      const keepOrphans = (key, unitId) => {
        if (weekly[key] || typeof previous[key] !== 'string') return
        try {
          const prev = JSON.parse(previous[key])
          if (!isObj(prev)) return
          for (const [slug, items] of Object.entries(prev)) if (!topicFor(unitId, slug)) (weekly[key] ??= {})[slug] = items
        } catch {
          /* μη αναγνώσιμο: δεν υπάρχει τίποτα να διατηρηθεί */
        }
      }
      const unprojected = []
      for (const [topicId, items] of Object.entries(checklists)) {
        const topic = topicById.get(topicId)
        const week = topic ? weekOfUnit.get(topic.unit) : null
        if (!week) {
          unprojected.push(topicId)
          continue
        }
        if (week === 1) entries[`psd115-w1-${topic.legacySlug}-checklist`] = JSON.stringify(items)
        else {
          const key = `psd115-w${week}-checklists`
          keepOrphans(key, topic.unit)
          ;(weekly[key] ??= {})[topic.legacySlug] = items
        }
      }
      for (const [key, obj] of Object.entries(weekly)) entries[key] = JSON.stringify(obj)
      return { entries, unprojected }
    },
  }

  return Object.freeze({
    courseId: c.id,
    hasGroup: (id) => groups.has(id),
    groupOf: (questionId) => groupByQuestion.get(questionId) ?? null,
    isQuestion: (id) => groupByQuestion.has(id),
    isCard: (id) => cards.has(id),
    hasTopic: (id) => topicById.has(id),
    legacy: Object.freeze(legacy),
  })
}

export const psd115ProgressAdapter = createPsd115ProgressAdapter({ course, topics, categories: CATEGORIES, quizQuestions, flashcards })
