/**
 * React πρόσβαση στο ProgressService (Phase 1E-4b). Το service δημιουργείται και εγκαθίσταται ΜΙΑ φορά στο
 * main.jsx, πριν από το render· εδώ μόνο διαβάζεται, μέσω useSyncExternalStore (ένα snapshot για όλους).
 * Κανένα component δεν διαβάζει/γράφει την πρόοδο από το storage.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useRouteIdentity } from '../core/routing/hooks.js'
import { createdServiceCount } from '../core/progress/progressService.js'

let installed = null

/** Μόνο από το main.jsx, μία φορά. Δεύτερη κλήση → σφάλμα (ποτέ δεύτερο instance). */
export function installProgressService(service) {
  if (installed) throw new Error('ProgressService: έχει ήδη εγκατασταθεί')
  installed = service
  if (PROBE) PROBE.installed += 1
}

export function getProgressService() {
  if (!installed) throw new Error('ProgressService: δεν έχει εγκατασταθεί (main.jsx)')
  return installed
}

/** Ολόκληρο το ProgressState (ίδιο αντικείμενο για όλους τους consumers μέχρι την επόμενη αλλαγή). */
export function useProgress(consumer = 'progress') {
  const service = getProgressService()
  const state = useSyncExternalStore(service.subscribe, service.getSnapshot)
  if (PROBE) PROBE.record(consumer, state)
  return state
}

/** Snapshot ενός μαθήματος (ή null αν δεν υπάρχει). */
export function useCourseProgress(courseId, consumer = 'course') {
  return useProgress(consumer).courses[courseId] ?? null
}

/** Ίδια κανονικοποίηση με τα παλιά checklists: συμπλήρωση με false / αποκοπή στο μήκος του περιεχομένου. */
export function normalizeChecklist(items, length) {
  const out = (Array.isArray(items) ? items : []).slice(0, length).map(Boolean)
  while (out.length < length) out.push(false)
  return out
}

/**
 * Checklist ενός θέματος (canonical topicId). Απόν = όλα false. Καμία εγγραφή στο mount· εγγραφή μόνο σε αλλαγή.
 * @returns {[boolean[], (next: boolean[] | ((prev: boolean[]) => boolean[])) => void]}
 */
export function useChecklist(courseId, topicId, length) {
  const course = useCourseProgress(courseId, 'checklist')
  const stored = course?.checklists[topicId]?.items
  const items = useMemo(() => normalizeChecklist(stored, length), [stored, length])
  const set = useCallback(
    (next) => {
      const service = getProgressService()
      const prev = normalizeChecklist(service.getSnapshot().courses[courseId]?.checklists[topicId]?.items, length)
      service.setChecklist(topicId, typeof next === 'function' ? next(prev) : next)
    },
    [courseId, topicId, length],
  )
  return [items, set]
}

/** Checklist του θέματος της τρέχουσας διαδρομής (topicId από το canonical route identity). */
export function useTopicChecklist(length) {
  const id = useRouteIdentity()
  if (id.kind !== 'topic') throw new Error('useTopicChecklist: χρησιμοποιείται μόνο σε σελίδα θέματος')
  return useChecklist(id.courseId, id.topicId, length)
}

// ---- Smoke build μόνο (VITE_PROGRESS_SMOKE=1): καταγραφή ταυτότητας snapshot ανά consumer. Όχι στο production. ----
const PROBE =
  // Χωρίς `?.`: το Vite αντικαθιστά στατικά το import.meta.env.VITE_* ώστε το probe να αφαιρείται από το production.
  typeof import.meta.env !== 'undefined' && import.meta.env.VITE_PROGRESS_SMOKE === '1' && typeof window !== 'undefined'
    ? (() => {
        const ids = new WeakMap()
        let nextId = 0
        const probe = {
          installed: 0,
          reads: [],
          record(consumer, state) {
            if (!ids.has(state)) ids.set(state, ++nextId)
            probe.reads.push({ consumer, id: ids.get(state) })
          },
          snapshot: () => installed?.getSnapshot(),
          created: () => createdServiceCount(),
          idOf: (state) => ids.get(state) ?? null,
        }
        window.__progressProbe = probe
        return probe
      })()
    : null
