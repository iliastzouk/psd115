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

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
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
