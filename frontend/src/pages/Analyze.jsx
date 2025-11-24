// frontend/src/pages/Analyze.jsx
import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import "./Analyze.css";

/**
 * Analyze 페이지
 * - 이미지 업로드 + 브릭 분석 & 조립 가이드 담당
 */
export default function Analyze() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done

  // 이미지 선택 시 상태 갱신
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setAnalysisStatus("idle");
  };

  // 분석 실행 (지금은 샘플 데이터 모드)
  const handleAnalyze = () => {
    if (!selectedFile || analysisStatus === "running") return;

    setAnalysisStatus("running");

    // TODO: 실제 백엔드 연동 예정
    setTimeout(() => {
      setAnalysisStatus("done");
    }, 800);
  };

  return (
    <div className="analyze-page">
      <header className="analyze-header">
  {/* 공통 라벨 스타일 + 분석 전용 위치 조정 */}
  <p className="section-eyebrow analyze-kicker">
    STEP 01 · 이미지 분석
  </p>

  <div className="analyze-header-row">
    {/* 공통 타이틀 + 분석 전용(폰트 크기 그대로 쓰고 싶으면 유지) */}
    <h1 className="section-title analyze-title">
      이미지를 올려 브릭 분석을 준비해요
    </h1>

    <span className="analyze-pill">샘플 데이터 모드</span>
  </div>

  {/* 공통 설명 + 분석 전용 너비 조정 */}
  <p className="section-desc analyze-subtitle">
    LDA가 업로드한 이미지를 기반으로 브릭의 색상·형태·구성을 나누고,
    조립 가이드 초안을 만들어 볼 예정입니다. 지금은 UI 구조를 먼저
    확인하기 위해 샘플 결과만 보여주는 단계입니다.
  </p>
</header>


      {/* 업로드 패널 + 브릭 가이드 패널 */}
      <section className="analyze-layout">
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
    </div>
  );
}
