import { getCollectionStore } from './collection';

// Preserve the quiz's request interface while keeping all data on the device.
export async function request(path, options = {}) {
  if (options.signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
  const store = getCollectionStore();
  const url = new URL(path, 'https://wortschatz.invalid');
  if (options.method === 'POST') {
    const kind = { '/post_data_w': 'words', '/post_data_s': 'synonyms' }[url.pathname];
    if (!kind) throw new Error('Unbekannte Aktion.');
    return store.add(kind, JSON.parse(options.body));
  }
  const kind = { '/get_words': 'words', '/get_synonyms': 'synonyms' }[url.pathname];
  if (!kind) throw new Error('Unbekannte Trainingsart.');
  const entries = store.read()[kind];
  if (!entries.length) throw new Error('Noch keine Einträge vorhanden. Bitte zuerst einen Eintrag hinzufügen.');
  const candidates = entries.filter(entry => entry.word !== url.searchParams.get('exclude'));
  const pool = candidates.length ? candidates : entries;
  return pool[Math.floor(Math.random() * pool.length)];
}
