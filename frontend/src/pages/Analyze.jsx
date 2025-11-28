// frontend/src/pages/Analyze.jsx
import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import "./Analyze.css";
import { createGuide } from "../api/guideClient";
import { SAMPLE_GUIDE } from "../sample/sampleGuide";

/**
 * Analyze 페이지
 * - 이미지 업로드 + 브릭 분석 & 조립 가이드 담당
 */
export default function Analyze() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done

  // STEP 01: 이미지 분석 결과(브릭 가이드) 샘플 상태
  const [analysisGuide, setAnalysisGuide] = useState(null);

  // STEP 02: 조립 가이드 결과 상태 (OpenAI 등으로 생성되는 텍스트 가이드)
  const [guide, setGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [error, setError] = useState(null);

  // STEP 01/02 공통으로 사용하는 샘플 브릭/메타 데이터
  const bricks = SAMPLE_GUIDE.bricks;
  const designTitle = SAMPLE_GUIDE.summary?.title ?? "슈퍼마리오 모자이크";
  const mosaicWidth = SAMPLE_GUIDE.width ?? 48;
  const mosaicHeight = SAMPLE_GUIDE.height ?? 48; // TODO: 필요 시 메타에 포함

  // 이미지 선택 시 상태 갱신
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);

    // 새 이미지를 선택하면 분석 상태/결과 초기화
    setAnalysisStatus("idle");
    setAnalysisGuide(null);
  };

  // STEP 01 · 분석 실행 (지금은 샘플 데이터 모드)
  const handleAnalyze = async () => {
    if (!selectedFile || analysisStatus === "running") return;

    setAnalysisStatus("running");

    try {
      // 실제 백엔드 연동 전까지는 샘플 데이터로 UI만 테스트
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAnalysisGuide(SAMPLE_GUIDE);
      setAnalysisStatus("done");
    } catch (e) {
      console.error("이미지 분석 중 오류:", e);
      setAnalysisStatus("idle");
    }
  };

  // STEP 02 · 조립 가이드 생성 (OpenAI 가이드 문장화)
  const handleGenerateGuide = async () => {
    if (!bricks || !bricks.length) {
      setError("먼저 브릭 데이터가 필요합니다.");
      return;
    }

    setLoadingGuide(true);
    setError(null);

    try {
      const meta = {
        title: designTitle,
        width: mosaicWidth,
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
          guide={analysisGuide}
        />
      </section>

      {/* STEP 02 · 브릭 조립 가이드 */}
      <section className="panel analyze-guide-section">
        <p className="section-eyebrow">STEP 02 · 브릭 조립 가이드</p>
        <h2 className="section-title">
          샘플 브릭으로 조립 가이드를 만들어봐요
        </h2>
        <p className="section-desc">
          지금은 샘플 브릭 데이터로만 가이드를 생성합니다. 나중에는 위에서 분석된
          브릭 데이터를 그대로 연결할 예정입니다.
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
