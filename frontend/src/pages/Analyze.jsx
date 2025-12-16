// frontend/src/pages/Analyze.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import "./Analyze.css";
import { analyzeGuide } from "../api/guideClient";


/**
 * Analyze 페이지
 * - 이미지 업로드 + 브릭 분석 & 조립 가이드 담당
 */
export default function Analyze() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done

  // 서버 분석 결과
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(null);

  // 샘플 페이지에서 넘어온 선택 정보 (없으면 null)
  const location = useLocation();
  const sampleFromNav = location.state ?? null;

  // 이미지 선택 시 상태 갱신
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);

    // 새 이미지면 이전 결과 초기화
    setGuide(null);
    setError(null);
    setAnalysisStatus("idle");
  };

  // ✅ 실제 분석 실행 (image multipart -> /api/guide/analyze)
  const handleAnalyze = async () => {
    if (!selectedFile || analysisStatus === "running") return;

    setAnalysisStatus("running");
    setError(null);

    try {
      const result = await analyzeGuide(selectedFile);
      setGuide(result);
      setAnalysisStatus("done");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
      setAnalysisStatus("idle");
    }
  };

  const statusLabel =
    analysisStatus === "running"
      ? "분석 중..."
      : analysisStatus === "done"
      ? "분석 완료"
      : "대기";

  return (
    <div className="analyze-page">
      <header className="analyze-header">
        <p className="section-eyebrow analyze-kicker">STEP 01 · 이미지 분석</p>

        <div className="analyze-header-row">
          <h1 className="section-title analyze-title">
            이미지를 올려 브릭 분석을 준비해요
          </h1>

          <span className="analyze-pill">{statusLabel}</span>
        </div>

        <p className="section-desc analyze-subtitle">
          업로드한 이미지를 기반으로 브릭의 색상·구성을 나누고, 조립 가이드 초안을
          만들어봅니다. (현재는 1차 MVP 분석)
        </p>
      </header>

      {/* 선택된 샘플 정보 배너 (샘플에서 넘어온 경우만) */}
      {sampleFromNav && (
        <section className="panel analyze-selected-sample">
          <p className="section-eyebrow">선택한 샘플</p>
          <p className="analyze-selected-title">
            {sampleFromNav.title} ({sampleFromNav.width} × {sampleFromNav.height} stud)
          </p>
          <p className="section-desc analyze-selected-desc">
            샘플에서 넘어온 정보는 UI 표시에만 사용 중입니다.
          </p>
        </section>
      )}

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

      {/* STEP 02 · 브릭 조립 가이드 */}
      <section className="panel analyze-guide-section">
        <p className="section-eyebrow">STEP 02 · 브릭 조립 가이드</p>
        <h2 className="section-title">분석 결과로 조립 순서를 확인해요</h2>
        <p className="section-desc">
          서버 분석 결과의 groups(단계) / summary(요약) 를 그대로 출력합니다.
        </p>

        {/* 분석 버튼(보조) */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!selectedFile || analysisStatus === "running"}
          className="btn-primary"
        >
          {analysisStatus === "running" ? "분석 중..." : "조립 가이드(분석) 생성"}
        </button>

        {error && <p className="analyze-error">{error}</p>}

        {guide?.summary && (
          <p className="guide-summary">
            총 {guide.summary.totalBricks}개 · 난이도 {guide.summary.difficulty} · 예상{" "}
            {guide.summary.estimatedTime}
          </p>
        )}

        {Array.isArray(guide?.groups) && guide.groups.length > 0 && (
          <div className="guide-result">
            <ol className="guide-steps">
              {guide.groups.map((group) => (
                <li key={group.id} className="guide-step-item">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                  <p>브릭 {group.bricks?.length ?? 0}개</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {Array.isArray(guide?.palette) && guide.palette.length > 0 && (
          <div className="guide-result" style={{ marginTop: 16 }}>
            <h3>팔레트</h3>
            <ul>
              {guide.palette.map((p) => (
                <li key={p.color}>
                  {p.name} ({p.color}) · {p.count}개
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 임시 디버그용 JSON 출력 */}
      {guide && (
        <section className="guide-debug">
          <details>
            <summary>조립 가이드 JSON 보기 (임시 디버그)</summary>
            <pre>{JSON.stringify(guide, null, 2)}</pre>
          </details>
        </section>
      )}
    </div>
  );
}
