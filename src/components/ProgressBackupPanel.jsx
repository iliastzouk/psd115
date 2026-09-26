import { useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import {
  applyImport,
  createSafetyBackup,
  exportProgressToFile,
  readImportFile,
} from '../utils/progressBackup.js'

const btn =
  'touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:bg-white dark:hover:bg-slate-900 transition'

function describeStats(s) {
  if (!s) return ''
  return `${s.keys} κλειδιά · κουίζ ${s.quizCorrect}/${s.quizAnswered} · κάρτες ${s.flashcardsSeen} · λάθη ${s.wrongAnswers} · checklist ${s.checklistItemsChecked}`
}

/** Εξαγωγή / εισαγωγή προόδου (footer). */
export default function ProgressBackupPanel() {
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState(null)

  const onExport = () => {
    try {
      const data = exportProgressToFile()
      setMessage({ tone: 'ok', lines: [`Εξήχθησαν ${Object.keys(data.keys).length} κλειδιά προόδου.`] })
    } catch {
      setMessage({ tone: 'error', lines: ['Η εξαγωγή απέτυχε.'] })
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await readImportFile(file)
    if (!result.ok) {
      setMessage({
        tone: 'error',
        lines: ['Το αρχείο απορρίφθηκε· η τρέχουσα πρόοδος δεν άλλαξε.', ...result.errors.slice(0, 8)],
      })
      return
    }
    setMessage(null)
    setPending(result)
  }

  const onConfirmImport = () => {
    const result = pending
    setPending(null)
    try {
      createSafetyBackup('import')
      applyImport(result.data)
    } catch {
      setMessage({ tone: 'error', lines: ['Η εισαγωγή απέτυχε· η προηγούμενη πρόοδος διατηρήθηκε.'] })
      return
    }
    // Επαναφόρτωση αμέσως: αλλιώς η εφαρμογή θα έγραφε από πάνω την παλιά πρόοδο που κρατά στη μνήμη.
    window.location.reload()
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Αντίγραφο προόδου</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onExport} className={btn}>
          Εξαγωγή προόδου (JSON)
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
          Εισαγωγή προόδου…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onPickFile}
          data-testid="progress-import-input"
        />
      </div>
      {message ? (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-xs space-y-0.5 ${
            message.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
              : 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200'
          }`}
        >
          {message.lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={onConfirmImport}
        title="Εισαγωγή προόδου"
        description={
          pending
            ? `Το αρχείο (${pending.data.exportedAt ?? 'χωρίς ημερομηνία'}) περιέχει: ${describeStats(pending.stats)}. ` +
              'Θα αντικαταστήσει τα αντίστοιχα κλειδιά της τρέχουσας προόδου· κλειδιά που δεν υπάρχουν στο αρχείο μένουν ως έχουν. ' +
              'Πριν από την εισαγωγή θα κατέβει αυτόματα αντίγραφο της τρέχουσας προόδου. ' +
              (pending.warnings.length ? `Προειδοποιήσεις: ${pending.warnings.join(' · ')}. ` : '') +
              'Κλείσε τυχόν άλλα ανοιχτά tabs της εφαρμογής· η σελίδα θα επαναφορτωθεί.'
            : ''
        }
        cancelLabel="Άκυρο"
        confirmLabel="Ναι, εισαγωγή"
        variant="danger"
      />
    </div>
  )
}
