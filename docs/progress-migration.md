# Progress: από το σημερινό model σε append-only events

Κατάσταση: **σχέδιο** (Phase 0B). Η υποδομή υπάρχει στο `src/core/progress/`, αλλά η εφαρμογή **δεν** τη χρησιμοποιεί ακόμα. Δεν γίνεται καμία μεταφορά δεδομένων σε αυτό το phase.

## 1. Σημερινό model

Όλα στο `localStorage`, μέσω `src/utils/storage.js`:

| Κλειδί | Περιεχόμενο | Τύπος δεδομένων |
|---|---|---|
| `psd115-w1-study` | `quizAnswered`, `quizCorrect`, `byCategory{correct,wrong}`, `flashcardSeenIds[]`, `wrongBook[]` (έως 60) | **Αθροίσματα** + λίστα λαθών (αντίγραφο κειμένου) |
| `psd115-w1-*-checklist` (18) | `boolean[]` ανά θέμα της Εβδ. 1 | State |
| `psd115-w2/w3/w4-checklists` | `{ slug: boolean[] }` | State |
| `psd115-w1-theme` | `"dark"` / `"light"` | Ρύθμιση |
| `psd115-disclaimer-v1` | `"1"` | Ρύθμιση |
| `psd115-backup-*` | αντίγραφα ασφαλείας του Phase 0A | Όχι πρόοδος |

- Session state (τρέχον κουίζ, σειρά καρτών) ζει μόνο στη μνήμη (`useStudySession`).
- Τα mini κουίζ μέσα στα μαθήματα **δεν** καταγράφονται.
- Η εξέταση ανάπτυξης δεν καταγράφει τίποτα.
- Το σημερινό model κρατά μόνο αθροίσματα, όχι ιστορικό: δεν ξέρει πότε ή σε ποια ερώτηση έγινε κάθε απάντηση (εκτός από τα τελευταία 60 λάθη).

## 2. Νέο model

- `study-progress-events-v1`: append-only log. Κάθε event είναι `{ id, t, item, kind, ok?, grade?, conf?, ctx, session? }` (βλ. `src/core/progress/events.js`).
  - Υποχρεωτικά: `id` (UUID), `t` (Unix ms, από 2020, χωρίς άνω όριο), `item`, `kind`, `ctx`. Προαιρετικά: `ok`, `grade`, `conf`, `session`.
  - Ο έλεγχος είναι μόνο δομικός: κανένας κανόνας για το ποια προαιρετικά πεδία «πρέπει» να έχει κάθε `kind`.
  - `item`: σταθερό, μη κενό string. Το ακριβές format του global ID (π.χ. `psd115/q-w2-overview-1`) θα οριστεί στο Phase 1 μαζί με το Course/content model.
- `study-progress-state-v1`: μικρές μεταβλητές τιμές (checklists, ρυθμίσεις).
- Κανένα παράγωγο μέγεθος (ακρίβεια, mastery, weak topics, σύνολα, streak) δεν αποθηκεύεται. Όλα υπολογίζονται από τα events.
- Το API είναι async (`append`, `query`, `getState`, `setState`, `exportAll`, `importAll`). Έτσι μπορεί αργότερα να αλλάξει το backend (IndexedDB / server) χωρίς αλλαγές στους καλούντες.

## 3. Τι μπορεί να γίνει events

| Σημερινό δεδομένο | Γίνεται event; |
|---|---|
| Μελλοντικές απαντήσεις κουίζ | Ναι: `kind: 'answer'`, `ok`, `ctx: 'quiz'`, `session` |
| Μελλοντικές απαντήσεις σε mini κουίζ μαθημάτων | Ναι: `ctx: 'lesson'` (σήμερα χάνονται) |
| Μελλοντικές κάρτες | Ναι: `kind: 'flip'`, `grade` (σήμερα μόνο «είδα») |
| Μελλοντική εξέταση ανάπτυξης | Ναι: `kind: 'self'`, `grade`, `ctx: 'exam'` |
| **Ιστορικά** `quizAnswered` / `quizCorrect` / `byCategory` | **Όχι ακριβώς**: είναι αθροίσματα χωρίς ερώτηση και χωρίς χρόνο. Δεν επινοούμε events. |
| **Ιστορικό** `wrongBook` (έως 60) | Μερικώς: έχει `id` ερώτησης, αλλά όχι timestamp. |
| **Ιστορικό** `flashcardSeenIds` | Μερικώς: ποιες κάρτες είδες, χωρίς βαθμό ή χρόνο. |

