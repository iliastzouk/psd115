/**
 * Σημειώσεις μαθημάτων από αρχεία Markdown: `content/courses/<courseId>/notes/<id>.md`.
 * Pure: παίρνει { path → κείμενο } και επιστρέφει ταξινομημένες σημειώσεις ανά μάθημα.
 * Η φόρτωση των αρχείων (import.meta.glob) γίνεται στο courseNotesData.js, ώστε αυτό να τρέχει και σε Node.
 */

const NOTE_PATH_RE = /\/content\/courses\/([a-z0-9]+)\/notes\/([a-z0-9][a-z0-9-]*)\.md$/

/**
 * @param {string} path  διαδρομή αρχείου (όπως τη δίνει το import.meta.glob ή το fs)
 * @param {string} raw   περιεχόμενο Markdown· η πρώτη γραμμή `# …` είναι ο τίτλος
 * @returns {{ courseId: string, id: string, title: string, body: string }}
 */
export function parseNote(path, raw) {
  const m = path.replace(/\\/g, '/').match(NOTE_PATH_RE)
  if (!m) throw new Error(`courseNotes: μη αναμενόμενη διαδρομή «${path}»`)
  const text = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n')
  const h1 = text.match(/^# (.+)\n/)
  if (!h1) throw new Error(`courseNotes: το ${path} δεν ξεκινά με τίτλο «# …»`)
  const title = h1[1]
    .replace(/^[A-Z]+\d+\s*·\s*/, '') // «PSD215 · »
    .replace(/\s*—\s*Σημειώσεις\s*$/, '') // « — Σημειώσεις»
    .trim()
  return { courseId: m[1], id: m[2], title, body: text.slice(h1[0].length).trim() }
}

/**
 * @param {Record<string, string>} files  { path → Markdown }
 * @returns {Record<string, { courseId: string, id: string, title: string, body: string }[]>}  ανά courseId, ταξινομημένες κατά id
 */
export function groupCourseNotes(files) {
  const byCourse = {}
  for (const [path, raw] of Object.entries(files)) {
    const note = parseNote(path, raw)
    ;(byCourse[note.courseId] ??= []).push(note)
  }
  for (const list of Object.values(byCourse)) list.sort((a, b) => a.id.localeCompare(b.id))
  return byCourse
}
