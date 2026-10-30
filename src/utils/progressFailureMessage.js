/**
 * Μήνυμα αποτυχίας reset/import ανά ΠΡΑΓΜΑΤΙΚΟ αποτέλεσμα (Φάση 1, D2). «Η πρόοδος δεν άλλαξε» λέγεται ΜΟΝΟ όταν
 * είναι επιβεβαιωμένο: αποτυχία backup, άρνηση πριν από κάθε εγγραφή (`not-started`, εκκρεμές σημάδι), επαληθευμένη
 * αναίρεση (`rolled-back`). Για `rollback-incomplete` και άγνωστα σφάλματα δεν υπόσχεται ούτε διατήρηση ούτε ανάκτηση.
 */
const NOUN = { reset: 'η επαναφορά', import: 'η εισαγωγή' }
const TITLE = { reset: 'Η επαναφορά', import: 'Η εισαγωγή' }

/**
 * Μήνυμα της ασφαλούς λειτουργίας (global degraded, Φάση 6a J4) ανά αιτία. Καμία αλλαγή δεν αποθηκεύεται σε καμία.
 * @param {'corrupt' | 'pending' | 'unrecoverable' | 'no-storage' | null} reason
 */
export function describeDegraded(reason) {
  if (reason === 'pending') return 'Μια προηγούμενη αλλαγή αποθήκευσης δεν ολοκληρώθηκε. Οι αλλαγές προόδου δεν αποθηκεύονται· επαναφόρτωσε τη σελίδα για να γίνει ανάκτηση.'
  if (reason === 'unrecoverable') {
    return 'Μια μη ολοκληρωμένη αλλαγή αποθήκευσης δεν μπορεί να ανακτηθεί αυτόματα. Οι αλλαγές προόδου δεν αποθηκεύονται και δεν επιτρέπεται εισαγωγή ή επαναφορά· η εξαγωγή κατεβάζει τα δεδομένα αυτούσια.'
  }
  if (reason === 'no-storage') return 'Ο browser δεν επιτρέπει αποθήκευση· η μελέτη συνεχίζεται χωρίς αποθήκευση προόδου.'
  return 'Οι αλλαγές προόδου δεν αποθηκεύονται όσο η πρόοδος δεν μπορεί να διαβαστεί με ασφάλεια. Μπορείς να την αντικαταστήσεις από αντίγραφο (εισαγωγή), μετά από αυτόματο αντίγραφο ασφαλείας των τρεχόντων δεδομένων.'
}

/**
 * @param {'reset' | 'import'} action
 * @param {unknown} error ό,τι πέταξε το resetProgressSafely / importWithBackup
 * @returns {string}
 */
export function describeProgressFailure(action, error) {
  const e = /** @type {{ name?: string, outcome?: string, reason?: string }} */ (error ?? {})
  if (e.name === 'StaleImportError') return 'Η τοπική πρόοδος άλλαξε μετά την προεπισκόπηση (π.χ. από άλλο tab)· δεν εισήχθη τίποτα. Έλεγξε ξανά την προεπισκόπηση.'
  if (e.name === 'ImportRejected') return `Το αρχείο απορρίφθηκε· η πρόοδος δεν άλλαξε. ${error.message}`
  if (e.name === 'ProgressActionError') {
    return e.reason === 'corrupt' ? `Η πρόοδος δεν διαβάζεται με ασφάλεια· ${NOUN[action]} δεν επιτρέπεται. Η πρόοδος δεν άλλαξε.` : `Το μάθημα δεν έχει πρόοδο· ${NOUN[action]} δεν έγινε.`
  }
  if (e.name === 'BackupError') {
    return `Δεν δημιουργήθηκε επιβεβαιωμένο αντίγραφο ασφαλείας· ${NOUN[action]} ακυρώθηκε και η πρόοδος δεν άλλαξε.`
  }
  if (e.name === 'PendingTransactionError') {
    return e.reason === 'pending'
      ? 'Εκκρεμεί ανάκτηση· επαναφόρτωσε τη σελίδα πριν δοκιμάσεις ξανά.'
      : `Η κατάσταση αποθήκευσης δεν μπόρεσε να ελεγχθεί· ${NOUN[action]} ακυρώθηκε.`
  }
  if (e.outcome === 'rollback-incomplete') {
    return 'Η αλλαγή δεν ολοκληρώθηκε με ασφάλεια. Επαναφόρτωσε τη σελίδα για να επιχειρηθεί ανάκτηση.'
  }
  if (e.outcome === 'not-started' || e.outcome === 'rolled-back') {
    return action === 'import' ? 'Η εισαγωγή απέτυχε· η πρόοδος δεν άλλαξε.' : 'Η επαναφορά δεν ολοκληρώθηκε· η πρόοδος δεν άλλαξε.'
  }
  return `${TITLE[action]} απέτυχε. Επαναφόρτωσε τη σελίδα και έλεγξε την πρόοδό σου πριν δοκιμάσεις ξανά.`
}

