// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Analyze from "./pages/Analyze.jsx";
import Layout from "./components/layout/Layout.jsx";
import Sample from "./pages/Sample.jsx";
function AnalyzeRoute() {
  const location = useLocation();
  return <Analyze key={location.key} />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* 메인 홈 */}
        <Route path="/" element={<Home />} />
        {/* 분석 페이지 */}
        <Route path="/analyze" element={<AnalyzeRoute />} />
        {/* 샘플 갤러리 */}
        <Route path="/sample" element={<Sample />} />
        {/* 그 외 모든 주소는 홈으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
