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
- Reset marker `progress:reset:psd115` (ένα κλειδί για writer και reader από το 1E-4b).
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

## 10. Shadow mode (Phase 1E-3)

Το legacy (`psd115-*`) είναι η **μόνη** πηγή του UI. Οι πραγματικές ενέργειες γράφονται ΚΑΙ ως events στο νέο store.

**Ενέργειες → events** (μόνο οι δύο persisted ενέργειες· mini κουίζ και εξέταση δεν αποθηκεύονται, άρα ούτε events):

| Ενέργεια (κώδικας) | Event |
|---|---|
| απάντηση στο κεντρικό κουίζ (`useStudySession.handleSelectOption`) | `{ kind:'answer', ok: 0|1, ctx:'quiz', item:'psd115/<questionId>' }` |
| «Επόμενη κάρτα» / «Από την αρχή» (`Flashcard.handleNext` → `markFlashSeen`), από τη σελίδα καρτών ή μάθημα | `{ kind:'flip', ctx:'flash', item:'psd115/<cardId>' }` |

`flip` σημαίνει εδώ την υπάρχουσα persisted ενέργεια «είδα την κάρτα και πήγα στην επόμενη»· το απλό γύρισμα της κάρτας
δεν αποθηκεύεται ούτε στο legacy. Γράφεται σε κάθε πάτημα (και για ήδη μελετημένη κάρτα)· το legacy κρατά σύνολο.

**Πύλες** (χωρίς οποιαδήποτε: καμία ανάγνωση/εγγραφή στο νέο store):
1. build flag `LEGACY_PROGRESS_SHADOW_ENABLED` (false· μόνο το smoke build με `VITE_PROGRESS_SHADOW_SMOKE=1` το ανοίγει)·
2. σημάδι `migration:psd115-v1` (το stream ξεκινά μόνο μετά το baseline)·
3. runtime `shadow:psd115.enabled === true` (ενεργοποίηση `activateShadow`, kill switch `deactivateShadow`).

**Σειρά εγγραφών:** το event γράφεται **συγχρονικά μέσα στον handler** του κλικ (`append` εκτελείται αμέσως), πριν το React
γράψει το legacy αντικείμενο (`useEffect` → `saveProgress`). Δεν υπάρχει συναλλαγή ανάμεσα στα δύο κλειδιά:
- αποτυχία του event → η ενέργεια του χρήστη συνεχίζει κανονικά· καταγραφή (best effort) στο `shadow:psd115`
  (`failures`, `recentFailures` ≤ 20)· το reconciliation δείχνει το χαμένο event·
- αποτυχία του legacy (το `saveProgress` την αγνοεί σιωπηλά, όπως πάντα) ή κλείσιμο του tab ανάμεσα στα δύο → event χωρίς
  αντίστοιχο legacy· το reconciliation το δείχνει.
Ο recorder καλείται από τον handler, όχι από setState updater/effect (το StrictMode τα τρέχει δύο φορές).

**Εγγυήσεις:** at-most-once ανά ενέργεια (καμία αυτόματη επανάληψη), duplicate-resistant με το `id` (ίδιο id → απόρριψη).
**Όχι** exactly-once ανάμεσα σε legacy και νέο store: οι αποκλίσεις εντοπίζονται, δεν αποκλείονται.

**Όριο migration** (`src/core/progress/boundary.js`): μετά το σημάδι, event με `t < marker.at` απορρίπτεται (`t === at` δεκτό)
σε `progressStore.append`, `progressStore.importAll`, import αρχείου v2 και έλεγχο αρχείου v2. Διαφορετικό σημάδι στο αρχείο
από το τρέχον → απόρριψη. Χωρίς σημάδι δεν υπάρχει όριο, αλλά το αρχικό migration απαιτεί άδειο log.

**Reconciliation** (`src/core/progress/reconcile.js`): κουίζ legacy − baseline == answer events (answered, correct, ανά κατηγορία)·
κάρτες: νέες legacy κάρτες == νέα flip items. Το `wrongBook` δεν συγκρίνεται. Με reset marker: από το μηδέν, events από το reset.

**Reset σε shadow mode:** όπως στο 1E-1 (backup v2, legacy διαγραφή) και επιπλέον, αν υπάρχει σημάδι migration, γράφεται
`progress:reset:psd115 = { at, reason }` (1E-4b· αρχικά `progress-reset:psd115`, δεν γράφτηκε ποτέ στο production) στην ίδια συναλλαγή. Events και baseline δεν σβήνονται.

