import words from '../../database/words.json';
import synonyms from '../../database/synonyms.json';
import { createCollectionStore } from './storage';

// Access storage only when needed, so unavailable storage produces a visible error.
export function getCollectionStore() {
  return createCollectionStore(window.localStorage, { words, synonyms });
}
