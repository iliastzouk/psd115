/**
 * Ρυθμίσεις (Phase 1E-4b): theme και disclaimer. ΔΕΝ είναι πρόοδος μάθησης — εκτός ProgressService/snapshot.
 *
 * - initSettings(): μία σύγχρονη ανάγνωση στο main.jsx, ΠΡΙΝ από το render· η κλάση `dark` μπαίνει πριν από
 *   το πρώτο paint.
 * - Εγγραφή μόνο όταν ο χρήστης αλλάζει ρύθμιση. Καμία εγγραφή στο boot.
 * Ίδια κλειδιά και τιμές με πριν (`psd115-w1-theme` = light | dark, `psd115-disclaimer-v1` = 1).
 */
import { useSyncExternalStore } from 'react'

const THEME_KEY = 'psd115-w1-theme'
const DISCLAIMER_KEY = 'psd115-disclaimer-v1'

let storage = null
let root = null
let theme = 'light'
let disclaimer = false
const listeners = new Set()

function read(key) {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    storage?.setItem(key, value)
  } catch {
    /* quota / private mode: η ρύθμιση ισχύει για αυτή τη συνεδρία */
  }
}

/** @param {Storage | undefined} s @param {HTMLElement | undefined} documentElement */
export function initSettings(s, documentElement) {
  storage = s ?? null
  root = documentElement ?? null
  theme = read(THEME_KEY) === 'dark' ? 'dark' : 'light'
  disclaimer = read(DISCLAIMER_KEY) === '1'
  root?.classList.toggle('dark', theme === 'dark')
}

export const getTheme = () => theme

/** @param {'light' | 'dark'} mode */
export function setTheme(mode) {
  const next = mode === 'dark' ? 'dark' : 'light'
  if (next === theme) return
  theme = next
  root?.classList.toggle('dark', theme === 'dark')
  write(THEME_KEY, theme)
  for (const l of [...listeners]) l()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** @returns {'light' | 'dark'} */
export const useTheme = () => useSyncExternalStore(subscribe, getTheme)

export const hasAcceptedDisclaimer = () => disclaimer

export function acceptDisclaimer() {
  if (disclaimer) return
  disclaimer = true
  write(DISCLAIMER_KEY, '1')
}
