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
