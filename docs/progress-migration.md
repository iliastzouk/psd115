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

**Απόφαση σχεδίου:** τα ιστορικά αθροίσματα **δεν** μετατρέπονται σε ψεύτικα events. Διατηρούνται ως **legacy baseline** (ένα state κλειδί `legacy:psd115-w1-study` με αντίγραφο του αρχικού αντικειμένου). Το UI μπορεί να τα προσθέτει στα στατιστικά που υπολογίζονται από τα events, μέχρι να μην έχουν πια σημασία.

Για `wrongBook` και `flashcardSeenIds` υπάρχουν δύο επιλογές, που αποφασίζονται στο migration phase:
- (α) μόνο στο legacy baseline, ή
- (β) ως events με `ctx: 'review'` / `'flash'` και `t` = χρόνος του migration, σημασμένα ως τέτοια μέσω του `session` (π.χ. `session: 'legacy-import'`), ώστε να ξεχωρίζουν πάντα.

## 4. Τι μένει state

- Checklists ανά θέμα: `checklist:psd115/<topic>` → `boolean[]`.
- Θέμα (theme) και αποδοχή disclaimer.
- Μελλοντικές ρυθμίσεις ή μικρό UI state.

## 5. Πώς θα μεταφερθεί η πρόοδος των υπαρχόντων χρηστών (μελλοντικό phase)

1. **Πριν από οτιδήποτε:** αυτόματο backup με τον μηχανισμό του Phase 0A (αρχείο + `psd115-backup-*`).
2. Ανάγνωση των `psd115-*` με τον validator του 0A. Αν υπάρχουν σφάλματα, **σταματά** χωρίς αλλαγές.
3. Εγγραφή στο νέο store:
   - legacy baseline,
   - checklists σε state,
   - ρυθμίσεις σε state,
   - (προαιρετικά) τα legacy events του §3.
4. Εγγραφή σημαδιού `migration:psd115-v1 = { at, sourceHash }` στο state.
5. Η εφαρμογή αρχίζει να γράφει νέα events.
6. **Τα `psd115-*` κλειδιά ΔΕΝ σβήνονται.** Μένουν μόνο για ανάγνωση και rollback για αρκετές εκδόσεις.

## 6. Idempotency

- Το migration ελέγχει το σημάδι `migration:psd115-v1`. Αν υπάρχει, δεν ξανατρέχει.
- Τα legacy events έχουν **ντετερμινιστικά** IDs (π.χ. UUID v5 από `psd115-legacy:<κλειδί>:<index>`). Αν το migration ξανατρέξει ή εισαχθεί δύο φορές, το `importAll` τα βρίσκει ως ίδια (ίδιο id + ίδιο περιεχόμενο) και τα παραλείπει.
- Το `sourceHash` (hash των αρχικών `psd115-*` τιμών) εντοπίζει αν άλλαξαν τα πηγαία δεδομένα μετά το migration, π.χ. από παλιό tab.

## 7. Rollback

- Επειδή τα `psd115-*` μένουν ανέγγιχτα, rollback σημαίνει απλώς: η εφαρμογή ξαναδιαβάζει το παλιό model (αλλαγή κώδικα / feature flag).
- Τα νέα κλειδιά (`study-progress-*`) μπορούν να αγνοηθούν ή να εξαχθούν (`exportAll`) πριν αφαιρεθούν.
- Ό,τι καταγράφηκε ως event μετά το migration δεν χάνεται. Δεν μεταφέρεται όμως πίσω στα παλιά αθροίσματα. Αυτό είναι αποδεκτό, γιατί το rollback είναι μέτρο έκτακτης ανάγκης.

## 8. Πώς αποφεύγουμε την απώλεια προόδου

- Backup (Phase 0A) πριν από το migration, και τα `psd115-*` δεν σβήνονται.
- Το νέο store:
  - δεν αντικαθιστά ποτέ κατεστραμμένα δεδομένα σιωπηλά,
  - απορρίπτει άκυρα events,
  - δεν αλλάζει ή σβήνει ιστορικά events,
  - κάνει εισαγωγές «όλα ή τίποτα».
- Κάθε ανάγνωση γίνεται από το storage (όχι cache). Αυτό περιορίζει τον κίνδυνο δύο tabs να γράψουν το ένα πάνω στο άλλο, που εντοπίστηκε στο Phase 0A.
- **Εκκρεμεί πριν ενεργοποιηθεί το νέο store:** το export του Phase 0A εξάγει μόνο `psd115-*`. Όταν η εφαρμογή αρχίσει να γράφει στα `study-progress-*`, το export του χρήστη πρέπει να τα περιλαμβάνει, είτε με επέκταση του 0A export είτε με `exportAll` δίπλα του.
- **Όριο μεγέθους:** κάθε `append` ξαναγράφει όλο το log (O(n)). Με ~80 bytes/event και όριο localStorage ~5MB, το trigger για IndexedDB είναι όταν το log ξεπεράσει ~1MB. Η αλλαγή αφορά μόνο το `progressStore.js`, χάρη στο async API.

## Εκτός scope (σκόπιμα)

- Δεν υπάρχει κώδικας migration.
- Δεν υπάρχει σύνδεση με `useStudySession`.
- Δεν υπάρχει UI.
- Δεν υπάρχουν IndexedDB, Supabase ή αλγόριθμοι mastery / spaced repetition.
- Το `requestPersistentStorage()` (`src/core/progress/persist.js`) υπάρχει αλλά δεν καλείται ακόμα.
