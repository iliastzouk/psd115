export function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Αντίγραφο ερώτησης πολλαπλής επιλογής με ανακατεμένες επιλογές και αντίστοιχο correctIndex.
 * Οι ερωτήσεις Σ/Λ μένουν ως έχουν (σταθερή σειρά «Σωστό / Λάθος»). Το id δεν αλλάζει,
 * οπότε η πρόοδος δεν επηρεάζεται.
 */
export function shuffleQuestionOptions(q) {
  if (!q || q.type !== 'mcq' || !Array.isArray(q.options)) return q
  const order = shuffle(q.options.map((_, i) => i))
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    correctIndex: order.indexOf(q.correctIndex),
  }
}
