import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import Train from "./pages/Train";

export default function AppRouter() {
  return <Routes><Route path="/" element={<Train />} /><Route path="/add" element={<Add />} /></Routes>;
}