**Απόφαση σχεδίου:** τα ιστορικά αθροίσματα **δεν** μετατρέπονται σε ψεύτικα events. Διατηρούνται ως **frozen legacy baseline** στο state κλειδί `legacy-baseline:psd115` (§9). Ό,τι βλέπει ο χρήστης = baseline + πραγματικά events μετά το migration + mutable state.

Για `wrongBook` και `flashcardSeenIds`: **μόνο στο legacy baseline** (απόφαση Phase 1E). Η παλιότερη ιδέα για
events με `t` = χρόνος του migration **απορρίφθηκε**: θα ήταν επινοημένα timestamps, δηλαδή ψεύτικο ιστορικό.
Το migration δεν δημιουργεί κανένα `answer`, `flip` ή `self` event.

**`wrongBook` = state** (και μετά τη μετάβαση): το event schema δεν κρατά την επιλεγμένη απάντηση (`userLabel`),
άρα η λίστα λαθών δεν μπορεί να είναι projection των `answer` events. Η επέκταση του schema είναι ξεχωριστή απόφαση.
Από events: μόνο στατιστικά κουίζ/καρτών. Σε state: `wrongBook`, checklists, reset marker και ό,τι άλλο UI state
δεν ανακατασκευάζεται αξιόπιστα από events.

## 4. Τι μένει state

- Checklists ανά θέμα, με κλειδί το canonical `topicId` (στο baseline: `progress.checklists[topicId]`).
- `wrongBook` (το event schema δεν κρατά την επιλεγμένη απάντηση).
- Reset marker `progress-reset:psd115` (όταν ενεργοποιηθεί ο νέος reader/writer).
- Θέμα (theme) και αποδοχή disclaimer μένουν στα legacy κλειδιά (δεν είναι πρόοδος).

## 5. Πώς μεταφέρεται η πρόοδος (Phase 1E-2: υλοποιημένο, ανενεργό)

1. Έλεγχος των τρεχόντων δεδομένων του νέου store· κατεστραμμένα → απόρριψη.
2. Αυστηρός έλεγχος των `psd115-*` (`buildLegacyBaseline`)· οποιοδήποτε σφάλμα → απόρριψη χωρίς εγγραφή.
3. Idempotency / conflict με το σημάδι (§6).
4. Safety backup v2 (legacy + νέο store).
5. **Μία** εγγραφή του `study-progress-state-v1` μέσω συναλλαγής: `legacy-baseline:psd115` + `migration:psd115-v1`.
   Το `study-progress-events-v1` **δεν γράφεται** (μηδέν events).
6. **Τα `psd115-*` κλειδιά ΔΕΝ αλλάζουν και δεν σβήνονται.** Μένουν για rollback.

Το migration (`src/utils/progressMigration.js`) είναι **off by default** (`LEGACY_BASELINE_MIGRATION_ENABLED = false`):
καμία οθόνη ή εκκίνηση δεν το καλεί, και χωρίς `enabled: true` δεν διαβάζει ούτε γράφει τίποτα.

## 6. Idempotency και conflict

- Ίδιο source hash με το υπάρχον σημάδι (και baseline) → **no-op** (`already-migrated`): κανένα baseline, σημάδι ή event δεν αλλάζει.
- Υπάρχει σημάδι με **διαφορετικό** source hash (π.χ. η legacy πρόοδος άλλαξε μετά το migration) → **ρητή άρνηση** (`conflict`), καμία εγγραφή.
- Υπάρχει baseline χωρίς σημάδι → άρνηση.
- Αρχικό migration (χωρίς σημάδι) με **μη κενό** `study-progress-events-v1` → άρνηση (`conflict`), καμία εγγραφή: το baseline
  δημιουργείται μόνο με απόν ή άδειο (`[]`) log, ώστε κανένα event να μη μετρηθεί και μέσα στο baseline και στο log.
  Μετά το migration, νέα events είναι αναμενόμενα και δεν επηρεάζουν το idempotent no-op.