**Πολλά tabs:** το legacy μένει last-write-wins — γνωστός περιορισμός, δεν λύνεται εδώ. Για το νέο store, το test δείχνει μόνο ότι
**διαδοχικά** appends από ανεξάρτητους recorders διατηρούνται (κάθε `append` ξαναδιαβάζει το log από το storage). Δεν αποδεικνύει
ασφάλεια σε πραγματικά ταυτόχρονο read-modify-write δύο tabs: το localStorage δεν έχει locking, και ένα τέτοιο race μπορεί θεωρητικά
να χάσει ένα event (θα φανεί στο reconciliation).

**Κύκλος ζωής `activateShadow` (idempotent):**
- **Αρχική** (χωρίς σημάδι/baseline): legacy → αυστηρός έλεγχος → frozen baseline + σημάδι (backup v2 πριν) → enable.
- **Επανενεργοποίηση** (υπάρχει σημάδι/baseline, π.χ. σε κάθε εκκίνηση): **δεν** ξαναϋπολογίζεται hash από το τρέχον legacy
  (αλλάζει νόμιμα μαζί με τα events). Ελέγχονται: ακεραιότητα (μορφή/έκδοση baseline, ίδιο `sourceHash` και χρόνος σημαδιού/baseline,
  το frozen `raw` δίνει ακόμα το `sourceHash` του) και reconciliation `in-sync`. Αλλιώς άρνηση (`integrity` / `diverged`) χωρίς εγγραφή —
  π.χ. αλλαγές στο legacy όσο ο shadow ήταν απενεργοποιημένος.
- Κατεστραμμένο νέο store → άρνηση (`corrupt-store`).

**Ενεργοποίηση στο production (μελλοντικά, μετά από review):** backup v2 → `LEGACY_PROGRESS_SHADOW_ENABLED = true` και κλήση του
`activateShadow()` στην εκκίνηση, σε δικό του PR → έλεγχος reconciliation. Kill switch: `deactivateShadow`.

## 11. Progress snapshot — pure read model (Phase 1E-4a)

Pure layer χωρίς storage, React ή URLs (`src/core/progress/snapshot.js`). Δεν χρησιμοποιείται ακόμα από την εφαρμογή.

```text
legacy entries            → legacyToSnapshot()      → Snapshot
baseline + events + state → buildProgressSnapshot() → Snapshot
Snapshot                  → snapshotToLegacy()      → legacy entries (projection)
Snapshot                  → stateFromSnapshot()     → state namespaces (υλοποίηση στο cutover)
```

**Snapshot v1** (ένα ανά μάθημα): `{ format: 'progress-snapshot', version: 1, courseId, quizAnswered, quizCorrect,
byGroup, flashcardSeenIds (global IDs), wrongBook, checklists ({ [topicId]: { items } }) }`. Theme/disclaimer = ρυθμίσεις,
εκτός snapshot.

| Πεδίο | Προέλευση |
|---|---|
| quizAnswered / quizCorrect | baseline + `answer` events με ctx `quiz` (wrong = answered − correct) |
| byGroup | baseline.byCategory + events, ομάδα μέσω `content.groupOf()` · άγνωστη ερώτηση → μόνο στα σύνολα |
| flashcardSeenIds | baseline ∪ items των `flip` events με ctx `flash` (σειρά πρώτης εμφάνισης) |
| wrongBook | state `progress:wrongbook:<courseId>` αν υπάρχει το κλειδί (ακόμα κι αν είναι κενό), αλλιώς baseline · ποτέ από events |
| checklists | state `progress:checklists:<courseId>` αν υπάρχει το κλειδί, αλλιώς baseline |
| reset | state `progress:reset:<courseId>` → αγνοούνται baseline και events με `t < at` |

Εγγραφή wrongBook: `{ uid, item, group, question, explanation, userLabel, correctLabel, t }` — `t: null` για τις παλιές
εγγραφές (άγνωστος χρόνος, δεν επινοείται).

