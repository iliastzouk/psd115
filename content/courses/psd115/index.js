/**
 * PSD115 — manifest μαθήματος (Φάση 6d-α, συμβόλαιο: src/core/content/courseContract.js).
 *
 * Adapter: δένει τα ΥΠΑΡΧΟΝΤΑ modules (course.js, topics.js, sources.js, questions.js, units/k1–k4) σε ένα manifest,
 * χωρίς να αλλάζει κανένα αρχείο περιεχομένου. Οι παλιές διαδρομές /week/N δηλώνονται ρητά (`legacy.route`)· τα decks
 * των διαφανειών στο `slides.decks`, οι διαφάνειες κάθε θέματος στο `slides.byTopic` (adapter από τους υπάρχοντες
 * πίνακες ανά legacy διαδρομή K{n}_PPT_SLIDES_BY_ROUTE).
 */
import { course } from './course.js'
import { topics } from './topics.js'
import { sources } from './sources.js'
import { CATEGORIES, WEEK1_CATEGORIES, WEEK2_CATEGORIES, WEEK3_CATEGORIES, WEEK4_CATEGORIES, flashcards, getCategoryLabel, quizQuestions } from './questions.js'
import { getWeek1ExamQuestions } from './units/k1/index.js'
import { getWeek2ExamQuestions } from './units/k2/index.js'
import { getWeek3ExamQuestions } from './units/k3/index.js'
import { getWeek4ExamQuestions } from './units/k4/index.js'
import { K1_PPT_SLIDES_BY_ROUTE } from './units/k1/k1PptRefsByRoute.js'
import { K2_PPT_SLIDES_BY_ROUTE } from './units/k2/k2PptRefsByRoute.js'
import { K3_PPT_SLIDES_BY_ROUTE } from './units/k3/k3PptRefsByRoute.js'
import { K4_PPT_SLIDES_BY_ROUTE } from './units/k4/k4PptRefsByRoute.js'

const SLIDES_BY_ROUTE = { k1: K1_PPT_SLIDES_BY_ROUTE, k2: K2_PPT_SLIDES_BY_ROUTE, k3: K3_PPT_SLIDES_BY_ROUTE, k4: K4_PPT_SLIDES_BY_ROUTE }
const routeOf = Object.fromEntries(course.units.map((u) => [u.id, u.route]))
const byTopic = Object.fromEntries(
  topics.map((t) => [t.id, SLIDES_BY_ROUTE[t.unit][`${routeOf[t.unit]}/${t.legacySlug}`]]).filter(([, slides]) => slides),
)

export const psd115 = {
  id: course.id,
  units: course.units.map(({ id, order, kind, label, title, route }) => ({ id, order, kind, label, title, legacy: { route } })),
  topics,
  study: {
    categories: CATEGORIES,
    unitCategories: { k1: WEEK1_CATEGORIES, k2: WEEK2_CATEGORIES, k3: WEEK3_CATEGORIES, k4: WEEK4_CATEGORIES },
    flashcards,
    quizQuestions,
    getCategoryLabel,
    examQuestions: { k1: getWeek1ExamQuestions, k2: getWeek2ExamQuestions, k3: getWeek3ExamQuestions, k4: getWeek4ExamQuestions },
  },
  docs: sources,
  slides: { decks: Object.fromEntries(course.units.map((u) => [u.id, u.deck])), byTopic },
  provenance: course.provenance,
}