/**
 * Ειδοποίηση αποτυχίας αποθήκευσης προόδου ΧΩΡΙΣ εκκρεμές σημάδι (Φάση 2). Η αλλαγή δεν εφαρμόστηκε και δεν θα
 * επαναληφθεί αυτόματα· ο χρήστης πρέπει να την επαναλάβει.
 * @param {'quota' | 'other'} kind
 */
export function describeWriteFailure(kind) {
  return kind === 'quota'
    ? 'Η τελευταία αλλαγή δεν αποθηκεύτηκε: ο χώρος αποθήκευσης του browser φαίνεται γεμάτος. Ελευθέρωσε χώρο και επανάλαβε την ενέργεια.'
    : 'Η τελευταία αλλαγή δεν αποθηκεύτηκε. Η μελέτη συνεχίζεται, αλλά η αλλαγή αυτή δεν θα επαναληφθεί αυτόματα. Επανέλαβέ την όταν η αποθήκευση λειτουργεί κανονικά.'
}

const DETAIL_LIMIT = 50
const local = (item) => item.slice(item.indexOf('/') + 1)
const items = (list, fmt) => {
  const out = list.slice(0, DETAIL_LIMIT).map(fmt)
  if (list.length > DETAIL_LIMIT) out.push(`… και ${list.length - DETAIL_LIMIT} ακόμη`)
  return out
}
const eventLabel = (e) => `${e.kind === 'answer' ? `απάντηση (${e.ok === 1 ? 'σωστή' : 'λάθος'})` : e.kind === 'flip' ? 'κάρτα' : e.kind}/${e.ctx} · ${local(e.item)} · ${e.id}`
const flags = (xs) => (xs ? xs.map((x) => (x ? '✓' : '·')).join('') : '—')

/**
 * Κείμενο προεπισκόπησης import (Φάση 6a, J6· review #18): ανά μάθημα σύνοψη ΚΑΙ λεπτομέρειες με τα ίδια τα στοιχεία —
 * ποιες καταγραφές (id, ερώτηση/κάρτα, τύπος), κάρτες, λάθη (ερώτηση) και checklists προστίθενται, κρύβονται, αλλάζουν —
 * μαζί με τις προειδοποιήσεις (orphan, μαθήματα χωρίς υποστήριξη), ακόμα κι όταν δεν επηρεάζουν τους μετρητές.
 * @param {ReturnType<typeof import('../core/progress/importMerge.js').planMerge>} plan
 * @param {{ courseLabel?: (courseId: string) => string }} [opts]
 * @returns {{ summary: string, lines: string[], details: { courseId: string, title: string, sections: { title: string, items: string[] }[] }[], warnings: string[] }}
 */
