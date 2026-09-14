import { useEffect, useState } from "react";
import { request } from "../api";
import { evaluateAnswers } from "../quiz";

export default function Quiz({ kind }) {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(0);
  const [previous, setPrevious] = useState("");
  const synonymsMode = kind === "synonyms";

  useEffect(() => {
    const controller = new AbortController();
    request(`/get_${kind}?exclude=${encodeURIComponent(previous)}`, { signal: controller.signal })
      .then(entry => {
        if (controller.signal.aborted) return;
        setData(entry);
        setAnswers(Array(kind === "synonyms" ? entry.synonyms.length : 1).fill(""));
        setLoading(false);
      })
      .catch(err => { if (!controller.signal.aborted) { setError(err.message); setLoading(false); } });
    return () => controller.abort();
  }, [kind, round, previous]);

  function next() {
    setPrevious(data?.word ?? "");
    setLoading(true);
    setError("");
    setResult(null);
    setRound(value => value + 1);
  }

  function check(event) {
    event.preventDefault();
    setResult(evaluateAnswers(answers, synonymsMode ? data.synonyms : [data.word]));
  }

  return <section className="card" aria-label="Übung" aria-busy={loading}>
    {loading ? <p role="status">Die nächste Aufgabe wird geladen …</p> : error ? <div role="alert"><p>{error}</p><button onClick={next}>Erneut versuchen</button></div> : data && <>
      <p className="eyebrow">{synonymsMode ? "ANDERS GESAGT" : "WELCHES WORT IST GESUCHT?"}</p>
      <h2>{synonymsMode ? data.word : "Erkennst du die Bedeutung?"}</h2>
      <p className="prompt">{synonymsMode ? `Finde ${data.synonyms.length} Synonyme. Die Reihenfolge ist egal; jedes Wort zählt einmal.` : data.definition}</p>
      <form onSubmit={check}>
        {answers.map((answer, index) => <label key={index}>
          {synonymsMode ? `Synonym ${index + 1}` : "Deine Antwort"}
          <input autoComplete="off" value={answer} readOnly={result !== null} maxLength={100}
            className={result ? result[index] ? "correct" : "incorrect" : ""}
            onChange={event => setAnswers(values => values.map((value, i) => i === index ? event.target.value : value))}
            placeholder={synonymsMode ? "Synonym eingeben …" : "Passendes Wort eingeben …"} />
        </label>)}
        {result === null && <button type="submit" disabled={!answers.some(value => value.trim())}>Antwort prüfen</button>}
      </form>
      {result !== null && <div className="feedback" role="status">
        <strong>{synonymsMode ? `${result.filter(Boolean).length} von ${answers.length} richtig` : result[0] ? "Richtig! Gut gemacht." : "Noch nicht ganz – lerne das Wort kennen."}</strong>
        <p>{synonymsMode ? "Gespeicherte Synonyme" : "Richtige Lösung"}: <b>{synonymsMode ? data.synonyms.join(", ") : data.word}</b></p>
        <button onClick={next}>Nächste Aufgabe →</button>
      </div>}
      <p className="hint">{synonymsMode ? "Gewertet werden die Synonyme aus deiner Sammlung. " : ""}Groß- und Kleinschreibung spielt keine Rolle.</p>
    </>}
  </section>;
}

