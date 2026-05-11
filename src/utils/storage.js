const STORAGE_KEY = 'psd115-w1-study'

export function defaultProgress() {
  return {
    quizAnswered: 0,
    quizCorrect: 0,
    byCategory: {},
    flashcardSeenIds: [],
    wrongBook: [],
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const data = JSON.parse(raw)
    return {
      ...defaultProgress(),
      ...data,
      byCategory: data.byCategory && typeof data.byCategory === 'object' ? data.byCategory : {},
      flashcardSeenIds: Array.isArray(data.flashcardSeenIds) ? data.flashcardSeenIds : [],
      wrongBook: Array.isArray(data.wrongBook) ? data.wrongBook : [],
    }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    /* ignore quota / private mode */
  }
}

const DEF_CHECKLIST_KEY = 'psd115-w1-definition-checklist'

export function loadDefinitionChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(DEF_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveDefinitionChecklist(items) {
  try {
    localStorage.setItem(DEF_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetDefinitionChecklist() {
  try {
    localStorage.removeItem(DEF_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const WUNDT_CHECKLIST_KEY = 'psd115-w1-wundt-checklist'

export function loadWundtChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(WUNDT_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveWundtChecklist(items) {
  try {
    localStorage.setItem(WUNDT_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetWundtChecklist() {
  try {
    localStorage.removeItem(WUNDT_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const FUNCTIONALISM_CHECKLIST_KEY = 'psd115-w1-functionalism-checklist'

export function loadFunctionalismChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(FUNCTIONALISM_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveFunctionalismChecklist(items) {
  try {
    localStorage.setItem(FUNCTIONALISM_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetFunctionalismChecklist() {
  try {
    localStorage.removeItem(FUNCTIONALISM_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const PSYCHOANALYSIS_CHECKLIST_KEY = 'psd115-w1-psychoanalysis-checklist'

export function loadPsychoanalysisChecklist(length) {
  const n = typeof length === 'number' ? length : 7
  try {
    const raw = localStorage.getItem(PSYCHOANALYSIS_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function savePsychoanalysisChecklist(items) {
  try {
    localStorage.setItem(PSYCHOANALYSIS_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetPsychoanalysisChecklist() {
  try {
    localStorage.removeItem(PSYCHOANALYSIS_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const HUMANISTIC_CHECKLIST_KEY = 'psd115-w1-humanistic-checklist'

export function loadHumanisticChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(HUMANISTIC_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveHumanisticChecklist(items) {
  try {
    localStorage.setItem(HUMANISTIC_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetHumanisticChecklist() {
  try {
    localStorage.removeItem(HUMANISTIC_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const BEHAVIORISM_CHECKLIST_KEY = 'psd115-w1-behaviorism-checklist'

export function loadBehaviorismChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(BEHAVIORISM_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveBehaviorismChecklist(items) {
  try {
    localStorage.setItem(BEHAVIORISM_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetBehaviorismChecklist() {
  try {
    localStorage.removeItem(BEHAVIORISM_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const PAVLOV_CHECKLIST_KEY = 'psd115-w1-pavlov-checklist'

export function loadPavlovChecklist(length) {
  const n = typeof length === 'number' ? length : 9
  try {
    const raw = localStorage.getItem(PAVLOV_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function savePavlovChecklist(items) {
  try {
    localStorage.setItem(PAVLOV_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetPavlovChecklist() {
  try {
    localStorage.removeItem(PAVLOV_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const LITTLE_ALBERT_CHECKLIST_KEY = 'psd115-w1-little-albert-checklist'

export function loadLittleAlbertChecklist(length) {
  const n = typeof length === 'number' ? length : 4
  try {
    const raw = localStorage.getItem(LITTLE_ALBERT_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveLittleAlbertChecklist(items) {
  try {
    localStorage.setItem(LITTLE_ALBERT_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetLittleAlbertChecklist() {
  try {
    localStorage.removeItem(LITTLE_ALBERT_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const THORNDIKE_CHECKLIST_KEY = 'psd115-w1-thorndike-checklist'

export function loadThorndikeChecklist(length) {
  const n = typeof length === 'number' ? length : 4
  try {
    const raw = localStorage.getItem(THORNDIKE_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveThorndikeChecklist(items) {
  try {
    localStorage.setItem(THORNDIKE_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetThorndikeChecklist() {
  try {
    localStorage.removeItem(THORNDIKE_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const SKINNER_CHECKLIST_KEY = 'psd115-w1-skinner-checklist'

export function loadSkinnerChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(SKINNER_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveSkinnerChecklist(items) {
  try {
    localStorage.setItem(SKINNER_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetSkinnerChecklist() {
  try {
    localStorage.removeItem(SKINNER_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const COGNITIVE_CHECKLIST_KEY = 'psd115-w1-cognitive-checklist'

export function loadCognitiveChecklist(length) {
  const n = typeof length === 'number' ? length : 4
  try {
    const raw = localStorage.getItem(COGNITIVE_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveCognitiveChecklist(items) {
  try {
    localStorage.setItem(COGNITIVE_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetCognitiveChecklist() {
  try {
    localStorage.removeItem(COGNITIVE_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const CHOMSKY_CHECKLIST_KEY = 'psd115-w1-chomsky-checklist'

export function loadChomskyChecklist(length) {
  const n = typeof length === 'number' ? length : 4
  try {
    const raw = localStorage.getItem(CHOMSKY_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveChomskyChecklist(items) {
  try {
    localStorage.setItem(CHOMSKY_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetChomskyChecklist() {
  try {
    localStorage.removeItem(CHOMSKY_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const NEUROSCIENCE_CHECKLIST_KEY = 'psd115-w1-neuroscience-checklist'

export function loadNeuroscienceChecklist(length) {
  const n = typeof length === 'number' ? length : 6
  try {
    const raw = localStorage.getItem(NEUROSCIENCE_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveNeuroscienceChecklist(items) {
  try {
    localStorage.setItem(NEUROSCIENCE_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetNeuroscienceChecklist() {
  try {
    localStorage.removeItem(NEUROSCIENCE_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const GESTALT_CHECKLIST_KEY = 'psd115-w1-gestalt-checklist'

export function loadGestaltChecklist(length) {
  const n = typeof length === 'number' ? length : 4
  try {
    const raw = localStorage.getItem(GESTALT_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveGestaltChecklist(items) {
  try {
    localStorage.setItem(GESTALT_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetGestaltChecklist() {
  try {
    localStorage.removeItem(GESTALT_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const EVOLUTIONARY_CHECKLIST_KEY = 'psd115-w1-evolutionary-checklist'

export function loadEvolutionaryChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(EVOLUTIONARY_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveEvolutionaryChecklist(items) {
  try {
    localStorage.setItem(EVOLUTIONARY_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetEvolutionaryChecklist() {
  try {
    localStorage.removeItem(EVOLUTIONARY_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const SOCIAL_PSYCHOLOGY_CHECKLIST_KEY = 'psd115-w1-social-psychology-checklist'

export function loadSocialPsychologyChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(SOCIAL_PSYCHOLOGY_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveSocialPsychologyChecklist(items) {
  try {
    localStorage.setItem(SOCIAL_PSYCHOLOGY_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetSocialPsychologyChecklist() {
  try {
    localStorage.removeItem(SOCIAL_PSYCHOLOGY_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const EDUCATIONAL_PSYCHOLOGY_CHECKLIST_KEY = 'psd115-w1-educational-psychology-checklist'

export function loadEducationalPsychologyChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(EDUCATIONAL_PSYCHOLOGY_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveEducationalPsychologyChecklist(items) {
  try {
    localStorage.setItem(EDUCATIONAL_PSYCHOLOGY_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetEducationalPsychologyChecklist() {
  try {
    localStorage.removeItem(EDUCATIONAL_PSYCHOLOGY_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

const OTHER_BRANCHES_CHECKLIST_KEY = 'psd115-w1-other-branches-checklist'

export function loadOtherBranchesChecklist(length) {
  const n = typeof length === 'number' ? length : 5
  try {
    const raw = localStorage.getItem(OTHER_BRANCHES_CHECKLIST_KEY)
    if (!raw) return Array(n).fill(false)
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return Array(n).fill(false)
    while (arr.length < n) arr.push(false)
    return arr.slice(0, n).map((x) => Boolean(x))
  } catch {
    return Array(n).fill(false)
  }
}

export function saveOtherBranchesChecklist(items) {
  try {
    localStorage.setItem(OTHER_BRANCHES_CHECKLIST_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

function resetOtherBranchesChecklist() {
  try {
    localStorage.removeItem(OTHER_BRANCHES_CHECKLIST_KEY)
  } catch {
    /* ignore */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  resetDefinitionChecklist()
  resetWundtChecklist()
  resetFunctionalismChecklist()
  resetPsychoanalysisChecklist()
  resetHumanisticChecklist()
  resetBehaviorismChecklist()
  resetPavlovChecklist()
  resetLittleAlbertChecklist()
  resetThorndikeChecklist()
  resetSkinnerChecklist()
  resetCognitiveChecklist()
  resetChomskyChecklist()
  resetNeuroscienceChecklist()
  resetGestaltChecklist()
  resetEvolutionaryChecklist()
  resetSocialPsychologyChecklist()
  resetEducationalPsychologyChecklist()
  resetOtherBranchesChecklist()
  return defaultProgress()
}

const THEME_KEY = 'psd115-w1-theme'

export function loadTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'light'
}

export function saveTheme(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* ignore */
  }
}
