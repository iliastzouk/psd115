/**
 * Φάση 6b — αίτημα μόνιμης αποθήκευσης (src/core/progress/persist.js). Μεταφέρθηκε από το progressStore.test.mjs.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requestPersistentStorage } from '../src/core/progress/persist.js'

test('χωρίς StorageManager → unsupported, χωρίς σφάλμα', async () => {
  assert.equal(await requestPersistentStorage({ navigator: undefined }), 'unsupported')
  assert.equal(await requestPersistentStorage({ navigator: {} }), 'unsupported')
  assert.equal(await requestPersistentStorage({ navigator: { storage: {} } }), 'unsupported')
})

test('granted / denied / already / error', async () => {
  const nav = (persisted, persist) => ({ storage: { persisted: async () => persisted, persist } })
  assert.equal(await requestPersistentStorage({ navigator: nav(false, async () => true) }), 'granted')
  assert.equal(await requestPersistentStorage({ navigator: nav(false, async () => false) }), 'denied')
  assert.equal(await requestPersistentStorage({ navigator: nav(true, async () => true) }), 'already')
  assert.equal(await requestPersistentStorage({ navigator: { storage: { persist: async () => true } } }), 'granted', 'χωρίς persisted()')
  assert.equal(await requestPersistentStorage({ navigator: nav(false, async () => { throw new Error('x') }) }), 'error')
})
