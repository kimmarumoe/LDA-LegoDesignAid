// frontend/src/pages/Analyze.jsx

import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide } from "../api/guideClient";
import "./Analyze.css";

/**
 * Analyze 페이지
 * - STEP 01: 분석하기 → 요약/팔레트 표시
 * - STEP 02: 조립 가이드 생성 클릭 → 단계별 조립 가이드 표시
 */
export default function Analyze() {
  // 1) 이미지 관련 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 2) 분석 결과 / 상태
  const [guide, setGuide] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [errorMessage, setErrorMessage] = useState("");

  // 3) 샘플 모드
  const [useSample, setUseSample] = useState(true);

  // ✅ STEP 02에서만 단계별 가이드를 보여주기 위한 상태
  const [showAssemblyGuide, setShowAssemblyGuide] = useState(false);

  /** 공통 초기화(상태 불일치 방지) */
  const resetResult = () => {
    setGuide(null);
    setAnalysisStatus("idle");
    setErrorMessage("");
    setShowAssemblyGuide(false);
  };

  /** 이미지 선택 시 */
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    resetResult(); // ✅ 파일 바뀌면 결과/STEP02 표시 상태도 함께 초기화
  };

  /** "분석하기" 버튼 클릭 */
  const handleAnalyze = async () => {
    // ✅ 재분석 시 STEP02는 다시 숨김
    setShowAssemblyGuide(false);

    // 1) 샘플 모드: 파일 없어도 샘플 결과 표시
    if (useSample) {
      setGuide(SAMPLE_GUIDE);
      setAnalysisStatus("done");
      setErrorMessage("");
      return;
    }

    // 2) 실제 API 모드: 파일 필수
    if (!selectedFile) {
      setErrorMessage("먼저 이미지를 선택해 주세요.");
      setAnalysisStatus("error");
      return;
    }

    try {
      setAnalysisStatus("running");
      setErrorMessage("");

      const result = await analyzeGuide(selectedFile);
      setGuide(result);
      setAnalysisStatus("done");
    } catch (err) {
      console.error("가이드 생성 실패:", err);
      setAnalysisStatus("error");
      setErrorMessage(
        err?.message ?? "가이드 생성 중 알 수 없는 오류가 발생했습니다."
      );
    }
  };

  const canOpenStep2 = analysisStatus === "done" && !!guide;
  const hasSteps = Array.isArray(guide?.groups) && guide.groups.length > 0;

  return (
    <main className="app-shell">
      <div className="analyze-page">
        {/* 상단 인트로 카드 */}
        <section className="panel analyze-intro">
          <p className="analyze-step-label">STEP 01 · 이미지 분석</p>

          <div className="analyze-intro-header">
            <h1 className="analyze-intro-title">
              이미지를 올려 브릭 분석을 준비해요
            </h1>

            <span className="badge-sample-mode">
              {useSample ? "샘플 데이터 모드" : "실제 API 모드"}
            </span>
          </div>

          <p className="analyze-intro-desc">
            LDA가 업로드한 이미지를 기반으로 브릭의 색상·형태·구성을 나누고,
            조립 가이드 초안을 만들어 줄 예정입니다.
            <br />
            {useSample
              ? "다만, 지금은 UI 구조를 먼저 확인하기 위해 샘플 결과만 보여주는 단계입니다."
              : "이제는 실제 API를 호출해 분석 결과를 받아옵니다."}
          </p>
        </section>

        {/* 가운데 2컬럼 레이아웃 (UploadPanel + BrickGuidePanel) */}
        <section className="analyze-layout">
          <UploadPanel
            onImageSelect={handleImageSelect}
            onAnalyze={handleAnalyze}
            previewUrl={previewUrl}
            analysisStatus={analysisStatus}
            useSample={useSample}
            onToggleSample={(next) => {
              setUseSample(next);
              resetResult(); // ✅ 모드 변경 시 결과/STEP02 표시도 초기화
            }}
          />

          <BrickGuidePanel
            guide={guide}
            analysisStatus={analysisStatus}
            errorMessage={errorMessage}
            useSample={useSample}
            selectedFile={selectedFile} // ✅ 파일명 불일치 해결 포인트
          />
        </section>

        {/* ✅ STEP 02: 버튼 클릭 후에만 단계별 조립 가이드 표시 */}
        <section className="panel analyze-sample-guide">
          <p className="analyze-step-label">STEP 02 · 브릭 조립 가이드</p>

          <h2 className="analyze-sample-title">조립 가이드를 생성해봐요</h2>
          <p className="analyze-sample-desc">
            1단계에서 분석된 결과를 바탕으로, 단계별 조립 가이드를 표시합니다.
          </p>

          <button
            type="button"
            className="primary-button"
            disabled={!canOpenStep2}
            onClick={() => {
              // 토글 방식(원하면 show만 true로 바꿔도 됨)
              setShowAssemblyGuide((prev) => !prev);
            }}
          >
            {showAssemblyGuide ? "조립 가이드 숨기기" : "조립 가이드 생성"}
          </button>

          {!canOpenStep2 && (
            <div className="result-placeholder" style={{ marginTop: 12 }}>
              먼저 STEP 01에서 <strong>“분석하기”</strong>를 실행해 주세요.
            </div>
          )}

          {canOpenStep2 && showAssemblyGuide && (
            <section className="result-section" style={{ marginTop: 16 }}>
              <h3 className="result-section-title">단계별 조립 가이드</h3>

              {!hasSteps ? (
                <div className="result-placeholder">
                  단계별 가이드 데이터가 아직 없습니다.
                </div>
              ) : (
                <div className="result-steps">
                  {guide.groups.map((step) => (
                    <div key={step.id ?? step.title} className="result-step">
                      <div className="result-step-num">
                        {typeof step.id === "number" ? step.id : "•"}
                      </div>
                      <div className="result-step-body">
                        <div className="result-step-title">{step.title}</div>
                        {step.description && (
                          <div className="result-step-hint">
                            {step.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
