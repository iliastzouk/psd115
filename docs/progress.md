# Πρόοδος μελέτης — ενεργή αρχιτεκτονική

Η τρέχουσα υποδομή προόδου της εφαρμογής: τι αποθηκεύεται, πώς διαβάζεται και γράφεται, τι εγγυάται και τι όχι.
Το ιστορικό σχέδιο migration από τα παλιά κλειδιά `psd115-*`, που δεν ενεργοποιήθηκε ποτέ, είναι στο
[`docs/history/progress-migration.md`](history/progress-migration.md). Από εκεί προέρχεται η αρχική διατύπωση του
συμβολαίου J1–J9 (§20). Ο κώδικάς του αφαιρέθηκε στη Φάση 6b.

## Αποθήκευση

Δύο κλειδιά του localStorage, για όλα τα μαθήματα:

| Κλειδί | Περιεχόμενο |
|---|---|
| `study-progress-events-v1` | append-only log από events (`answer`, `flip`, `self` κ.λπ.) με global `item` `<courseId>/<localId>` |
| `study-progress-state-v1` | μεταβλητές τιμές ανά μάθημα (namespaces μέσα στο ίδιο αντικείμενο) |

Namespaces μέσα στο state (`src/core/progress/namespaces.js`):

- `progress:wrongbook:<courseId>` = `{ version: 1, entries }`
- `progress:checklists:<courseId>` = `{ version: 2, topics: { [topicId]: { items, t } } }`
- `progress:reset:<courseId>` = `{ at, reason }`

Βοηθητικά κλειδιά:

- `progress-txn-v1`: σημάδι συναλλαγής πολλών κλειδιών.
- `study-progress-backup-<ISO>`: τοπικά safety backups, τα 3 νεότερα. Βλ. «Safety backup» παρακάτω.

Τα παλιά κλειδιά `psd115-*` (πρόοδος, backups, σημάδι migration) δεν διαβάζονται, δεν γράφονται και δεν σβήνονται (J7).
Theme (`psd115-w1-theme`) και disclaimer (`psd115-disclaimer-v1`) είναι ρυθμίσεις (`src/utils/settings.js`), όχι πρόοδος.
Guards:

- το smoke `smoke:progress` (σενάριο U) καταγράφει κάθε `getItem` της εφαρμογής και κάθε εγγραφή, και επιτρέπει μόνο τα
  παραπάνω κλειδιά;
- κανένα legacy κλειδί δεν υπάρχει στο `src/` ούτε στο production bundle (`scripts/legacy-keys.mjs`).

## Αρχιτεκτονική

`main.jsx` → `createStoreProgressService({ adapters: studyContentAdapters(), storage, recovery })`:

- **J1:** ένας service για όλα τα μαθήματα.
  - `supports(c)` και `forCourse(c)`. Το `forCourse(c)` επιστρέφει `{ answerQuestion, markCardSeen, removeWrong,
    clearWrongBook, setChecklist }`, δεμένα στο μάθημα.
  - Ακόμη `getSnapshot`, `subscribe`, `refresh` (μόνο ανάγνωση), `resync` και `dismissWriteFailure`.
  - Δημιουργείται και εγκαθίσταται μία φορά (guard: `progressArchitecture`).
- **J2:** κοινός σύγχρονος πυρήνας `createStoreCore` (`src/core/progress/progressStore.js`).
  - API: `readRaw`, `readSync`, `parseRaw`, `pending`, `readState`, `commitSync`, `exportSync`.
  - Τον χρησιμοποιούν ο service και το `studyProgressBackup`.
  - *Trade-off:* η εφαρμογή εξαρτάται από σύγχρονο storage. Μετάβαση σε IndexedDB θα χρειαστεί async εκκίνηση με
    κατάσταση «φόρτωση».
- **J3:** οι ενέργειες.
  - Απάντηση = event `answer`/`quiz`. Αν είναι λάθος, γράφεται και εγγραφή wrongBook στο ΙΔΙΟ commit (συναλλαγή), με
    το ΙΔΙΟ `t`.
  - Κάρτα = `flip`/`flash`, μόνο την πρώτη φορά.
  - Checklist και αφαίρεση λάθους = μόνο state.
- **Engine:** pure, χωρίς storage, React ή URLs (guard: `progressArchitecture`).
  - `parseStoreData` κάνει τους global ελέγχους.
  - `courseNamespaces` και `courseProgress` υπολογίζουν ανά μάθημα (`src/core/progress/courseProgress.js`).
  - Adapters από το κοινό συμβόλαιο περιεχομένου (`adapters/studyContent.js`): κάρτες, ερωτήσεις με την ομάδα τους
    (`categoryId`), θέματα από το routing catalog.

