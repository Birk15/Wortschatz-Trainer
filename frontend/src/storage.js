const KEY = 'wortschatz.collection.v1';
const normalize = value => value.normalize('NFC').trim().toLocaleLowerCase('de');

function text(value, maximum) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new Error(`Bitte verwende ausgefüllte Textfelder mit höchstens ${maximum} Zeichen.`);
  }
  return value.trim().normalize('NFC');
}

export function validateEntry(kind, entry) {
  if (!entry || typeof entry !== 'object') throw new Error('Ungültiger Eintrag.');
  const word = text(entry.word, 100);
  if (kind === 'words') return { word, definition: text(entry.definition, 2000) };
  if (!Array.isArray(entry.synonyms) || entry.synonyms.length < 1 || entry.synonyms.length > 20) {
    throw new Error('Bitte gib zwischen 1 und 20 Synonyme an.');
  }
  const synonyms = entry.synonyms.map(value => text(value, 100));
  const unique = new Set([word, ...synonyms].map(normalize));
  if (unique.size !== synonyms.length + 1) throw new Error('Synonyme dürfen weder doppelt vorkommen noch dem Wort entsprechen.');
  return { word, synonyms };
}

export function validateCollection(value) {
  if (!value || !Array.isArray(value.words) || !Array.isArray(value.synonyms)) {
    throw new Error('Die JSON-Sicherung muss die Listen „words“ und „synonyms“ enthalten.');
  }
  const collection = {};
  for (const kind of ['words', 'synonyms']) {
    collection[kind] = value[kind].map(entry => validateEntry(kind, entry));
    if (new Set(collection[kind].map(entry => normalize(entry.word))).size !== collection[kind].length) {
      throw new Error('Die JSON-Sicherung enthält doppelte Wörter.');
    }
  }
  return collection;
}

export function createCollectionStore(storage, seed) {
  function read() {
    const raw = storage.getItem(KEY);
    if (raw === null) return validateCollection(seed);
    try { return validateCollection(JSON.parse(raw)); }
    catch (cause) { throw new Error('Die gespeicherte Sammlung konnte nicht gelesen werden. Deine Daten wurden nicht überschrieben.', { cause }); }
  }

  function write(collection) {
    try { storage.setItem(KEY, JSON.stringify(collection)); }
    catch (cause) { throw new Error('Speichern auf diesem Gerät nicht möglich. Bitte prüfe den freien Speicher und die Safari-Einstellungen.', { cause }); }
  }

  return {
    read,
    add(kind, value) {
      const entry = validateEntry(kind, value);
      const collection = read();
      if (collection[kind].some(item => normalize(item.word) === normalize(entry.word))) {
        throw new Error('Dieses Wort ist bereits vorhanden.');
      }
      collection[kind].push(entry);
      write(collection);
      return entry;
    },
    import(value) {
      const incoming = validateCollection(value);
      const collection = read();
      let added = 0;
      for (const kind of ['words', 'synonyms']) {
        const known = new Set(collection[kind].map(entry => normalize(entry.word)));
        for (const entry of incoming[kind]) {
          if (!known.has(normalize(entry.word))) { collection[kind].push(entry); added += 1; }
        }
      }
      write(collection);
      return added;
    },
  };
}
