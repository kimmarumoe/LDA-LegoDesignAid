// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Analyze from "./pages/Analyze.jsx";
import Gallery from "./pages/Gallery.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/analyze" element={<Analyze />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