export function describeImportPlan(plan, { courseLabel = (c) => c } = {}) {
  const lines = []
  const details = []
  for (const p of plan.courses) {
    const name = courseLabel(p.courseId)
    if (p.remainsUnavailable) {
      lines.push(`${name}: παραμένει μη διαθέσιμο (η πρόοδός του δεν διαβάζεται με ασφάλεια)`)
      continue
    }
    if (!p.changed) {
      lines.push(`${name}: καμία αλλαγή${p.warnings?.length ? ' (βλ. προειδοποιήσεις)' : ''}`)
      if (p.warnings?.length) details.push({ courseId: p.courseId, title: name, sections: [{ title: 'Προειδοποιήσεις (κρατιούνται, δεν μετρούν)', items: items(p.warnings, (w) => w) }] })
      continue
    }
    const parts = []
    if (p.statusBefore === 'unavailable') parts.push('η τοπική πρόοδος δεν διαβάζεται· θα αντικατασταθεί από το αρχείο')
    if (p.replacedCorrupt?.length) parts.push(`αντικαθίστανται κατεστραμμένα δεδομένα (${p.replacedCorrupt.length})`)
    parts.push(`κουίζ ${p.quiz.before.correct}/${p.quiz.before.answered} → ${p.quiz.after.correct}/${p.quiz.after.answered}`)
    if (p.events.added.length) parts.push(`+${p.events.added.length} καταγραφές`)
    if (p.events.hidden.length) parts.push(`${p.events.hidden.length} τοπικές καταγραφές ΔΕΝ θα υπολογίζονται`)
    if (p.cards.added.length) parts.push(`+${p.cards.added.length} κάρτες`)
    if (p.cards.hidden.length) parts.push(`${p.cards.hidden.length} κάρτες δεν θα μετρούν πια`)
    if (p.wrongBook.added.length) parts.push(`+${p.wrongBook.added.length} λάθη`)
    if (p.wrongBook.removed.length) parts.push(`${p.wrongBook.removed.length} λάθη αφαιρούνται`)
    const changed = p.checklists.filter((c) => c.before !== null)
    const added = p.checklists.filter((c) => c.before === null)
    if (added.length) parts.push(`+${added.length} checklists`)
    if (changed.length) parts.push(`αλλάζουν τα checklists: ${changed.map((c) => c.topicId).join(', ')}`)
    if (p.reset.before !== p.reset.after) parts.push(`μηδενισμός προόδου: ${p.reset.before ?? '—'} → ${p.reset.after ?? '—'}`)
    lines.push(`${name}: ${parts.join(' · ')}`)
    const sections = [
      { title: 'Καταγραφές που ΔΕΝ θα υπολογίζονται (πριν από τον μηδενισμό)', items: items(p.events.hidden, eventLabel) },
      { title: 'Κάρτες που δεν θα μετρούν πια', items: items(p.cards.hidden, local) },
      { title: 'Λάθη που αφαιρούνται', items: items(p.wrongBook.removed, (w) => `${w.question} · ${w.uid}`) },
      { title: 'Checklists που αλλάζουν', items: items(changed, (c) => `${c.topicId}: ${flags(c.before)} → ${flags(c.after)}`) },
      { title: 'Κατεστραμμένα δεδομένα που αντικαθίστανται', items: items(p.replacedCorrupt ?? [], (k) => k) },
      { title: 'Καταγραφές που προστίθενται', items: items(p.events.added, eventLabel) },
      { title: 'Κάρτες που προστίθενται', items: items(p.cards.added, local) },
      { title: 'Λάθη που προστίθενται', items: items(p.wrongBook.added, (w) => `${w.question} · ${w.uid}`) },
      { title: 'Checklists που προστίθενται', items: items(added, (c) => `${c.topicId}: ${flags(c.after)}`) },
      { title: 'Προειδοποιήσεις (κρατιούνται, δεν μετρούν)', items: items(p.warnings ?? [], (w) => w) },
    ].filter((x) => x.items.length)
    details.push({ courseId: p.courseId, title: name, sections })
  }
  for (const o of plan.opaque ?? []) lines.push(`${o.change === 'changed' ? 'Αλλάζει' : 'Προστίθεται'} το «${o.key}» (δεδομένα χωρίς υποστήριξη σε αυτή την έκδοση)`)
  const summary =
    plan.mode === 'replace'
      ? 'Η τρέχουσα πρόοδος δεν διαβάζεται με ασφάλεια και θα ΑΝΤΙΚΑΤΑΣΤΑΘΕΙ πλήρως από το αρχείο. Πριν, κατεβαίνει αυτούσιο αντίγραφο των τρεχόντων δεδομένων.'
      : plan.requiresConfirmation
        ? 'Η εισαγωγή αφαιρεί, κρύβει ή αλλάζει τοπικά δεδομένα (βλ. παρακάτω). Πριν, κατεβαίνει αντίγραφο ασφαλείας.'
        : 'Η εισαγωγή μόνο προσθέτει δεδομένα. Πριν, κατεβαίνει αντίγραφο ασφαλείας.'
  return { summary, lines, details, warnings: plan.warnings ?? [] }
}
