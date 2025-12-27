import { useEffect, useRef, useState } from "react";
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
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

  // 4) 가이드 생성 상태 (STEP 02)
  const [availableSteps, setAvailableSteps] = useState([]); // 분석 payload에서 steps를 캐시로만 보관
  const [guideSteps, setGuideSteps] = useState([]); // 실제 렌더링할 steps
  const [guideStatus, setGuideStatus] = useState("idle"); // idle | running | done | error
  const [guideError, setGuideError] = useState("");

  // ------------------------------------------------------------
  // P0: previewUrl(ObjectURL) 메모리 누수 방지
  // ------------------------------------------------------------
  const prevPreviewUrlRef = useRef(null);

  useEffect(() => {
    // previewUrl이 바뀌면 이전 URL을 해제
    const prev = prevPreviewUrlRef.current;
    if (prev && prev !== previewUrl) {
      URL.revokeObjectURL(prev);
    }
    prevPreviewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    // 언마운트 시 마지막 URL 해제
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
        prevPreviewUrlRef.current = null;
      }
    };
  }, []);

  // ------------------------------------------------------------
  // P0: Error Normalizer (에러 UX 표준화)
  // ------------------------------------------------------------
  function isNormalizedApiError(err) {
    return (
      err &&
      typeof err === "object" &&
      typeof err.kind === "string" &&
      typeof err.message === "string"
    );
  }

  function normalizeClientError(err) {
    if (isNormalizedApiError(err)) {
      switch (err.kind) {
        case "TIMEOUT":
          return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
        case "NETWORK":
          return "네트워크 오류가 발생했습니다. 서버 주소(VITE_API_BASE_URL)와 CORS, 서버 실행 상태를 확인해주세요.";
        case "HTTP_4XX":
          return err.message || "요청이 올바르지 않습니다. 입력/파일을 확인해주세요.";
        case "HTTP_5XX":
          return err.message || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        case "INVALID_RESPONSE":
          return "서버 응답 형식이 올바르지 않습니다. (JSON 파싱 실패) 서버 로그를 확인해주세요.";
        default:
          return err.message || "알 수 없는 오류가 발생했습니다.";
      }
    }

    if (err instanceof Error) {
      return err.message || "오류가 발생했습니다.";
    }

    return "분석 중 오류가 발생했어요. 서버 실행/주소(VITE_API_BASE_URL)와 CORS 설정을 확인해주세요.";
  }

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
    // steps는 STEP01에서 절대 노출하면 안 되므로 분리한다.
    if (!guidePayload || typeof guidePayload !== "object") return null;
    const { steps, ...analysisOnly } = guidePayload;
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

    // ✅ 샘플 모드 ON이면 파일/프리뷰도 정리해서 혼선 방지
    if (next === true) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    // ✅ 새 분석 시작: 이전 결과가 로딩 중 남아있지 않도록 초기화
    setAnalysisError("");
    setGuideError("");

    setAnalysisResult(null);
    setAvailableSteps([]);
    setGuideSteps([]);
    setGuideStatus("idle");
    setGuideError("");

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
      setAnalysisError(normalizeClientError(err));
    }
  };

  const handleGenerateGuide = async () => {
    setGuideError("");

    if (analysisStatus !== "done") {
      setGuideStatus("error");
      setGuideError("먼저 STEP 01 분석을 완료해주세요.");
      return;
    }

    // 이미 생성된 경우 재클릭 방지
    if (guideStatus === "done" && guideSteps.length > 0) return;

    setGuideStatus("running");

    try {
      // 현재 단계에서는 “분석 payload에 포함된 steps”를 사용한다.
      // (추후 steps 전용 API가 생기면 여기만 교체하면 됨 - OCP)
      if (!availableSteps || availableSteps.length === 0) {
        setGuideStatus("error");
        setGuideError(
          "현재 steps 데이터가 없어요. (백엔드가 steps를 내려주지 않는 경우)\n샘플 모드를 사용하거나, steps 생성 API 연동을 추가해주세요."
        );
        return;
      }

      setGuideSteps(availableSteps);
      setGuideStatus("done");
    } catch (err) {
      console.error(err);
      setGuideStatus("error");
      setGuideError(normalizeClientError(err));
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
