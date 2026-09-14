import { NavLink } from "react-router-dom";

export default function Navbar() {
  return <header><nav aria-label="Hauptnavigation">
    <NavLink className="brand" to="/">Wortschatz<span>Trainer</span></NavLink>
    <div><NavLink to="/">Trainieren</NavLink><NavLink to="/add">Hinzufügen</NavLink></div>
  </nav></header>;
}

