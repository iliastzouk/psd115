/**
 * Φάση 6d-α (F3) — τα tests και τα scripts αυτού του PR δουλεύουν και σε Windows: paths με «\\» και checkout με CRLF
 * (git core.autocrlf=true). Σε Linux προσομοιώνεται με το path.win32 και με αρχεία CRLF· ο πλήρης έλεγχος γίνεται
 * τρέχοντας τα tests σε clone με core.autocrlf=true (βλ. PR).
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeEol, readText, relPosix } from './helpers/portable.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('relPosix: σχετικό path με «/» σε κάθε σύστημα', () => {
  test('Windows (path.win32): «\\» → «/»', () => {
    assert.equal(relPosix('C:\\repo', 'C:\\repo\\src\\core\\content\\index.js', path.win32), 'src/core/content/index.js')
  })
  test('POSIX: αμετάβλητο', () => {
    assert.equal(relPosix('/repo', '/repo/src/core/content/index.js', path.posix), 'src/core/content/index.js')
  })
  test('προεπιλογή: το path του συστήματος', () => {
    assert.equal(relPosix(root, path.join(root, 'src', 'core', 'content', 'index.js')), 'src/core/content/index.js')
  })
})

describe('readText / normalizeEol: ίδιο κείμενο με LF ή CRLF', () => {
  test('normalizeEol', () => {
    assert.equal(normalizeEol('a\r\nb\r\n\r\nc'), 'a\nb\n\nc')
    assert.equal(normalizeEol('a\nb'), 'a\nb')
  })
  test('αρχείο CRLF διαβάζεται ίδιο με το LF πρωτότυπο (π.χ. το snapshot harness)', () => {
    const lf = readText(path.join(root, 'scripts/snapshot-pages.mjs'))
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'psd115-crlf-'))
    try {
      const crlf = path.join(dir, 'snapshot-pages.mjs')
      fs.writeFileSync(crlf, lf.replace(/\n/g, '\r\n'))
      assert.ok(fs.readFileSync(crlf, 'utf8').includes('\r\n'))
      assert.equal(readText(crlf), lf)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('scripts αυτού του PR', () => {
  test('το snapshot harness ξεκινά το vite με node (όχι το shell script του node_modules/.bin, που δεν τρέχει στα Windows)', () => {
    const code = readText(path.join(root, 'scripts/snapshot-pages.mjs'))
    assert.doesNotMatch(code, /\.bin\/vite/)
    assert.match(code, /spawn\(process\.execPath, \[VITE_BIN, 'preview'/)
    assert.ok(fs.existsSync(path.join(root, 'node_modules/vite/bin/vite.js')))
  })
  test('τα tests αυτού του PR διαβάζουν πηγές με readText και συγκρίνουν paths με relPosix', () => {
    for (const f of ['tests/pageSnapshot.test.mjs', 'tests/contentRegistry.test.mjs', 'tests/courseContract.test.mjs', 'tests/legacyOptional.test.mjs']) {
      const code = readText(path.join(root, f))
      assert.match(code, /from '\.\/helpers\/portable\.mjs'/, f)
      assert.doesNotMatch(code, /readFileSync\(/, `${f}: χρησιμοποίησε readText`)
      assert.doesNotMatch(code, /path\.relative\(/, `${f}: χρησιμοποίησε relPosix`)
    }
  })
})
