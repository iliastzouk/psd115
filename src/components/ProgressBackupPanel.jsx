import { useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { getProgressService } from '../hooks/useProgress.js'
import { courseIdentity } from '../core/routing/navigation.js'
import { applyImport, exportProgressToFile, planImport, readImportFile } from '../utils/studyProgressBackup.js'
import { describeImportPlan, describeProgressFailure } from '../utils/progressFailureMessage.js'

const btn =
  'touch-manipulation rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-400 hover:bg-white dark:hover:bg-slate-900 transition'

const courseLabel = (courseId) => courseIdentity(courseId)?.code ?? courseId

/**
 * Εξαγωγή / εισαγωγή προόδου (footer), Φάση 6a: μόνο η νέα μορφή `study-progress`.
 * Εισαγωγή = προεπισκόπηση ανά μάθημα → ρητή επιβεβαίωση → (έλεγχος αποτυπώματος, safety backup, συναλλαγή) → resync.
 * Σε πρόοδο που δεν διαβάζεται (`corrupt`): η εισαγωγή γίνεται πλήρης αντικατάσταση. Σε σημάδι συναλλαγής που δεν
 * ανακτάται / χωρίς storage: μόνο εξαγωγή (raw).
 * @param {{ reason?: string | null }} props reason του degraded (null = ready)
 */
export default function ProgressBackupPanel({ reason = null }) {
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState(null)
  const importAllowed = reason === null || reason === 'corrupt'

  const onExport = () => {
    try {
      const data = exportProgressToFile()
      setMessage({
        tone: 'ok',
        lines: [data.format === 'study-progress' ? `Εξήχθησαν ${data.events.length} καταγραφές προόδου.` : 'Εξήχθησαν τα δεδομένα αυτούσια (η πρόοδος δεν διαβάζεται με ασφάλεια).'],
      })
    } catch {
      setMessage({ tone: 'error', lines: ['Η εξαγωγή απέτυχε.'] })
    }
  }

  const preview = (data) => {
    try {
      const plan = planImport(data, { adapters: getProgressService().adapters })
      setMessage(null)
      setPending({ data, plan, text: describeImportPlan(plan, { courseLabel }) })
    } catch (e) {
      setPending(null)
      setMessage({ tone: 'error', lines: [describeProgressFailure('import', e)] })
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = await readImportFile(file)
    if (!result.ok) {
      setMessage({ tone: 'error', lines: ['Το αρχείο απορρίφθηκε· η τρέχουσα πρόοδος δεν άλλαξε.', ...result.errors] })
      return
    }
    preview(result.data)
  }

  const onConfirmImport = () => {
    const { data, plan } = pending
    setPending(null)
    try {
      applyImport(plan, data, { adapters: getProgressService().adapters })
    } catch (e) {
      if (e?.name === 'StaleImportError') {
        // Η τοπική πρόοδος άλλαξε μετά την προεπισκόπηση: καμία εγγραφή· νέα προεπισκόπηση πάνω στην τρέχουσα κατάσταση.
        preview(data)
        setMessage({ tone: 'error', lines: [describeProgressFailure('import', e)] })
        return
      }
      setMessage({ tone: 'error', lines: [describeProgressFailure('import', e)] })
      return
    }
    getProgressService().resync()
    setMessage({ tone: 'ok', lines: [plan.mode === 'replace' ? 'Η πρόοδος αντικαταστάθηκε από το αρχείο.' : 'Η εισαγωγή ολοκληρώθηκε.'] })
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Αντίγραφο προόδου</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onExport} className={btn}>
          Εξαγωγή προόδου (JSON)
        </button>
        {importAllowed ? (
          <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
            {reason === 'corrupt' ? 'Αντικατάσταση από αντίγραφο…' : 'Εισαγωγή προόδου…'}
          </button>
        ) : null}
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onPickFile} data-testid="progress-import-input" />
      </div>
      {message ? (
        <div
          role="status"
          data-testid="progress-backup-message"
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
        title={pending?.plan.mode === 'replace' ? 'Αντικατάσταση προόδου' : 'Εισαγωγή προόδου'}
        description={pending ? `${pending.text.summary} Αρχείο: ${pending.data.exportedAt ?? 'χωρίς ημερομηνία'}.` : ''}
        cancelLabel="Άκυρο"
        confirmLabel={pending?.plan.mode === 'replace' ? 'Ναι, αντικατάσταση' : 'Ναι, εισαγωγή'}
        variant={pending?.plan.requiresConfirmation ? 'danger' : 'neutral'}
      >
        {pending ? (
          <div className="space-y-2" data-testid="import-preview">
            <ul className="space-y-1">
              {pending.text.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            {/* review #18: τα ίδια τα στοιχεία ανά μάθημα και κατηγορία, σε ανάπτυξη. */}
            {pending.text.details.map((d) => (
              <details key={d.courseId} data-testid={`import-details-${d.courseId}`} className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1">
                <summary className="cursor-pointer font-medium">Λεπτομέρειες: {d.title}</summary>
                {d.sections.map((sec) => (
                  <div key={sec.title} className="mt-1">
                    <p className="font-medium">{sec.title}</p>
                    <ul className="list-disc pl-4">
                      {sec.items.map((it, i) => (
                        <li key={i} className="break-all">
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            ))}
            {pending.text.warnings.length ? (
              <div data-testid="import-warnings">
                <p className="font-medium">Προειδοποιήσεις</p>
                <ul className="list-disc pl-4">
                  {pending.text.warnings.map((w, i) => (
                    <li key={i} className="break-all">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
