# CLAUDE.md

- Πριν από κάθε νέα φάση ή εργασία, διάβασε το `docs/roadmap.md` (στόχοι, αποφάσεις, κατάσταση, κανόνες). Ενημέρωσέ το όταν
  μια φάση γίνει merge.
- Ενεργή αρχιτεκτονική της προόδου: `docs/progress.md`· ιστορικό σχέδιο migration και φάσεις έως την 6a:
  `docs/history/progress-migration.md`.
- Καμία φάση χωρίς ρητή έγκριση· πρώτα πλάνο. Tests πρώτα, μικρά commits, PR ανοιχτό για review, κανένα merge χωρίς ρητή εντολή.
- Gates πριν από κάθε PR: `npm run validate:content` (μαζί με το μητρώο IDs), `npm run validate:progress -- tests/fixtures/study-progress.sample.json`,
  `npm test`, `npm run build`, `npm run smoke`, `npm run smoke:progress`.
- Νέα ερώτηση / κάρτα: πάντα νέο id, καταχωρισμένο ρητά με `npm run content:ledger -- --add`· αφαίρεση μόνο ως `retired` στο μητρώο.
