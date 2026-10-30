/**
 * Έλεγχος αρχείου εξαγωγής προόδου στη νέα μορφή (`study-progress`, Φάση 6a), όπως το κατεβάζει το «Εξαγωγή προόδου».
 * Ίδιοι κανόνες με το import της εφαρμογής (J4/J6): μορφή, events, namespaces και πρόοδος ΚΑΘΕ υποστηριζόμενου μαθήματος.
 * Δεν γράφει τίποτα. Run: node scripts/validate-progress-export.mjs <file.json>
 */
import fs from 'fs'
import { planMerge } from '../src/core/progress/importMerge.js'
import { studyContentAdapters } from '../src/core/progress/adapters/studyContent.js'

const file = process.argv[2]
if (!file) {
  console.error('Χρήση: node scripts/validate-progress-export.mjs <αρχείο.json>')
  process.exit(2)
}

let data
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch (e) {
  console.error(`✗ ${file}: δεν διαβάζεται ως JSON (${e.message})`)
  process.exit(1)
}

let plan
try {
  // Σαν import σε άδειο store: όλα τα δεδομένα του αρχείου πρέπει να δίνουν έγκυρη πρόοδο.
  plan = planMerge({ local: { events: [], state: {} }, file: data, adapters: studyContentAdapters() })
} catch (e) {
  console.error(`✗ ${file}: ${e.message}`)
  for (const d of e.details ?? []) console.error(`  - ${d}`)
  process.exit(1)
}
for (const w of plan.warnings) console.warn(`⚠ ${w}`)
const lines = plan.courses.map((p) => `${p.courseId}: κουίζ ${p.quiz.after.correct}/${p.quiz.after.answered} · κάρτες ${p.cards.added.length} · λάθη ${p.wrongBook.added.length} · checklists ${p.checklists.length}`)
console.log(`✓ ${file}: ${data.events.length} events · ${Object.keys(data.state).length} κλειδιά state · ${lines.join(' · ')}`)