- Δεν υπάρχουν legacy events, άρα δεν χρειάζονται ντετερμινιστικά event IDs.

## 7. Rollback

- Επειδή τα `psd115-*` μένουν ανέγγιχτα, rollback σημαίνει απλώς: η εφαρμογή ξαναδιαβάζει το παλιό model (αλλαγή κώδικα / feature flag).
- Το baseline περιέχει και το **αυτούσιο raw snapshot** (`raw`), ως forensic αναφορά.
- Ό,τι καταγράφηκε ως event μετά το migration δεν χάνεται. Δεν μεταφέρεται όμως πίσω στα παλιά αθροίσματα. Αυτό είναι αποδεκτό, γιατί το rollback είναι μέτρο έκτακτης ανάγκης.

## 8. Πώς αποφεύγουμε την απώλεια προόδου

- Backup (Phase 0A) πριν από το migration, και τα `psd115-*` δεν σβήνονται.
- Το νέο store:
  - δεν αντικαθιστά ποτέ κατεστραμμένα δεδομένα σιωπηλά,
  - απορρίπτει άκυρα events,
  - δεν αλλάζει ή σβήνει ιστορικά events,
  - κάνει εισαγωγές «όλα ή τίποτα».
- Κάθε ανάγνωση γίνεται από το storage (όχι cache). Αυτό περιορίζει τον κίνδυνο δύο tabs να γράψουν το ένα πάνω στο άλλο, που εντοπίστηκε στο Phase 0A.
- Το export v2 (Phase 1E-1) περιλαμβάνει και τα `study-progress-*` (§8 Backup v2).
- **Όριο μεγέθους:** κάθε `append` ξαναγράφει όλο το log (O(n)). Με ~80 bytes/event και όριο localStorage ~5MB, το trigger για IndexedDB είναι όταν το log ξεπεράσει ~1MB. Η αλλαγή αφορά μόνο το `progressStore.js`, χάρη στο async API.

## Εκτός scope (σκόπιμα)

- Το migration υπάρχει αλλά είναι ανενεργό (§5)· δεν έχει τρέξει στο production.
- Δεν υπάρχει σύνδεση με `useStudySession`.
- Δεν υπάρχει UI.
- Δεν υπάρχουν IndexedDB, Supabase ή αλγόριθμοι mastery / spaced repetition.
- Το `requestPersistentStorage()` (`src/core/progress/persist.js`) υπάρχει αλλά δεν καλείται ακόμα.

## 8. Backup v2 και ασφάλεια εγγραφών (Phase 1E-1)

Πριν γραφτεί οποιαδήποτε πραγματική εγγραφή στο `study-progress-*`, το backup καλύπτει και τα δύο μέρη:

```text
{ format: 'psd115-progress-export', version: 2, exportedAt, reason, source,
  keys:          { 'psd115-…': '<raw>' },                         // legacy, όπως το v1
  progressStore: { 'study-progress-events-v1': '<raw>', 'study-progress-state-v1': '<raw>' },  // μόνο όσα υπάρχουν
  migration:     { markerKey: 'migration:psd115-v1', marker: <από το state ή null> } }      // πληροφοριακό
```

- Το v1 (μόνο `keys`) γίνεται πάντα import.
- Import: έλεγχος όλων (legacy + νέο store, και των τρεχόντων δεδομένων του store) → υπολογισμός εγγραφών →
  safety backup v2 → συναλλαγή. Legacy: γράφονται τα κλειδιά του αρχείου, κανένα άλλο δεν σβήνεται. Νέο store:
  ίδιοι κανόνες με το `progressStore.importAll` (ένωση events, σύγκρουση id → απόρριψη όλων, state ανά κλειδί).
