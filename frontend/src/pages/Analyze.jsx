// frontend/src/pages/Analyze.jsx
import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import "./Analyze.css";

/**
 * Analyze 페이지
 * - 이미지 업로드 + 브릭 분석 & 조립 가이드 담당
 * - 공통 레이아웃(헤더/탭/배경)은 Layout이 처리
 */
export default function Analyze() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done

  const handleImageSelect = (file, url) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalysisStatus("idle");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(url);
    setAnalysisStatus("idle");
  };

  const handleAnalyze = () => {
    if (!selectedFile || analysisStatus === "running") return;

    setAnalysisStatus("running");

    // TODO: 나중에 실제 분석 API 연동
    setTimeout(() => {
      setAnalysisStatus("done");
    }, 1000);
  };

  return (
    <section className="panel upload-panel">
      <UploadPanel
        file={selectedFile}
        previewUrl={previewUrl}
        analysisStatus={analysisStatus}
        onSelect={handleImageSelect}
        onAnalyze={handleAnalyze}
      />

      <BrickGuidePanel
        analysisStatus={analysisStatus}
        fileName={selectedFile?.name ?? ""}
      />
    </section>
  );
}
