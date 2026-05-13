/**
 * Removes K2 slide-number citations from week2/topicsData.js user-facing strings.
 * Does NOT collapse spaces (preserves indentation).
 */
import fs from 'fs'

const url = new URL('../src/data/week2/topicsData.js', import.meta.url)
let s = fs.readFileSync(url, 'utf8')

const slideNum = String.raw`[\d\u2013\u2014\-]+`

s = s.replace(/pptRange: 'Διαφάνειες K2:[^']*'/g, "pptRange: ''")

s = s.replace(new RegExp(String.raw`\s*\(διαφ\.\s*${slideNum}(?:\s*,\s*K2)?\)`, 'g'), '')
s = s.replace(new RegExp(String.raw`\s*\(διαφ\.\s*${slideNum}\)`, 'g'), '')

s = s.replace(new RegExp(String.raw`\s*[—–-]\s*διαφ\.\s*${slideNum}`, 'g'), '')

s = s.replace(new RegExp(String.raw`\s+στην?\s+διαφ\.\s*${slideNum}`, 'g'), '')
s = s.replace(new RegExp(String.raw`\s+στη\s+διαφ\.\s*${slideNum}\s*:`, 'g'), '')
s = s.replace(new RegExp(String.raw`\s+τη\s+διαφ\.\s*${slideNum}`, 'g'), '')

s = s.replace(
  new RegExp(String.raw`σύμφωνα\s+με\s+τη\s+διαφ\.\s*${slideNum}`, 'gi'),
  'σύμφωνα με το μάθημα',
)
s = s.replace(
  new RegExp(String.raw`σύμφωνα\s+με\s+την\s+διαφ\.\s*${slideNum}`, 'gi'),
  'σύμφωνα με το μάθημα',
)

s = s.replace(new RegExp(String.raw`Η\s+διαφ\.\s*${slideNum}\s+τιτλοφορεί`, 'g'), 'Η παρουσίαση τιτλοφορεί')
s = s.replace(new RegExp(String.raw`Η\s+διαφ\.\s*${slideNum}\s+θέτει`, 'g'), 'Επίσης εξετάζονται')
s = s.replace(new RegExp(String.raw`Η\s+διαφ\.\s*${slideNum}\s+είναι\s+ήδη\s+η\s+επόμενη\s+ενότητα`, 'g'), 'Η επόμενη ενότητα')

s = s.replace(new RegExp(String.raw`Η\s+διαφ\.\s*${slideNum}\s*:`, 'g'), 'Σχετικά:')

s = s.replace(new RegExp(String.raw`διαφ\.\s*${slideNum}\b`, 'g'), '')

s = s.replace(/\bΤο\s+deck\b/g, 'Το υλικό')
s = s.replace(/\bστο\s+slide\b/gi, 'στην παρουσίαση')
s = s.replace(/\bΠαράδειγμα\s+στο\s+slide\b/gi, 'Παράδειγμα')
s = s.replace(/\bΤο\s+slide\b/gi, 'Η παρουσίαση')
s = s.replace(/\bστο\s+εξαγόμενο\s+κείμενο\b/g, 'στο υλικό')

s = s.replace(/\s*\(K2\s*31–34\)/g, '')
s = s.replace(/\bδιαφάνειες\s+K2\b/gi, 'το υλικό του μαθήματος')

s = s.replace(/Ροή\s*\(όπως\s+στη\s+διαφάνεια\)/g, 'Ροή')

const pairs = [
  [/Σύμφωνα με το K2/g, 'Σύμφωνα με το μάθημα'],
  [/σύμφωνα με το K2/g, 'σύμφωνα με το μάθημα'],
  [/Περιγράψτε τη διαφορά περιγραφικής και επαγωγικής στατιστικής όπως στο K2\./g, 'Περιγράψτε τη διαφορά περιγραφικής και επαγωγικής στατιστικής όπως στο μάθημα.'],
  [/Στο K2 και/g, 'Στο μάθημα και'],
  [/Στο K2 η/g, 'Στο μάθημα η'],
  [/Στο K2 οι/g, 'Στο μάθημα οι'],
  [/Στο K2 το/g, 'Στο μάθημα το'],
  [/Στο K2 τονίζεται/g, 'Τονίζεται στο μάθημα'],
  [/Στο K2 ορίζεται/g, 'Ορίζεται στο μάθημα'],
  [/Στο K2 λέει/g, 'Το μάθημα λέει'],
  [/Στο K2 εδώ/g, 'Σε αυτήν την ενότητα'],
  [/Στο K2:/g, 'Στο μάθημα:'],
  [/Στο K2 /g, 'Στο μάθημα '],
  [/Όπως στο K2/g, 'Στο πλαίσιο του μαθήματος'],
  [/όπως στο K2/g, 'στο πλαίσιο του μαθήματος'],
  [/όπως στο μάθημα/g, 'όπως παρουσιάζεται στο μάθημα'],
  [/στο K2/g, 'στο μάθημα'],
  [/Το K2 /g, 'Το μάθημα '],
  [/Ο ορισμός στο μάθημα/g, 'Ο ορισμός στο μάθημα'],
  [/Στο μάθημα και στη συνέχεια της διάλεξης/g, 'Στη διάλεξη'],
  [/σύμφωνα με το μάθημα, η διπλά τυφλή/g, 'Η διπλά τυφλή'],
  [/Σύμφωνα με το μάθημα, η διπλά τυφλή/g, 'Η διπλά τυφλή'],
]

for (const [re, rep] of pairs) {
  s = s.replace(re, rep)
}

s = s.replace(/\(γενική γνώση · όχι ρητά όλα στο K2 slide text\)/g, '(γενική γνώση)')

s = s.replace(/\s+στις\s+,/g, ',')
s = s.replace(/\s+στο\s+,/g, ',')
s = s.replace(/\s{2,}([·,.])/g, ' $1')
s = s.replace(/\.\s*\./g, '.')

fs.writeFileSync(url, s)
console.log('Updated', url.pathname)
