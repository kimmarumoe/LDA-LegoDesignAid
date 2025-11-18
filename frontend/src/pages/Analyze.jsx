// src/pages/Analyze.jsx
import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
// 스타일 파일 쓰고 있으면 같이 import
import "./Analyze.css";

export default function Analyze() {
  // 1) 상태 정의
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle, running, done

  // 2) 업로드 패널에서 파일 선택/변경할 때 호출
  const handleImageSelect = (file, url) => {
    // 이전 미리보기 URL 정리
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // 파일이 없으면 초기화
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalysisStatus("idle");
      return;
    }

    // 새 파일/URL 상태 반영
    setSelectedFile(file);
    setPreviewUrl(url);
    setAnalysisStatus("idle");
  };

  // 3) "이미지 분석 시작" 버튼 클릭 시 호출
  const handleAnalyze = () => {
    if (!selectedFile || analysisStatus === "running") return;

    setAnalysisStatus("running");

    // TODO: 실제 분석 API 연동
    setTimeout(() => {
      setAnalysisStatus("done");
    }, 1000);
  };

  // 4) 컴포넌트 전체 UI는 여기서 한 번만 반환
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo-row">
          <div className="app-logo-mark">
            <span className="app-logo-text-short">LDA</span>
          </div>

          <div>
            <h1>LDA (Lego Design Aid)</h1>
            <p className="app-subtitle">
              이미지, 그림, 사진을 업로드하고 레고 브릭 설계 도움을 받는 개인 토이 프로젝트
            </p>
          </div>
        </div>
      </header>

      <main className="app-main">
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
      </main>
    </div>
  );
}
