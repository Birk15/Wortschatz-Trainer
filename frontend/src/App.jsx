import { HashRouter } from "react-router-dom";
import Navbar from "./Navbar";
import AppRouter from "./AppRouter";
import InstallHelp from "./components/InstallHelp";

export default function App() {
  return <HashRouter><Navbar /><AppRouter /><InstallHelp /></HashRouter>;
}

