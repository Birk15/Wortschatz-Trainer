import { useState } from 'react';
import { getCollectionStore } from '../collection';

export default function Backup() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function download() {
    setError(''); setMessage('');
    try {
      const json = JSON.stringify({ version: 1, ...getCollectionStore().read() }, null, 2);
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'wortschatz-sicherung.json';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMessage('Sicherung geöffnet. Speichere die JSON-Datei in „Dateien“, falls Safari sie anzeigt.');
    } catch (err) { setError(err.message); }
  }

  async function restore(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setError(''); setMessage(''); setBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Bitte wähle eine JSON-Sicherung unter 5 MB.');
      let data;
      try { data = JSON.parse(await file.text()); }
      catch (cause) { throw new Error('Diese Datei enthält kein gültiges JSON.', { cause }); }
      const added = getCollectionStore().import(data);
      setMessage(`${added} neue Einträge importiert. Bereits vorhandene Wörter wurden beibehalten.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <section className="card backup" aria-label="Sammlung sichern">
    <h2>Deine Sammlung sichern</h2>
    <p>Deine eigenen Wörter bleiben auf diesem Gerät. Sichere sie als JSON, bevor du Websitedaten löschst oder das Gerät wechselst. Es gibt keine automatische Synchronisierung.</p>
    <button type="button" onClick={download} disabled={busy}>JSON-Sicherung speichern</button>
    <label>JSON-Sicherung importieren<input type="file" accept=".json,application/json" onChange={restore} disabled={busy} /></label>
    {message && <p role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}
  </section>;
}
