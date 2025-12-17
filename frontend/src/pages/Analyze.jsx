// frontend/src/pages/Analyze.jsx

import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";

// ✅ createGuide → analyzeGuide로 변경
import { analyzeGuide } from "../api/guideClient";

import "./Analyze.css";

/**
 * Analyze 페이지
 * - 이미지 업로드 + 브릭 분석 & 조립 가이드 담당
 * - 상태는 여기서 한 번에 관리하고
 *   UploadPanel / BrickGuidePanel 은 UI만 담당하도록 분리
 */
export default function Analyze() {
  // 1) 이미지 관련 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 2) 분석 결과 / 상태
  const [guide, setGuide] = useState(null); // 처음엔 아무 결과 없음
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [errorMessage, setErrorMessage] = useState("");

  //  샘플 모드 토글
  const [useSample, setUseSample] = useState(true);

  /** 이미지 선택 시 */
  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);

    // 새 이미지 선택하면 상태 초기화
    setAnalysisStatus("idle");
    setErrorMessage("");
    setGuide(null);
  };

  /** "분석하기" 버튼 클릭 시 */
  const handleAnalyze = async () => {
    // ✅ 1) 샘플 모드일 때: 파일 없어도 SAMPLE_GUIDE로 바로 보여주기
    if (useSample) {
      setGuide(SAMPLE_GUIDE);
      setAnalysisStatus("done");
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
      setAnalysisStatus("done");
    } catch (err) {
      console.error("가이드 생성 실패:", err);
      setAnalysisStatus("error");
      setErrorMessage(
        err?.message ?? "가이드 생성 중 알 수 없는 오류가 발생했습니다."
      );
    }
  };

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

            {/* ✅ 배지도 샘플/실제 모드에 맞춰 표시하면 더 명확 */}
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

        {/*가운데 2컬럼 레이아웃 (UploadPanel + BrickGuidePanel) */}
        <section className="analyze-layout">
          <UploadPanel
            onImageSelect={handleImageSelect}
            onAnalyze={handleAnalyze}
            previewUrl={previewUrl}
            analysisStatus={analysisStatus}
            useSample={useSample}
            onToggleSample={setUseSample}
          />

          <BrickGuidePanel
            guide={guide}
            previewUrl={previewUrl}
            analysisStatus={analysisStatus}
            errorMessage={errorMessage}
            useSample={useSample}
          />
        </section>

        {/* 샘플 가이드 카드 */}
        <section className="panel analyze-sample-guide">
          <p className="analyze-step-label">STEP 02 · 브릭 조립 가이드</p>

          <h2 className="analyze-sample-title">
            샘플 브릭으로 조립 가이드를 만들어봐요
          </h2>

          <p className="analyze-sample-desc">
            지금은 샘플 브릭 데이터로만 가이드를 생성합니다.
            나중에는 위에서 분석된 브릭 데이터를 그대로 연결할 예정입니다.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              alert("지금은 샘플 단계라 동작하지 않는 버튼입니다 🙂");
            }}
          >
            조립 가이드 생성
          </button>
        </section>
      </div>
    </main>
  );
}