**Namespaces (απόφαση C):** τα `progress:<kind>:<courseId>` είναι **λογικά κλειδιά μέσα στο ένα αντικείμενο state**
(`study-progress-state-v1`), όχι ξεχωριστά κλειδιά localStorage. Τα ιστορικά artifacts (`legacy-baseline:psd115`,
`migration:psd115-v1`, `shadow:psd115`) μένουν αμετάβλητα. Το reset γράφεται και διαβάζεται πλέον από ΕΝΑ κλειδί,
`progress:reset:psd115` (1E-4b, βλ. §12).

**Content adapter** (`contentAdapter.js`): η μόνη εξάρτηση από περιεχόμενο — `hasGroup`, `groupOf`, `isQuestion`,
`isCard`, `hasTopic` (τοπικά IDs) και προαιρετικό `legacy` codec (`decode` / `encode` των παλιών κλειδιών). Το PSD115
adapter (`adapters/psd115.js`) είναι το μόνο σημείο που ξέρει categories, topics.js και τα κλειδιά `psd115-w*`· το
`unknownCourseAdapter(courseId)` δεν επινοεί ομάδες/θέματα. Ο engine δεν ξέρει κανένα μάθημα (έλεγχος στα tests).

## 12. ProgressService — ένα snapshot στη μνήμη (Phase 1E-4b, legacy mode)

```text
main.jsx: recoverInterrupted → initSettings (theme πριν από το paint) → createProgressService → installProgressService → render
UI → useProgress / useCourseProgress / useTopicChecklist (useSyncExternalStore) → ΕΝΑ ProgressState
ProgressService → legacyToSnapshot(runtime) → Snapshot → snapshotToLegacy → legacy backend → ίδια κλειδιά psd115-*
```

- **Ένα instance**, δημιουργείται μόνο στο `main.jsx` πριν από το render (εκτός React → το StrictMode δεν φτιάχνει δεύτερο).
  `ProgressState = { version, status: 'ready' | 'degraded', issues, courses: { psd115: Snapshot } }`, immutable· ίδιο
  αντικείμενο για όλους μέχρι την επόμενη πραγματική αλλαγή.
- **Boot χωρίς εγγραφές:** η πρόοδος υπάρχει ήδη στο πρώτο render (τέλος στο «0 και μετά hydration» και στο παλιό
  `saveProgress(default)` που έγραφε μηδενικά πάνω στην πρόοδο). Τα checklists γράφονται μόνο σε αλλαγή του χρήστη
  (απόν κλειδί ≡ όλα false). Theme/disclaimer: `utils/settings.js`, εκτός progress snapshot, εγγραφή μόνο σε αλλαγή.
- **Εγγραφές:** μόνο από το service (ανά ενέργεια, μόνο τα κλειδιά που άλλαξαν· >1 κλειδί → `runTransaction`) και από
  τις ρητές ενέργειες υποδομής (export/import/reset, `progressBackup`). Μετά το reset: `resync()`.
- **Degraded:** δομικά κατεστραμμένα legacy δεδομένα ή αμφίβολη ανάκτηση συναλλαγής → μήνυμα, **καμία εγγραφή**, η μελέτη
  συνεχίζει χωρίς αποθήκευση. Άγνωστα `psd115-*` κλειδιά και IDs που δεν υπάρχουν πια στο περιεχόμενο κρατιούνται ανέγγιχτα.
- **Shadow:** ο recorder μένει στους handlers του `useStudySession`, ΠΡΙΝ από την αλλαγή στο service· το service δεν
  ξέρει τίποτα για events/baseline. Το νέο store παραμένει shadow infrastructure (off).
- **Gates:** `tests/progressService.test.mjs` (ταυτότητα, immutability, ισοδυναμία με τον παλιό reducer, degraded,
  reset key, guards) και `npm run smoke:progress` (0 εγγραφές στο boot, πρώτο DOM με τις τιμές του fixture,
  mutation builds M1/M2 που πρέπει να αποτύχουν, ένα snapshot σε όλους τους consumers, μνήμη ≡ storage,
  `--differential=<παλιό dist>` για σύγκριση με το παλιό build).
- **Εκτός 1E-4b:** συγχρονισμός πολλών tabs, εμφάνιση αποτυχίας εγγραφής, new reader / `commit({events,state})`,
  αποσύνδεση `legacyBaseline`/`reconcile`/`progressShadow` από το PSD115, cleanup των load/save του `storage.js`, F2/F3.
