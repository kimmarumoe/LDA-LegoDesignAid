// frontend/src/pages/Analyze.jsx

import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";

// ✅ createGuide → analyzeGuide로 변경
import { analyzeGuide } from "../api/guideClient.ts";
import "./Analyze.css";

/**
 * Analyze 페이지
 * - 상태는 여기서만 관리(SSOT)
 * - UploadPanel / BrickGuidePanel 은 UI 표시 중심(SRP)
 */
export default function Analyze() {
  // 1) 이미지 관련 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 2) 분석 결과 / 상태
  const [guide, setGuide] = useState(null); // 처음엔 아무 결과 없음
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | analyzed | done | error
  const [errorMessage, setErrorMessage] = useState("");

  //  샘플 모드 토글
  const [useSample, setUseSample] = useState(true);

  //  단계별 조립 가이드 표시 여부 (STEP 02에서 노출)
  const [showGuideSteps, setShowGuideSteps] = useState(false);

  /** 이미지 선택 시 */
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);

    // 새 이미지 선택하면 상태 초기화
    setAnalysisStatus("idle");
    setErrorMessage("");
    setGuide(null);
    setShowGuideSteps(false);
  };

  /** 샘플 모드 토글 */
  const handleToggleSample = (nextUseSample) => {
    setUseSample(nextUseSample);

    // 모드 전환 시 "결과 잔상" 제거
    setAnalysisStatus("idle");
    setErrorMessage("");
    setGuide(null);
    setShowGuideSteps(false);
  };

  /** "분석하기" 버튼 클릭 시 */
  const handleAnalyze = async () => {
    // 분석을 다시 돌리면 STEP 02의 가이드도 다시 숨김
    setShowGuideSteps(false);

    // ✅ 1) 샘플 모드일 때: 파일 없어도 SAMPLE_GUIDE로 바로 보여주기
    if (useSample) {
      setGuide(SAMPLE_GUIDE);
      setAnalysisStatus("analyzed"); // ✅ 분석 결과 준비됨(요약/팔레트)
      setErrorMessage("");
      return;
    }

    // ✅ 2) 실제 API 모드: 파일 필수
    if (!selectedFile) {
      setErrorMessage("먼저 이미지를 선택해 주세요.");
      setAnalysisStatus("error");
      return;
    }

    try {
      setAnalysisStatus("running");
      setErrorMessage("");

      // ✅ 핵심: 이미지 파일을 analyzeGuide로 업로드
      const result = await analyzeGuide(selectedFile);
      setGuide(result);
      setAnalysisStatus("analyzed"); // ✅ 분석 결과 준비됨(요약/팔레트)
    } catch (err) {
      console.error("가이드 생성 실패:", err);
      setAnalysisStatus("error");
      setErrorMessage(
        err?.message ?? "가이드 생성 중 알 수 없는 오류가 발생했습니다."
      );
    }
  };

  /** STEP 02 - "조립 가이드 생성" 버튼 클릭 시 */
  const handleCreateGuide = () => {
    if (!guide) return;

    setShowGuideSteps(true);
    setAnalysisStatus("done");

    // 클릭 후 사용자가 바로 확인할 수 있도록 스크롤(선택 사항)
    requestAnimationFrame(() => {
      const el = document.getElementById("step2-guide-steps");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const canCreateGuide = Boolean(guide) && analysisStatus === "analyzed";

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

        {/* 2컬럼 레이아웃 */}
        <section className="analyze-layout">
          <UploadPanel
            onImageSelect={handleImageSelect}
            onAnalyze={handleAnalyze}
            previewUrl={previewUrl}
            selectedFile={selectedFile}
            analysisStatus={analysisStatus}
            useSample={useSample}
            onToggleSample={handleToggleSample}
          />

          {/* ✅ 2번 패널은 “브릭 분석 결과(요약/팔레트)”까지만 */}
          <BrickGuidePanel
            guide={guide}
            analysisStatus={analysisStatus}
            errorMessage={errorMessage}
            useSample={useSample}
            selectedFile={selectedFile}
          />
        </section>

        {/* STEP 02: 조립 가이드 생성 */}
        <section className="panel analyze-sample-guide">
          <p className="analyze-step-label">STEP 02 · 브릭 조립 가이드</p>

          <h2 className="analyze-sample-title">조립 가이드를 생성해봐요</h2>

          <p className="analyze-sample-desc">
            1단계에서 분석된 결과를 바탕으로, 단계별 조립 가이드를 생성(표시)합니다.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleCreateGuide}
            disabled={!canCreateGuide}
            title={
              canCreateGuide
                ? "단계별 조립 가이드를 표시합니다."
                : "먼저 '분석하기'를 실행해 주세요."
            }
          >
            조립 가이드 생성
          </button>

          {/* ✅ 단계별 조립 가이드는 여기(STEP 02)에서만 표시 */}
          <div id="step2-guide-steps" style={{ marginTop: 16 }}>
            {!guide && (
              <div className="result-placeholder">
                <p className="result-placeholder-text">
                  먼저 1단계에서 “분석하기”를 실행해 주세요.
                </p>
              </div>
            )}

            {guide && !showGuideSteps && (
              <div className="result-placeholder">
                <p className="result-placeholder-text">
                  “조립 가이드 생성” 버튼을 누르면 단계별 조립 가이드가 표시됩니다.
                </p>
              </div>
            )}

            {guide && showGuideSteps && (guide.groups?.length ?? 0) === 0 && (
              <div className="result-placeholder">
                <p className="result-placeholder-text">
                  단계별 조립 가이드 데이터가 없습니다.
                </p>
              </div>
            )}

            {guide && showGuideSteps && (guide.groups?.length ?? 0) > 0 && (
              <section className="result-section">
                <h3 className="result-section-title">단계별 조립 가이드</h3>
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
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
