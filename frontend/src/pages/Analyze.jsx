// frontend/src/pages/Analyze.jsx
import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import "./Analyze.css";
import { createGuide } from "../api/guideClient";

/**
 * Analyze 페이지
 * - 이미지 업로드 + 브릭 분석 & 조립 가이드 담당
 */
export default function Analyze() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done
  const [guideResult, setGuideResult] = useState(null); // API 응답 저장

  // 이미지 선택 시 상태 갱신
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setGuideResult(null); // 새 이미지 선택 시 이전 분석 결과 초기화
    setAnalysisStatus("idle");
  };

  // 분석 실행 (FastAPI 서버 호출)
  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("분석할 이미지를 먼저 업로드해주세요.");
      return;
    }

    try {
      setAnalysisStatus("running");

      const result = await createGuide(selectedFile);

      setGuideResult(result);
      setAnalysisStatus("done");
    } catch (error) {
      console.error(error);
      alert("분석 중 오류가 발생했습니다. 브라우저 콘솔 로그를 확인해주세요.");
      setAnalysisStatus("idle");
    }
  };

  return (
    <main className="analyze-page">
      <section className="analyze-layout">
        <UploadPanel
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          analysisStatus={analysisStatus}
          onImageSelect={handleImageSelect}
          onAnalyze={handleAnalyze}
        />
        <BrickGuidePanel
          analysisStatus={analysisStatus}
          fileName={selectedFile?.name}
          guideResult={guideResult}
        />
      </section>
    </main>
  );
}
