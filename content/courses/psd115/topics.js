/**
 * PSD115 — ρητός, αμετάβλητος πίνακας ταυτότητας θεμάτων (Phase 1C-B).
 *
 *   topicId → unit + legacySlug
 *
 * - Το `id` είναι η ΜΟΝΙΜΗ ταυτότητα του θέματος και το canonical URL: /psd115/topics/<id>.
 *   Δεν αλλάζει ποτέ, ούτε αν το θέμα μετακινηθεί σε άλλη unit (τότε αλλάζει μόνο το `unit`).
 * - `legacySlug` = το slug των παλιών διαδρομών /week/N/<slug> (για redirects και για τα υπάρχοντα
 *   κλειδιά περιεχομένου/προόδου). ΔΕΝ είναι ταυτότητα.
 * - Τα τρία «overview» (ίδιο slug σε Εβδ. 2–4) έχουν σημασιολογικά IDs χωρίς αναφορά σε εβδομάδα.
 * - Τίποτα εδώ δεν παράγεται δυναμικά: κάθε θέμα γράφεται ρητά. Ο έλεγχος περιεχομένου αποτυγχάνει
 *   σε διπλό id, διπλό canonical path, ή θέμα χωρίς unit/legacy αντιστοίχιση.
 */
export const topics = Object.freeze([
  { id: 'definition', unit: 'k1', legacySlug: 'definition' },
  { id: 'philosophers', unit: 'k1', legacySlug: 'philosophers' },
  { id: 'wundt', unit: 'k1', legacySlug: 'wundt' },
  { id: 'functionalism', unit: 'k1', legacySlug: 'functionalism' },
  { id: 'clinical', unit: 'k1', legacySlug: 'clinical' },
  { id: 'psychoanalysis', unit: 'k1', legacySlug: 'psychoanalysis' },
  { id: 'humanistic', unit: 'k1', legacySlug: 'humanistic' },
  { id: 'behaviorism', unit: 'k1', legacySlug: 'behaviorism' },
  { id: 'pavlov', unit: 'k1', legacySlug: 'pavlov' },
  { id: 'little-albert', unit: 'k1', legacySlug: 'little-albert' },
  { id: 'thorndike', unit: 'k1', legacySlug: 'thorndike' },
  { id: 'skinner', unit: 'k1', legacySlug: 'skinner' },
  { id: 'cognitive', unit: 'k1', legacySlug: 'cognitive' },
  { id: 'chomsky', unit: 'k1', legacySlug: 'chomsky' },
  { id: 'neuroscience', unit: 'k1', legacySlug: 'neuroscience' },
  { id: 'gestalt', unit: 'k1', legacySlug: 'gestalt' },
  { id: 'evolutionary', unit: 'k1', legacySlug: 'evolutionary' },
  { id: 'social-psychology', unit: 'k1', legacySlug: 'social-psychology' },
  { id: 'educational-psychology', unit: 'k1', legacySlug: 'educational-psychology' },
  { id: 'other-branches', unit: 'k1', legacySlug: 'other-branches' },
  { id: 'research-methods-overview', unit: 'k2', legacySlug: 'overview' },
  { id: 'empiricism', unit: 'k2', legacySlug: 'empiricism' },
  { id: 'observation', unit: 'k2', legacySlug: 'observation' },
  { id: 'observer-bias', unit: 'k2', legacySlug: 'observer-bias' },
  { id: 'variables', unit: 'k2', legacySlug: 'variables' },
  { id: 'experiment', unit: 'k2', legacySlug: 'experiment' },
  { id: 'sampling-stats', unit: 'k2', legacySlug: 'sampling-stats' },
  { id: 'ethics', unit: 'k2', legacySlug: 'ethics' },
  { id: 'neurobiology-overview', unit: 'k3', legacySlug: 'overview' },
  { id: 'neuron', unit: 'k3', legacySlug: 'neuron' },
  { id: 'signaling', unit: 'k3', legacySlug: 'signaling' },
  { id: 'synaptic-transmission', unit: 'k3', legacySlug: 'synaptic-transmission' },
  { id: 'synapse-neurotransmitters', unit: 'k3', legacySlug: 'synapse-neurotransmitters' },
  { id: 'development', unit: 'k3', legacySlug: 'development' },
  { id: 'nervous-system', unit: 'k3', legacySlug: 'nervous-system' },
  { id: 'brain-structure', unit: 'k3', legacySlug: 'brain-structure' },
  { id: 'cortex-plasticity', unit: 'k3', legacySlug: 'cortex-plasticity' },
  { id: 'lesions-eeg', unit: 'k3', legacySlug: 'lesions-eeg' },
  { id: 'brain-imaging', unit: 'k3', legacySlug: 'brain-imaging' },
  { id: 'sensation-perception-overview', unit: 'k4', legacySlug: 'overview' },
  { id: 'foundations', unit: 'k4', legacySlug: 'foundations' },
  { id: 'vision-anatomy', unit: 'k4', legacySlug: 'vision-anatomy' },
  { id: 'vision-pathways', unit: 'k4', legacySlug: 'vision-pathways' },
  { id: 'object-recognition', unit: 'k4', legacySlug: 'object-recognition' },
  { id: 'depth-motion-change', unit: 'k4', legacySlug: 'depth-motion-change' },
  { id: 'hearing', unit: 'k4', legacySlug: 'hearing' },
  { id: 'touch-pain', unit: 'k4', legacySlug: 'touch-pain' },
  { id: 'smell-taste', unit: 'k4', legacySlug: 'smell-taste' },
  { id: 'summary', unit: 'k4', legacySlug: 'summary' },
].map(Object.freeze))
