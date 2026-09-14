import { useState } from "react";
import { request } from "../api";
import Backup from "../components/Backup";

export default function Add() {
  const [kind, setKind] = useState("words");
  const [word, setWord] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    const payload = kind === "words" ? { word: word.trim(), definition: content.trim() } : { word: word.trim(), synonyms: content.split(/[,;\n]/).map(value => value.trim()).filter(Boolean) };
    try {
      await request(kind === "words" ? "/post_data_w" : "/post_data_s", { method: "POST", body: JSON.stringify(payload) });
      setMessage(`„${word.trim()}“ wurde gespeichert und kann jetzt trainiert werden.`);
      setWord(""); setContent("");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <main>
    <p className="eyebrow">DEINE SAMMLUNG</p><h1>Neue Wörter, neue Möglichkeiten.</h1>
    <p className="intro">Ergänze deine eigenen Einträge. Sie werden auf diesem Gerät gespeichert und stehen auch offline bereit.</p>
    <section className="card"><form onSubmit={save}>
      <label>Art des Eintrags<select disabled={busy} value={kind} onChange={event => { setKind(event.target.value); setContent(""); setMessage(""); setError(""); }}><option value="words">Wort & Definition</option><option value="synonyms">Wort & Synonyme</option></select></label>
      <label>Wort<input required maxLength={100} disabled={busy} value={word} onChange={event => setWord(event.target.value)} placeholder="Zum Beispiel: eloquent" /></label>
      <label>{kind === "words" ? "Definition" : "Synonyme (mit Komma oder Zeilenumbruch trennen)"}<textarea required maxLength={kind === "words" ? 2000 : 2020} disabled={busy} rows={4} value={content} onChange={event => setContent(event.target.value)} placeholder={kind === "words" ? "Was bedeutet dieses Wort?" : "wortgewandt, redegewandt, beredt"} /></label>
      <button disabled={busy || !word.trim() || !content.trim()}>{busy ? "Wird gespeichert …" : "Eintrag speichern"}</button>
    </form>{message && <p className="feedback" role="status">{message}</p>}{error && <p className="error" role="alert">{error}</p>}</section>
    <Backup />
  </main>;
}

