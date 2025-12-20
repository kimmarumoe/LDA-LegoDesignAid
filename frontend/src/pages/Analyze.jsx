import { useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide } from "../api/guideClient";
import "./Analyze.css";

/**
 * Analyze 페이지 (P0 안정화 버전)
 * - STEP 01: 분석하기 → 요약/팔레트만 표시
 * - STEP 02: 조립 가이드 생성 → 버튼 클릭 시 steps 표시
 * - 샘플/실데이터 토글:
 *   - 샘플 모드: 파일 없이도 체험 가능
 *   - 실데이터 모드: 파일 업로드 필수 + API 호출
 */
export default function Analyze() {
  // 1) 이미지 관련 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 2) 샘플 모드
  const [useSample, setUseSample] = useState(true);

  // 3) 분석 결과 상태 (STEP 01)
  const [analysisResult, setAnalysisResult] = useState(null); // 요약/팔레트/브릭 등
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

  // 4) 가이드 생성 상태 (STEP 02)
  const [availableSteps, setAvailableSteps] = useState([]); // 분석 결과에서 steps가 오면 캐시로만 보관
  const [guideSteps, setGuideSteps] = useState([]); // 실제 렌더링할 steps
  const [guideStatus, setGuideStatus] = useState("idle"); // idle | running | done | error
  const [guideError, setGuideError] = useState("");

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function resetAllResults() {
    setAnalysisResult(null);
    setAnalysisStatus("idle");
    setAnalysisError("");

    setAvailableSteps([]);
    setGuideSteps([]);
    setGuideStatus("idle");
    setGuideError("");
  }

  function extractAnalysisOnly(guidePayload) {
    // steps는 화면에 바로 노출하면 안 되므로 분리한다.
    const { steps, ...analysisOnly } = guidePayload ?? {};
    return analysisOnly;
  }

  function normalizeSteps(steps) {
    if (!Array.isArray(steps)) return [];
    return steps;
  }

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleImageSelect = (file, url) => {
    // 새 이미지 선택 시: 이전 결과/가이드 전부 리셋 (꼬임 방지)
    setSelectedFile(file);
    setPreviewUrl(url);
    resetAllResults();
  };

  const handleToggleSample = (next) => {
    // 모드 전환 시 결과 리셋: “샘플 결과가 실데이터에 남아있는” 문제 방지
    setUseSample(next);
    resetAllResults();
  };

  const handleAnalyze = async () => {
    setAnalysisError("");
    setGuideError("");
    setGuideSteps([]);
    setGuideStatus("idle"); // 분석 새로 시작하면 가이드 생성 상태도 초기화

    // 실데이터 모드인데 파일이 없으면 막기
    if (!useSample && !selectedFile) {
      setAnalysisStatus("error");
      setAnalysisError("실데이터 모드에서는 이미지를 업로드해야 분석할 수 있어요.");
      return;
    }

    setAnalysisStatus("running");

    try {
      const payload = useSample ? SAMPLE_GUIDE : await analyzeGuide(selectedFile);

      const analysisOnly = extractAnalysisOnly(payload);
      const steps = normalizeSteps(payload?.steps);

      setAnalysisResult(analysisOnly);
      setAvailableSteps(steps);

      setAnalysisStatus("done");
    } catch (err) {
      console.error(err);
      setAnalysisStatus("error");
      setAnalysisError(
        "분석 중 오류가 발생했어요. 서버 실행/주소(VITE_API_BASE_URL)와 CORS 설정을 확인해주세요."
      );
    }
  };

  const handleGenerateGuide = async () => {
    setGuideError("");

    if (analysisStatus !== "done") {
      setGuideStatus("error");
      setGuideError("먼저 STEP 01 분석을 완료해주세요.");
      return;
    }

    // 이미 생성된 경우 재클릭 방지/무의미한 상태 변경 방지
    if (guideStatus === "done" && guideSteps.length > 0) return;

    setGuideStatus("running");

    try {
      // 현재 단계에서는 “분석 payload에 포함된 steps”를 사용한다.
      // (추후 백엔드에 steps 전용 API가 생기면 여기만 교체하면 됨 - OCP)
      if (!availableSteps || availableSteps.length === 0) {
        setGuideStatus("error");
        setGuideError(
          "현재 steps 데이터가 없어요. (백엔드가 steps를 내려주지 않는 경우) 샘플 모드를 사용하거나, steps 생성 API 연동을 추가해주세요."
        );
        return;
      }

      setGuideSteps(availableSteps);
      setGuideStatus("done");
    } catch (err) {
      console.error(err);
      setGuideStatus("error");
      setGuideError("조립 가이드 생성 중 오류가 발생했어요.");
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <main className="analyze-page">
      <UploadPanel
        previewUrl={previewUrl}
        hasFile={!!selectedFile}
        fileName={selectedFile?.name ?? ""}
        useSample={useSample}
        onToggleSample={handleToggleSample}
        analysisStatus={analysisStatus}
        analysisError={analysisError}
        onImageSelect={handleImageSelect}
        onAnalyze={handleAnalyze}
      />

      <BrickGuidePanel
        analysisStatus={analysisStatus}
        analysisError={analysisError}
        analysisResult={analysisResult}
        guideStatus={guideStatus}
        guideError={guideError}
        guideSteps={guideSteps}
        onGenerateGuide={handleGenerateGuide}
      />
    </main>
  );
}
