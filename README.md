# Wortschatz-Trainer fürs iPhone

Eine mobile Web-App für Wörter, Definitionen und Synonyme. Sie läuft vollständig im Browser und benötigt keinen laufenden Computer oder Python-Server. Die Oberfläche ist auf kleine Displays, insbesondere 375 × 812 Pixel (iPhone X), ausgelegt. Für das iPhone X ist ein aktuelles iOS 16 vorgesehen.

## Auf GitHub Pages veröffentlichen

1. Ein GitHub-Repository anlegen, beispielsweise `Wortschatz-Trainer`. Bei GitHub Free wird für Pages ein öffentliches Repository benötigt. App-Code und mitgelieferte JSON-Sammlung sind dann öffentlich. Auf dem Handy hinzugefügte Wörter werden nicht zu GitHub übertragen.
2. Den Projektinhalt einschließlich `.github/workflows/pages.yml`, `frontend/` und `database/` in den Branch `main` hochladen. `node_modules`, `venv` und `dist` nicht hochladen; die `.gitignore` schließt sie aus.
3. Im Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** wählen.
4. Unter **Actions → Publish Wortschatz-Trainer → Run workflow** die Veröffentlichung starten. Weitere Pushes auf `main` veröffentlichen automatisch.
5. Die fertige HTTPS-Adresse steht nach erfolgreichem Lauf bei **Settings → Pages** bzw. im Deployment. Normalerweise lautet sie `https://DEIN-NAME.github.io/Wortschatz-Trainer/`.

Der Workflow ermittelt den Projektpfad automatisch, installiert die Abhängigkeiten, prüft den Code und veröffentlicht ausschließlich den Frontend-Build. Für ein Repository mit anderem Namen ist keine Codeänderung erforderlich. Die App verwendet Hash-Routen wie `/#/add`, damit auch Neuladen und Direktlinks auf GitHub Pages funktionieren.

## Zum iPhone-Homebildschirm hinzufügen

1. Die veröffentlichte **HTTPS-Adresse in Safari** öffnen.
2. **Teilen → Zum Home-Bildschirm → Hinzufügen** wählen.
3. Die App über das neue Buchsymbol öffnen, solange Internet verfügbar ist.
4. Unten auf die Meldung **Bereit für offline** warten. Danach kann der Trainer auch ohne Internet und bei ausgeschaltetem Computer genutzt werden.

Safari und die Homebildschirm-App können getrennte Datenspeicher verwenden. Nutze für deine eigenen Einträge deshalb anschließend die installierte App. Eine Homebildschirm-Web-App ist keine App-Store-App.

Die erste Installation benötigt Internet. Das Öffnen über `http://192.168.…` im WLAN reicht für die Offlineinstallation nicht aus; dafür ist HTTPS erforderlich. `localhost` ist eine Ausnahme für Entwicklung am Computer.

## Daten und Sicherungen

Die Ausgangssammlung stammt weiterhin aus diesen JSON-Dateien:

- `database/words.json`: `[{ "word": "eloquent", "definition": "Sprachlich gewandt und überzeugend" }]`
- `database/synonyms.json`: `[{ "word": "eloquent", "synonyms": ["wortgewandt", "redegewandt"] }]`

Vite nimmt diese Dateien in den Build auf. Die App sendet weder Trainingsantworten noch neue Einträge an einen Server. Neue Einträge werden als JSON im lokalen Webspeicher des Geräts gespeichert. Eine Web-App kann die JSON-Dateien im GitHub-Repository nicht direkt überschreiben.

Unter **Hinzufügen → Deine Sammlung sichern** lässt sich die gesamte Sammlung als `wortschatz-sicherung.json` herunterladen und später importieren. Die Sicherung enthält die Listen `words` und `synonyms`. Beim Import werden neue Wörter ergänzt; vorhandene Einträge bleiben unverändert. Es gibt keine automatische Synchronisierung zwischen Geräten. Gelöschte Websitedaten oder vom Betriebssystem freigegebener Webspeicher können lokale Einträge und Offline-Dateien entfernen. Sichere deine eigenen Einträge daher regelmäßig in „Dateien“.

Nach dem ersten Speichern verwendet das Gerät seine eigene vollständige Sammlung. Änderungen an den Ausgangsdateien auf GitHub ersetzen diese nicht. Neue Sammlungen können über die Importfunktion ergänzt werden.

## Lokal entwickeln und prüfen

Voraussetzung: Node.js 22.12 oder neuer.

```powershell
cd frontend
npm ci
npm run dev
```

Das Frontend funktioniert ohne Backend. Der Entwicklungsserver installiert keinen Service Worker. Für einen Test der installierbaren Version:

```powershell
npm run lint
node --test src/quiz.test.js src/storage.test.js
npm run build
node --test pwa.test.js
npm run preview
```

Für die Simulation einer GitHub-Projektadresse vor Build und Preview setzen:

```powershell
$env:PAGES_BASE_PATH = '/Wortschatz-Trainer/'
npm run build
npm run preview
```

Die von Vite ausgegebene Adresse öffnen. Die Offlinefunktion steht im Produktionsbuild bereit. Der Service Worker speichert die komplette App einschließlich der JSON-Ausgangssammlung im JavaScript-Bundle. Eine neue Version wird heruntergeladen, während Internet besteht, und übernimmt nach dem Schließen aller bisherigen App-Fenster. Persönliche Einträge werden durch App-Updates nicht gelöscht.

## Prüfumfang

Build, ESLint, Antwortauswertung, lokale Speicherung, Validierung und JSON-Import werden geprüft. `pwa.test.js` installiert den tatsächlich erzeugten Service Worker in einer Testumgebung und prüft, dass nach einem Neustart ohne Serverzugriff HTML, JavaScript, CSS und Icons aus dem Cache kommen. Dies ersetzt keinen Test in echtem iPhone-Safari.

Die Oberfläche wurde bei 375 × 812 Pixeln im integrierten Browser geprüft. Der Offline-Neustart zeigte dort trotz Bereitschaftsmeldung eine leere Seite; die Ursache ist nicht abschließend geklärt. Nach der Veröffentlichung bitte auf dem iPhone prüfen: App online öffnen, Bereitschaftsmeldung abwarten, Flugmodus einschalten, App schließen und erneut öffnen. Erst dieser Test bestätigt das Verhalten auf deinem Gerät.

## Bisheriges Backend

`backend/` bleibt als eigenständige FastAPI mit JSON-Dateispeicherung erhalten, wird von der iPhone-App aber nicht verwendet und nicht auf GitHub Pages ausgeführt. Die älteren Dateien unter `backend/app/database/` sind weiterhin inaktiv.

Offizielle Anleitungen:
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- iPhone-Homebildschirm: https://support.apple.com/de-de/guide/iphone/iphea86e5236/ios
