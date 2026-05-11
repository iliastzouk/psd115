# psd115

Personal project workspace — React μελέτη PSD115 Εβδομάδα 1.

## Τοπική εκτέλεση

Αν το PowerShell μπλοκάρει scripts, χρησιμοποίησε `npm.cmd`:

```bash
cd psd115
npm.cmd install
npm.cmd run dev
```

## Deploy στο Vercel

1. **GitHub:** ώθησε το repo (το `vercel.json` ήδη ρυθμίζει SPA fallback σε `index.html`).
2. **Λογαριασμός:** μπες στο [vercel.com](https://vercel.com) και σύνδεσε το GitHub.
3. **Νέο project:** «Add New… → Project», διάλεξε το repository `psd115` (ή όπως το ονόμασες).
4. **Ρυθμίσεις build (συνήθως αυτόματα):**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. **Deploy.** Μετά από κάθε push στο default branch γίνεται νέο deploy.

Εναλλακτικά, με [Vercel CLI](https://vercel.com/docs/cli) από το φάκελο του project:

```bash
npm i -g vercel
vercel
```

Ακολούθησε τα prompts· η πρώτη ανάπτυξη είναι preview, με `vercel --prod` πας production.