## J4 — ταξινόμηση

Η ταξινόμηση είναι ίδια σε ανάγνωση, εγγραφή και import.

| Περίπτωση | Ανάγνωση | Εγγραφή | Import |
|---|---|---|---|
| άκυρο JSON / schema · διπλό id με άλλο περιεχόμενο · μη global `item` · σημάδι συναλλαγής · μη ασφαλής ανάκτηση | global degraded | — | απόρριψη |
| μάθημα χωρίς adapter ή εκτός registry | opaque (κρατιέται, δεν μετρά) | αδύνατη | αποδοχή ως opaque |
| id που δεν υπάρχει πια | orphan (κρατιέται, δεν μετρά, προειδοποίηση) | απόρριψη | αποδοχή ως orphan |
| `answer`+`quiz` σε κάρτα · `flip`+`flash` σε ερώτηση, με t ≥ R | unavailable μόνο το μάθημα | απόρριψη | απόρριψη (αν από ready γινόταν unavailable) |
| `self` ή άλλος συνδυασμός kind/ctx σε υπαρκτό id | κρατιέται, δεν μετρά | — | αποδοχή |
| άκυρο namespace ενός μαθήματος | unavailable μόνο το μάθημα | — | αρχείο: απόρριψη · τοπικό: αντικατάσταση |

Μετρούν μόνο το `answer`+`quiz` (ερώτηση) και το `flip`+`flash` (κάρτα). Απόν namespace σημαίνει έγκυρη κενή
κατάσταση, και κανένα namespace δεν δημιουργείται στην εκκίνηση.

**Μητρώο IDs** (`content/courses/<c>/ids.ledger.json`, ελέγχεται στο `validate:content`):

- κάθε νέο id καταχωρίζεται ρητά (`npm run content:ledger -- --add`);
- αφαίρεση μόνο ως `retired`, και ένα `retired` id δεν επιστρέφει;
- ένα id δεν αλλάζει τύπο και είναι μοναδικό σε όλους τους τύπους.

Έτσι τα orphans δεν μετρούν ποτέ σε νέο περιεχόμενο.

## J5 — χρόνοι, reset

- **H_c:** το μέγιστο `t` όλων των events του μαθήματος (και των κρυμμένων) και των έγκυρων wrongBook / checklists. Το
  reset δεν μετρά.
- **Χρόνος reset:** `at = max(now, H_c + 1, previousReset + 1)`.
- **Χρόνος νέας εγγραφής:** `t = max(now, reset, H_c + 1)`.
- Ο πυρήνας απορρίπτει event μαθήματος με `t` πριν από το reset του (`resetBoundary.js`, ο μόνος έλεγχος ορίου).
- **Reset** (`resetCourseSafely`):
  - αφορά ΜΟΝΟ το τρέχον μάθημα;
  - πρώτα επαληθευμένο raw safety backup, μετά `{ reset: { at }, wrongBook κενό, checklists κενά }`;
  - τα events δεν σβήνονται.
- Μία κανονικοποίηση του wrongBook σε κάθε διαδρομή: `canonicalWrongBook` (φίλτρο t ≥ R, σειρά `(t, uid)`, όριο 60).

## J6 — import / export

- **Export:** το `exportProgressToFile` δίνει τη νέα μορφή (`study-progress`) όταν το store διαβάζεται, αλλιώς raw
  (`study-progress-raw`, με τις τιμές αυτούσιες, μαζί με το σημάδι).
- **Import:** `planImport` → προεπισκόπηση ανά στοιχείο → επιβεβαίωση → `applyImport`.
  - R = max(Rl, Rf), και τίποτα με t < R δεν εμφανίζεται.
  - Ένωση events με βάση το id και wrongBook με βάση το uid. Μια σύγκρουση απορρίπτει όλο το αρχείο.
  - Αποτύπωμα SHA-256 των raw τιμών και του αρχείου. Αλλαγή ανάμεσα σε προεπισκόπηση και εφαρμογή → `StaleImportError`.
- **Αντικατάσταση:** μόνο όταν το store δεν διαβάζεται.
- Παλιό αρχείο `psd115-progress-export` → απόρριψη με σαφές μήνυμα.

## Safety backup

Το `createSafetyBackup` (`src/utils/studyProgressBackup.js`) τρέχει πριν από κάθε reset, import ή αντικατάσταση.
Αποθηκεύει τις raw τιμές των δύο κλειδιών και του σημαδιού, αυτούσιες.

Σειρά βημάτων:

1. Έλεγχος σύγκρουσης ονόματος (`getItem`).
2. Εγγραφή του `study-progress-backup-<ISO>`. Στο ίδιο ms, το όνομα παίρνει επίθημα `-001`.
3. Επαλήθευση: `getItem`, byte-identical.
4. Λήψη αρχείου.
5. Κλάδεμα στα 3 νεότερα.

