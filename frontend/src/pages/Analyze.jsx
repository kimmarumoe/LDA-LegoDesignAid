// frontend/src/pages/Analyze.jsx
import { useEffect, useState } from "react";
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
    const [analysisStatus, setAnalysisStatus] = useState("idle");

  const handleImageSelect = (file, url) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file || !url) {
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

  useEffect(()=>{
    return () =>{
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
    };
  },[previewUrl])

  return (
    <section className="analyze-page">
      <h1 className="analyze-title">이미지 분석</h1>
      <p className="analyze-subtitle">
        이미지를 업로드하면 레고 브릭 조합과 조립 단계를 안내해 줄 예정입니다.
        지금은 샘플 데이터를 이용해 화면 구조를 먼저 확인하는 단계입니다.
      </p>

      <div className="analyze-layout">
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
      </div>
    </section>
  );
}
