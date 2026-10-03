import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCollectionStore } from './storage.js';

const seed = { words: [{ word: 'präzise', definition: 'Genau' }], synonyms: [{ word: 'schnell', synonyms: ['rasch', 'flink'] }] };
function memory() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('seeds remain unchanged and new words survive a new store instance', () => {
  const storage = memory();
  const store = createCollectionStore(storage, seed);
  store.add('words', { word: ' mutig ', definition: 'Tapfer' });
  assert.equal(createCollectionStore(storage, seed).read().words[1].word, 'mutig');
  assert.equal(seed.words.length, 1);
  assert.throws(() => store.add('words', { word: 'MUTIG', definition: 'Tapfer' }), /bereits/);
});

test('invalid synonyms and storage failures never claim success', () => {
  const store = createCollectionStore(memory(), seed);
  for (const synonyms of [[], ['rasch', ' RASCH '], ['schnell'], [' ']]) {
    assert.throws(() => store.add('synonyms', { word: 'schnell', synonyms }));
  }
  const unavailable = createCollectionStore({ getItem: () => null, setItem: () => { throw new Error('Quota'); } }, seed);
  assert.throws(() => unavailable.add('words', { word: 'neu', definition: 'Test' }), /Speichern/);
});

test('JSON export/import preserves entries, adds missing ones, and validates before writing', () => {
  const store = createCollectionStore(memory(), seed);
  const backup = JSON.parse(JSON.stringify(store.read()));
  backup.words[0].definition = 'Existing data must not change';
  backup.words.push({ word: 'neu', definition: 'Neuer Eintrag' });
  assert.equal(store.import(backup), 1);
  assert.equal(store.read().words[0].definition, 'Genau');
  assert.equal(store.import(backup), 0);
  const before = store.read();
  assert.throws(() => store.import({ words: [{ word: '', definition: 'Bad' }], synonyms: [] }));
  assert.deepEqual(store.read(), before);
});

test('corrupt stored data is not overwritten', () => {
  let writes = 0;
  const store = createCollectionStore({ getItem: () => '{broken', setItem: () => { writes++; } }, seed);
  assert.throws(() => store.add('words', { word: 'neu', definition: 'Test' }), /nicht gelesen/);
  assert.equal(writes, 0);
});

test('a word-list revision replaces existing words once and preserves all synonyms', () => {
  const storage = memory();
  const oldStore = createCollectionStore(storage, seed);
  oldStore.add('words', { word: 'alt', definition: 'Alter Eintrag' });
  oldStore.add('synonyms', { word: 'mutig', synonyms: ['tapfer'] });
  const previousSynonyms = oldStore.read().synonyms;
  const updatedSeed = { words: [{ word: 'katalogisieren', definition: 'Geordnet erfassen' }], synonyms: [] };
  const updated = createCollectionStore(storage, updatedSeed, '2026-10-03');
  assert.deepEqual(updated.read().words, updatedSeed.words);
  assert.deepEqual(updated.read().synonyms, previousSynonyms);
  updated.add('words', { word: 'später', definition: 'Nach dem Wechsel hinzugefügt' });
  const reopened = createCollectionStore(storage, updatedSeed, '2026-10-03');
  assert.equal(reopened.read().words.length, 2);
  assert.deepEqual(reopened.read().synonyms, previousSynonyms);
});

test('failed word-list replacement leaves the previous collection intact', () => {
  const raw = JSON.stringify(seed);
  const storage = { getItem: () => raw, setItem: () => { throw new Error('Quota'); } };
  const store = createCollectionStore(storage, { words: [], synonyms: [] }, '2026-10-03');
  assert.throws(() => store.read(), /Speichern/);
  assert.equal(storage.getItem(), raw);
});
