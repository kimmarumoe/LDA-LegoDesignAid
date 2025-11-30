// frontend/src/pages/Analyze.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
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

  // 샘플 페이지에서 넘어온 선택 정보 (없으면 null)
  const location = useLocation();
  const sampleFromNav = location.state ?? null;

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

  // todo : 실제분석 결과로 교체
  const [bricks] = useState([
    { id: "x0-y0-z0-red-1x1", x: 0, y: 0, z: 0, color: "red", type: "1x1" },
    { id: "x1-y0-z0-red-1x1", x: 1, y: 0, z: 0, color: "red", type: "1x1" },
    { id: "x0-y1-z0-blue-1x1", x: 0, y: 1, z: 0, color: "blue", type: "1x1" },
  ]);

  const [guide, setGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [error, setError] = useState(null);

  // 샘플 정보가 있으면 그 값, 없으면 기본값 사용
  const designTitle = sampleFromNav?.title ?? "슈퍼마리오 모자이크";
  const mosaicWidth = sampleFromNav?.width ?? 48;
  const mosaicHeight = sampleFromNav?.height ?? 48;

  const handleGenerateGuide = async () => {
    if (!bricks.length) {
      setError("먼저 브릭 데이터가 필요합니다.");
      return;
    }

    setLoadingGuide(true);
    setError(null);

    try {
      const meta = {
        title: designTitle,
        width: mosaicWidth,
        height: mosaicHeight,
        language: "ko",
      };

      const result = await createGuide(bricks, meta);
      setGuide(result);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "조립 가이드 생성 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setLoadingGuide(false);
    }
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

      {/* 선택된 샘플 정보 배너 (샘플에서 넘어온 경우만) */}
      {sampleFromNav && (
        <section className="panel analyze-selected-sample">
          <p className="section-eyebrow">선택한 샘플</p>
          <p className="analyze-selected-title">
            {sampleFromNav.title} ({sampleFromNav.width} ×{" "}
            {sampleFromNav.height} stud 기준)
          </p>
          <p className="section-desc analyze-selected-desc">
            지금은 선택한 샘플 데이터를 기준으로 브릭 분석과 조립 가이드를
            생성합니다.
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
        <h2 className="section-title">
          샘플 브릭으로 조립 가이드를 만들어봐요
        </h2>
        <p className="section-desc">
          지금은 샘플 브릭 데이터로만 가이드를 생성합니다. 나중에는 위에서
          분석된 브릭 데이터를 그대로 연결할 예정입니다.
        </p>

        <button
          type="button"
          onClick={handleGenerateGuide}
          disabled={loadingGuide}
          className="btn-primary"
        >
          {loadingGuide ? "가이드 생성 중..." : "조립 가이드 생성"}
        </button>

        {error && <p className="analyze-error">{error}</p>}

        {guide && (
          <div className="guide-result">
            <ol className="guide-steps">
              {guide.steps.map((step) => (
                <li key={step.step} className="guide-step-item">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>

            {guide.summary && (
              <p className="guide-summary">{guide.summary}</p>
            )}
          </div>
        )}
      </section>

      {/* 임시 디버그용 JSON 출력 */}
      <section className="guide-debug">
        {loadingGuide && <p>조립 가이드를 불러오는 중...</p>}
        {error && <p className="error-text">{error}</p>}
        {guide && (
          <details>
            <summary>조립 가이드 JSON 보기 (임시 디버그)</summary>
            <pre>{JSON.stringify(guide, null, 2)}</pre>
          </details>
        )}
      </section>
    </div>
  );
}
