# CLAUDE.md

- Πριν από κάθε νέα φάση ή εργασία, διάβασε το `docs/roadmap.md` (στόχοι, αποφάσεις, κατάσταση, κανόνες). Ενημέρωσέ το όταν
  μια φάση γίνει merge.
- Λεπτομέρειες υλοποίησης της προόδου ανά φάση: `docs/progress-migration.md`.
- Καμία φάση χωρίς ρητή έγκριση· πρώτα πλάνο. Tests πρώτα, μικρά commits, PR ανοιχτό για review, κανένα merge χωρίς ρητή εντολή.
- Gates πριν από κάθε PR: `npm run validate:content`, `npm run validate:progress -- tests/fixtures/progress-export.sample.json`,
  `npm test`, `npm run build`, `npm run smoke`, `npm run smoke:shadow`, `npm run smoke:progress`.
