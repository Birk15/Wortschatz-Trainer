import { useEffect, useState } from 'react';

export default function InstallHelp() {
  const [status, setStatus] = useState('Die Offline-Funktion wird vorbereitet …');
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let active = true;
    const update = message => { if (active) setStatus(message); };
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then(async registration => {
        if (!registration.active && registration.installing) {
          registration.installing.addEventListener('statechange', event => {
            if (event.target.state === 'redundant') update('Offline-Speicherung fehlgeschlagen. Bitte lade die App bei bestehender Internetverbindung erneut.');
          });
        }
        await navigator.serviceWorker.ready;
        update('Bereit für offline. Öffne die App nach dem Hinzufügen einmal vom Homebildschirm mit Internetverbindung.');
      })
      .catch(() => update('Offline-Speicherung fehlgeschlagen. Bitte lade die App bei bestehender Internetverbindung erneut.'));
    return () => { active = false; };
  }, []);

  const offlineMessage = !import.meta.env.PROD
    ? 'Offline-Nutzung steht in der veröffentlichten Version bereit.'
    : !window.isSecureContext || !('serviceWorker' in navigator)
      ? 'Für die Offline-Nutzung öffne die App über eine HTTPS-Adresse in Safari.'
      : status;

  return <footer className="install-help">
    <details><summary>Auf dem iPhone als App verwenden</summary>
      <ol><li>Diese Seite in Safari öffnen.</li><li>Auf „Teilen“ und dann „Zum Home-Bildschirm“ tippen.</li><li>Mit „Hinzufügen“ bestätigen und die App über das neue Symbol öffnen.</li></ol>
      <p>Nutze anschließend die Homebildschirm-App für deine Sammlung. Safari und die installierte App können getrennte Datenspeicher haben.</p>
    </details>
    <p className="hint" role="status">{offlineMessage}</p>
  </footer>;
}
