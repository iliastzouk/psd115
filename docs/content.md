# Περιεχόμενο μαθημάτων — αρχιτεκτονική (Φάση 6d)

Πώς καταχωρίζεται το περιεχόμενο ενός μαθήματος και πώς φτάνει στο routing και στη μελέτη. Η πρόοδος περιγράφεται
χωριστά στο `docs/progress.md`.

## Ροή

```
content/courses/<courseId>/index.js     manifest του μαθήματος (συμβόλαιο: src/core/content/courseContract.js)
        │
content/courses/index.js                COURSES: τα πραγματικά μαθήματα, με τη σειρά του καταλόγου
        │
src/core/content/index.js               το ΕΝΑ σημείο καταχώρισης (μόνο αυτό εισάγει το content/courses/index.js)
        │  deriveCatalog · deriveStudyContent · deriveTopicSlides   (src/core/content/registry.js, pure)
        ├── CONTENT_CATALOG  → src/core/routing/catalog.js  (getContentCourse, getUnit, getTopic, getDoc, getTopicSlides)
        ├── STUDY_CONTENT    → src/core/study/content.js    (κάρτες, ερωτήσεις, κατηγορίες, units)
        └── TOPIC_SLIDES     → getTopicSlides(courseId, topicId)
```

Νέο μάθημα = νέο manifest στο `content/courses/<courseId>/index.js` + μία γραμμή στο `content/courses/index.js`. Κανένα
άλλο αρχείο της εφαρμογής δεν αλλάζει για να το καταχωρίσει. Το `courseId` είναι το ίδιο με το academic registry.

## Manifest (6d-α)

| Πεδίο | Περιεχόμενο |
|---|---|
| `id` | courseId |
| `terms?` | `{ unit, units, unitShort }` — ορολογία του μαθήματος· προεπιλογή «Ενότητα» / «Ενότητες» / «Ενότ.» (`courseTerms`) |
| `units` | `{ id, order, label, title, kind, legacy?: { route } }` |
| `topics` | `{ id, unit, legacySlug? }` — η σειρά του πίνακα είναι η σειρά πλοήγησης |
| `study` | `{ categories, unitCategories, flashcards, quizQuestions, getCategoryLabel, examQuestions }` (`unitCategories` και `examQuestions` ανά unit) |
| `docs` | `{ id, unit, kind, path }` — `path` σχετικό με το `public/` |
| `slides?` | `{ decks: { [unitId]: deckId }, byTopic: { [topicId]: number[] } }` |
| `provenance` | `original` (`license: 'own'`, `author`) · `licensed` (`source`, `license` ή `permission`, `attribution`) · `legacy` (`reviewed`) |

Το περιεχόμενο των θεμάτων (κείμενα, ενότητες) μπαίνει στο συμβόλαιο στη Φάση 6d-β.

`checkCourseContent(manifest)` (pure) επιστρέφει όλα τα σφάλματα:
- άγνωστα ή υποχρεωτικά πεδία·
- διπλά ή άκυρα ids, `order` και legacy routes·
- κάθε αναφορά (topic → unit, κατηγορίες ανά unit, κάρτα / ερώτηση → κατηγορία, ερωτήσεις ανάπτυξης ανά unit,
  έγγραφο → unit, slides → unit / θέμα / deck)·
- `legacySlug` χωρίς legacy route·
- id που είναι και κάρτα και ερώτηση·
- κανόνες επιλογών κουίζ·
- provenance.

Τρέχει στο `npm run validate:content` για κάθε μάθημα του `COURSES` και στα tests. Η εφαρμογή δεν εισάγει το συμβόλαιο:
κανένας έλεγχος στο runtime.

## Παλιές διαδρομές (προαιρετικές)

Μόνο units με `legacy.route` και θέματα με `legacySlug` αποκτούν παλιές διαδρομές (`buildLegacyRoutes`, pure).
Μάθημα χωρίς legacy δεν προσθέτει καμία. Τα legacy κλειδιά είναι `''` όπου δεν υπάρχει legacy. Το `checkTopicMap`
ελέγχει την αντιστοίχιση μόνο όπου δηλώνεται.

Στον κατάλογο οι units εκθέτουν το legacy route ως `route` και το deck ως `deck`: είναι το ίδιο API με πριν, μόνο όπου
δηλώνονται. Το PSD115 έχει 69 παλιές διαδρομές (`/week/N/...`), αμετάβλητες.

## PSD115

Το `content/courses/psd115/index.js` είναι adapter: δένει τα υπάρχοντα modules (`course.js`, `topics.js`, `sources.js`,
`questions.js`, `units/k1–k4`) χωρίς να αλλάζει κανένα αρχείο περιεχομένου.
- `slides.byTopic` προκύπτει από τους πίνακες ανά legacy διαδρομή (`K{n}_PPT_SLIDES_BY_ROUTE`).
- Τα layouts βρίσκουν τις διαφάνειες με το `topicId`.
- Η εμφάνιση (layouts, σελίδες θεμάτων, `psd115Ui.jsx`) μένει ειδική για το PSD115 μέχρι τη Φάση 6d-β. Η Εβδομάδα 1
  μένει custom (Δ2).

## Δοκιμαστικό μάθημα (demo-chapters)

`tests/fixtures/courses/demo-chapters/` είναι συνθετικό μάθημα, μόνο για tests (Δ1):
- «Κεφάλαια» με 1 / 3 / 2 θέματα·
- χωρίς legacy, slides ή PDF·
- δικές του κατηγορίες (μία κοινή σε δύο κεφάλαια)·
- ερωτήσεις με 3 και 5 επιλογές·
- σκόπιμα ίδια τοπικά ids με το PSD115.

Έχει δικό του μητρώο IDs:

```
npm run content:ledger -- --manifest tests/fixtures/courses/demo-chapters/index.js [--add]
```

Περνά ως παράμετρος σε pure συναρτήσεις. Δεν μπαίνει στο `content/courses/index.js`, και τίποτα στο `src/` δεν εισάγει
το `tests/` (guard).

## Snapshot σελίδων

`npm run snapshot:pages` (μετά από `npm run build`, και στο CI) καταγράφει 81 σελίδες του PSD115 με σταθερές συνθήκες:
- νέο context ανά διαδρομή·
- μόνο disclaimer και light theme·
- seed στο `Math.random`, σταθερό ρολόι, viewport 1280×900.

Τις συγκρίνει με το `tests/fixtures/psd115-pages.snapshot.json`. Το `--write` γράφει baseline μόνο αν δύο πλήρεις
εκτελέσεις είναι ίδιες. Κάθε αλλαγή του baseline αιτιολογείται στο commit και στο PR («Αποκλίσεις snapshot»).
