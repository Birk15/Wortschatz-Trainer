import { useState } from "react";
import NewWords from "../components/NewWords";
import Synonyms from "../components/Synonyms";

export default function Train() {
  const [mode, setMode] = useState("words");
  return <main>
    <p className="eyebrow">JEDES WORT ZÄHLT</p>
    <h1>Erweitere deinen Wortschatz.</h1>
    <p className="intro">Entdecke Bedeutungen und finde neue Worte für deine Gedanken.</p>
    <div className="tabs" aria-label="Trainingsart">
      <button aria-pressed={mode === "words"} onClick={() => setMode("words")}>Wörter & Definitionen</button>
      <button aria-pressed={mode === "synonyms"} onClick={() => setMode("synonyms")}>Synonyme</button>
    </div>
    {mode === "words" ? <NewWords /> : <Synonyms />}
  </main>;
}

