/**
 * Έλεγχος αρχείου εξαγωγής προόδου (όπως το κατεβάζει το «Εξαγωγή προόδου»).
 * Δεν γράφει τίποτα. Run: node scripts/validate-progress-export.mjs <file.json>
 */
import fs from 'fs'
import { validateExport } from '../src/utils/progressValidate.js'

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

const r = validateExport(data)
for (const w of r.warnings) console.warn(`⚠ ${w}`)
if (!r.ok) {
  console.error(`✗ ${file}: ${r.errors.length} σφάλμα(τα)`)
  for (const e of r.errors) console.error(`  - ${e}`)
  process.exit(1)
}
const s = r.stats
console.log(
  `✓ ${file}: ${s.keys} κλειδιά (${s.bytes} χαρακτήρες) · κουίζ ${s.quizCorrect}/${s.quizAnswered} · ` +
    `κάρτες ${s.flashcardsSeen} · λάθη ${s.wrongAnswers} · checklist ${s.checklistItemsChecked}` +
    (r.unknownKeys.length ? ` · ${r.unknownKeys.length} άγνωστα κλειδιά` : ''),
)
