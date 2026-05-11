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

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  resetDefinitionChecklist()
  resetWundtChecklist()
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