- Reset: safety backup v2 → διαγραφή των legacy κλειδιών προόδου μέσω συναλλαγής. Το νέο store δεν αγγίζεται ακόμα.
- **Συναλλαγή** (`src/utils/progressTransaction.js`): το localStorage **δεν** είναι transactional ανάμεσα σε
  διαφορετικά κλειδιά. Γίνεται application-level: snapshot → σημάδι `progress-txn-v1` (before/after) → εγγραφές →
  επαλήθευση → rollback όλων σε σφάλμα. Αν η σελίδα κλείσει στη μέση, το σημάδι μένει και στην επόμενη εκκίνηση
  (`main.jsx`) η αλλαγή ολοκληρώνεται (αν όλα είναι ήδη «after») ή αναιρείται. Χωρίς σημάδι: μία ανάγνωση, καμία εγγραφή.

## 9. Frozen legacy baseline (Phase 1E-2)

**Σημασία:** «αυτή ήταν η γνωστή κατάσταση του legacy συστήματος τη στιγμή του migration». Όχι «ο χρήστης έκανε
αυτά τα events τότε». Κανένα `answer` / `flip` / `self` δεν δημιουργείται για το παρελθόν· το μόνο timestamp που
προέρχεται από το migration είναι το `capturedAt` / `marker.at`.

```text
state['legacy-baseline:psd115'] = {
  format: 'legacy-baseline', version: 1, courseId: 'psd115',
  sourceHash: 'sha256:<hex>', capturedAt: '<ISO>',
  raw: { 'psd115-…': '<raw string>' },          // αυτούσιο snapshot όλων των psd115-* (εκτός backups)
  progress: {
    quizAnswered, quizCorrect, byCategory: { [categoryId]: { correct, wrong } },
    flashcardSeenIds: [cardId],                 // ίδιο σύνολο και σειρά
    wrongBook: [{ uid, id, categoryId, question, explanation, userLabel, correctLabel }],   // αυτούσιες εγγραφές
    checklists: { [topicId]: { items: boolean[], legacyKey } }   // legacy slug → topics.js → canonical topicId
  } }
state['migration:psd115-v1'] = { version: 1, at: '<ISO>', sourceHash, baselineKey: 'legacy-baseline:psd115', baselineVersion: 1 }
```

**Source hash:** `sha256:` + SHA-256 (pure JS, ίδιο σε browser/Node) του
`JSON.stringify([[key, raw], …])` με ταξινομημένα κλειδιά. Ανεξάρτητο από σειρά κλειδιών, `exportedAt` και runtime.

**Αυστηρός έλεγχος (χωρίς σιωπηλή επισκευή):** άκυρο JSON, άγνωστο κλειδί `psd115-*` ή άγνωστο πεδίο, άκυρη δομή
`byCategory` / `wrongBook` / checklist, ερωτήσεις / κάρτες / κατηγορίες που δεν υπάρχουν στο περιεχόμενο,
checklist slug που δεν αντιστοιχεί σε θέμα → απόρριψη με συγκεκριμένο σφάλμα, χωρίς εγγραφή. Ασυνέπεια αθροισμάτων
`byCategory` ↔ `quizAnswered` είναι προειδοποίηση: διατηρούνται και τα δύο όπως είναι.

**Ορατή πρόοδος** (`visibleProgress`):
- κουίζ = baseline + `answer` events με `ctx: 'quiz'` (ίδιο εύρος με το legacy κουίζ)·
- κάρτες = baseline ∪ `flip` events·
- `wrongBook`, checklists = mutable state (αρχικά του baseline), **όχι** projection των events·
- reset marker: αγνοεί το baseline και τα events πριν από αυτό.

Κάθε event μετριέται μία φορά και το baseline δεν περιέχει events, οπότε δεν υπάρχει διπλομέτρηση.

**Fixtures:**
- `progress-export.production-2026-10-05.json`: **authoritative** (πραγματικό production export v2), για την ορθότητα του
  migration, το αναμενόμενο baseline και το source hash. Αμετάβλητο: τα tests ελέγχουν το SHA-256 των bytes και το source hash.
- `progress-export.production-2026-09-28.json`: **ιστορικό** (v1), για συμβατότητα. Δεν αντικαθίσταται.
- `progress-export.sample.json`: συνθετικό (v1).

**Conservation (tests):** για κάθε fixture, ό,τι δείχνει το legacy = ό,τι δείχνει το baseline: `quizAnswered`,
`quizCorrect`, όλο το `byCategory`, `flashcardSeenIds`, όλες οι εγγραφές `wrongBook`, κάθε checklist.
