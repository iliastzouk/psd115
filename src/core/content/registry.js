/**
 * Ενιαίο registry περιεχομένου (Φάση 6d-α): από τα manifests μαθημάτων (συμβόλαιο: courseContract.js) στον κατάλογο του
 * routing και στο περιεχόμενο μελέτης. Pure: τα manifests περνούν ως παράμετρος· κανένα μάθημα στον κώδικα.
 *
 * Το σχήμα των αποτελεσμάτων είναι ΑΚΡΙΒΩΣ το σημερινό API (routing/catalog.js, study/content.js), ώστε οι consumers να
 * μην αλλάζουν: units με `route` (από το `legacy.route`) και `deck` (από το `slides.decks`) μόνο όπου δηλώνονται.
 */

const byOrder = (units) => [...units].sort((a, b) => a.order - b.order)

function indexById(manifests) {
  const seen = new Set()
  for (const m of manifests) {
    if (seen.has(m.id)) throw new Error(`Registry περιεχομένου: διπλό μάθημα «${m.id}»`)
    seen.add(m.id)
  }
  return manifests
}

function catalogUnit(m, u) {
  const out = { id: u.id, order: u.order, kind: u.kind, label: u.label, title: u.title }
  if (u.legacy?.route) out.route = u.legacy.route
  if (m.slides?.decks && Object.hasOwn(m.slides.decks, u.id)) out.deck = m.slides.decks[u.id]
  return out
}

/**
 * @param {readonly object[]} manifests
 * @returns {Readonly<Record<string, { course: { id, units, provenance }, topics, docs }>>}
 */
export function deriveCatalog(manifests) {
  return Object.freeze(
    Object.fromEntries(
      indexById(manifests).map((m) => [
        m.id,
        { course: { id: m.id, units: byOrder(m.units).map((u) => catalogUnit(m, u)), provenance: m.provenance }, topics: m.topics, docs: m.docs },
      ]),
    ),
  )
}

/**
 * @param {readonly object[]} manifests
 * @returns {Readonly<Record<string, { flashcards, quizQuestions, categories, getCategoryLabel,
 *   units: Record<string, { categories, examQuestions }> }>>}
 */
export function deriveStudyContent(manifests) {
  return Object.freeze(
    Object.fromEntries(
      indexById(manifests).map((m) => {
        const s = m.study
        const units = byOrder(m.units).map((u) => [u.id, Object.freeze({ categories: s.unitCategories[u.id], examQuestions: s.examQuestions[u.id] })])
        return [
          m.id,
          Object.freeze({
            flashcards: s.flashcards,
            quizQuestions: s.quizQuestions,
            categories: s.categories,
            getCategoryLabel: s.getCategoryLabel,
            units: Object.freeze(Object.fromEntries(units)),
          }),
        ]
      }),
    ),
  )
}