Το reset ή το import αλλάζει την πρόοδο ΜΟΝΟ αν το backup ολοκληρωθεί. Σε κάθε περίπτωση αποτυχίας η πρόοδος δεν αλλάζει:

| Αποτυχία | Σφάλμα | Τι μένει |
|---|---|---|
| εγγραφή του νέου backup | `BackupError` | το νέο κλειδί σβήνεται best-effort· τα παλιά backups ανέπαφα |
| επαλήθευση (άλλη τιμή ή `getItem` πετάει) | `BackupError` | το νέο κλειδί σβήνεται best-effort: αν αποτύχει και η διαγραφή, μπορεί να μείνει (ανεπαλήθευτο)· τα παλιά ανέπαφα |
| λήψη αρχείου | το αρχικό σφάλμα (όχι `BackupError`) | το νέο, επαληθευμένο backup μένει αποθηκευμένο· τα παλιά δεν έχουν κλαδευτεί (3 + 1) |
| έλεγχος σύγκρουσης ονόματος (`getItem` πετάει) | το αρχικό σφάλμα | δεν γράφεται τίποτα |
| κλάδεμα | κανένα | best-effort που σταματά στην πρώτη αποτυχημένη διαγραφή: όσες έγιναν μένουν, οι επόμενες δεν επιχειρούνται, το νέο backup δεν ακυρώνεται (τα τοπικά backups μπορεί να υπερβούν τα 3) |

Τα tests είναι στο `tests/progressSafetyBackup.test.mjs`.

## Αποτυχίες εγγραφής και συναλλαγές

- **Ένα κλειδί:** ένα `setItem`. Αποτυχία → `not-started`, η αλλαγή δεν εφαρμόζεται και ο service δείχνει ειδοποίηση
  `writeFailure`:
  - `quota` από το `name` / `code` του σφάλματος (`QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, 22, 1014);
  - αλλιώς `other`.
- **Δύο κλειδιά:** `runTransaction` (`src/core/progress/transaction.js`).
  - Βήματα: σημάδι → εγγραφή → επαλήθευση → rollback με επαλήθευση.
  - Αν αποτύχει και το rollback (`rollback-incomplete`), το σημάδι μένει. Το `recoverInterrupted` της εκκίνησης
    ολοκληρώνει ή επαναφέρει.
  - Κατεστραμμένο σημάδι → global degraded. Το σημάδι δεν σβήνεται ποτέ σιωπηλά.
- Όσο υπάρχει σημάδι, καμία εγγραφή. Τα μηνύματα λένε «η πρόοδος δεν άλλαξε» μόνο όταν αυτό είναι επιβεβαιωμένο
  (`src/utils/progressFailureMessage.js`).

## Υπολειπόμενος κίνδυνος: ταυτόχρονα tabs (χωρίς cross-tab lock)

Κάθε ενέργεια ξαναδιαβάζει το storage, και το `storage` event ενημερώνει τα άλλα tabs. Δεν υπάρχει όμως cross-tab lock.
Δύο πραγματικά ταυτόχρονες εγγραφές, π.χ. append στο ίδιο log από δύο tabs στο ίδιο διάστημα ανάγνωσης–εγγραφής, μπορούν
ακόμα να χάσουν μία αλλαγή.

## Άλλοι περιορισμοί

- **Ρολόγια διαφορετικών συσκευών:** το R = max(Rl, Rf) ευνοεί το reset. Ένα reset από συσκευή με ρολόι μπροστά μπορεί να
  κρύψει νεότερες ενέργειες άλλης συσκευής. Η προεπισκόπηση τις δείχνει ως «δεν θα υπολογίζονται».
- **Μέγεθος:** το log μεγαλώνει με κάθε ενέργεια και το reset δεν το μικραίνει.
- **Ιστορικό git:** τα παλιά fixtures με εξαγωγές προόδου αφαιρέθηκαν στη Φάση 6b, αλλά μένουν στο ιστορικό του
  repository.

## Tests

- **Unit:**
  - `progressStoreCore`, `progressTransaction`, `progressPersist`, `progressSafetyBackup`, `progressMessages`,
    `progressArchitecture`;
  - `courseProgress`, `storeProgressService`, `progressResetImport`, `progressMultiTab`, `progressRuntime`,
    `progressDisplay`, `idLedger`, `studyCourse`.
- **Smoke:** `smoke:progress` (νέο store, πρώτο render, degraded, legacy κλειδιά, σημάδι, αποτυχίες, δύο tabs) και `smoke`
  (διαδρομές, export / import / reset).
