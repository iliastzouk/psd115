import { UNKNOWN } from '../schema.js'

/**
 * Πηγές: institution/institutionId — επιβεβαίωση χρήστη (campus euc.ac.cy, κωδικοί CYP.EUC).
 * name — «πτυχίο Ψυχολογίας» κατά τον χρήστη· ο επίσημος τίτλος του προγράμματος δεν είναι γνωστός.
 * totalSemesters — ΔΕΝ έχει επιβεβαιωθεί.
 */
export const program = {
  id: 'euc-psychology',
  name: 'Ψυχολογία',
  institution: 'European University Cyprus',
  institutionId: 'EUC',
  totalSemesters: UNKNOWN,
}
