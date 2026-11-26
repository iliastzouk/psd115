/**
 * Βοηθήματα για tests που διαβάζουν πηγές ή συγκρίνουν paths, ώστε να περνούν και σε Windows (Φάση 6d-α, F3):
 * checkout με CRLF (git core.autocrlf=true) και paths με «\».
 */
import fs from 'node:fs'
import path from 'node:path'

/** CRLF → LF. */
export const normalizeEol = (text) => text.replace(/\r\n/g, '\n')

/** Κείμενο αρχείου με LF, ανεξάρτητα από το checkout. */
export const readText = (file) => normalizeEol(fs.readFileSync(file, 'utf8'))

/** Σχετικό path με «/» σε κάθε σύστημα (impl: path του συστήματος, ή path.win32 / path.posix στα tests). */
export const relPosix = (from, to, impl = path) => impl.relative(from, to).split(impl.sep).join('/')
