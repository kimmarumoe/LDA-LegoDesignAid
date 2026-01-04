// frontend/src/pages/Analyze.jsx
import { useEffect, useRef, useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide } from "../api/guideClient";
import { BRICK_TYPES } from "../types/legoGuide";
import "./Analyze.css";

const DEFAULT_OPTIONS = {
  gridSize: "16x16", // "16x16" | "32x32" | "48x48"
  colorLimit: 16, // 0 | 8 | 16 | 24 (0 = 제한 없음)
};

const GRID_PRESETS = new Set(["16x16", "32x32", "48x48"]);
const COLOR_LIMIT_PRESETS = new Set([0, 8, 16, 24]);

// 자동 모드 프리셋(원하면 여기만 바꾸면 됨)
const AUTO_BRICK_PRESET = ["1x1", "1x2", "1x3", "2x2", "2x3"];

function toInputValue(input) {
  return typeof input === "object" && input?.target ? input.target.value : input;
}

function toSafeGridSize(input) {
  const raw = toInputValue(input);
  const v = String(raw ?? "").replace(/\s+/g, "").toLowerCase();
  return GRID_PRESETS.has(v) ? v : "16x16";
}

function toSafeColorLimit(input) {
  const raw = toInputValue(input);
  const n = Number(raw);
  if (!Number.isFinite(n)) return 16;
  return COLOR_LIMIT_PRESETS.has(n) ? n : 16;
}

function toSafeBrickMode(input) {
  const raw = toInputValue(input);
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "auto" || v === "manual") return v;
  // 레거시 오타가 들어와도 manual로 보정
  if (v === "menual") return "manual";
  return "manual";
}

// BRICK_TYPES 기준으로 필터링 + 1x1 항상 포함
function normalizeBrickTypes(list) {
  const allowed = new Set(BRICK_TYPES);
  const input = Array.isArray(list) ? list : [];

  const filtered = input
    .map((x) => String(x).trim())
    .filter(Boolean)
    .filter((x) => allowed.has(x));

  const unique = Array.from(new Set(filtered));
  if (!unique.includes("1x1")) unique.unshift("1x1");
  return unique;
}

export default function Analyze() {
  // 분석 요청 abort + 최신 요청만 반영하기 위한 ref
  const analyzeAbortRef = useRef(null);
  const requestSeqRef = useRef(0);

  // 입력 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useSample, setUseSample] = useState(true);

  // 옵션 상태
  const [analysisOptions, setAnalysisOptions] = useState(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 브릭 옵션(H-3)
  const [brickMode, setBrickMode] = useState("manual"); // "auto" | "manual"
  const [brickAllowed, setBrickAllowed] = useState(["1x1"]); // manual 모드에서 사용

  // STEP01 결과
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

  // STEP02 결과(steps)
  const [availableSteps, setAvailableSteps] = useState([]);
  const [guideSteps, setGuideSteps] = useState([]);
  const [guideStatus, setGuideStatus] = useState("idle"); // idle | running | done | error
  const [guideError, setGuideError] = useState("");

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
          return "서버 응답 형식이 올바르지 않습니다. 서버 로그를 확인해주세요.";
        case "ABORTED":
          // 사용자 의도 중단은 보통 에러로 보여주지 않는 편이 UX가 좋음
          return "";
        default:
          return err.message || "알 수 없는 오류가 발생했습니다.";
      }
    }

    if (err instanceof Error) return err.message || "오류가 발생했습니다.";
    return "분석 중 오류가 발생했어요. 서버 실행/주소(VITE_API_BASE_URL)와 CORS 설정을 확인해주세요.";
  }

  function resetAllResults() {
    setAnalysisResult(null);
    setAnalysisStatus("idle");
    setAnalysisError("");

    setAvailableSteps([]);
    setGuideSteps([]);
    setGuideStatus("idle");
    setGuideError("");
  }

  function abortAnalyze() {
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
      analyzeAbortRef.current = null;
    }
    // 이전 요청이 늦게 도착해도 반영되지 않도록 시퀀스를 올림
    requestSeqRef.current += 1;
  }

  function extractAnalysisOnly(guidePayload) {
    const { steps, ...analysisOnly } = guidePayload ?? {};
    return analysisOnly;
  }

  function normalizeSteps(steps) {
    return Array.isArray(steps) ? steps : [];
  }

  function getBrickTypesToSend() {
    if (brickMode === "auto") return normalizeBrickTypes(AUTO_BRICK_PRESET);
    return normalizeBrickTypes(brickAllowed);
  }

  // 컴포넌트 언마운트 시 진행중 요청 중단
  useEffect(() => {
    return () => abortAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageSelect = (file, url) => {
    abortAnalyze();
    setSelectedFile(file);
    setPreviewUrl(url);
    resetAllResults();
  };

  const handleToggleSample = (next) => {
    abortAnalyze();
    setUseSample(next);
    resetAllResults();
  };

  const handleToggleOptions = () => {
    setIsOptionsOpen((prev) => !prev);
  };

  const handleChangeGridSize = (nextGridSize) => {
    abortAnalyze();
    const safe = toSafeGridSize(nextGridSize);
    setAnalysisOptions((prev) => ({ ...prev, gridSize: safe }));
    resetAllResults();
  };

  const handleChangeColorLimit = (nextLimit) => {
    abortAnalyze();
    const safe = toSafeColorLimit(nextLimit);
    setAnalysisOptions((prev) => ({ ...prev, colorLimit: safe }));
    resetAllResults();
  };

  const handleChangeBrickMode = (nextMode) => {
    abortAnalyze();
    const safe = toSafeBrickMode(nextMode);
    setBrickMode(safe);
    resetAllResults();
  };

  const handleChangeBrickAllowed = (nextAllowed) => {
    abortAnalyze();
    setBrickAllowed(normalizeBrickTypes(nextAllowed));
    resetAllResults();
  };

  const handleAnalyze = async () => {
    // 새 분석 시작 전 상태 정리
    setAnalysisError("");
    setGuideError("");
    setGuideSteps([]);
    setGuideStatus("idle");

    if (!useSample && !selectedFile) {
      setAnalysisStatus("error");
      setAnalysisError("실데이터 모드에서는 이미지를 업로드해야 분석할 수 있어요.");
      return;
    }

    // 이전 요청 중단 + 최신 요청 번호 확보
    abortAnalyze();
    const seq = requestSeqRef.current;

    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setAnalysisStatus("running");

    try {
      // legoGuide.ts 계약을 기본으로 구성 (guideClient에서 레거시 키도 흡수 가능)
      const optionsPayload = {
        gridSize: analysisOptions.gridSize,
        colorLimit: analysisOptions.colorLimit, // 0(제한 없음) 포함
        brickMode, // auto | manual
        brickTypes: getBrickTypesToSend(),
      };

      const payload = useSample
        ? SAMPLE_GUIDE
        : await analyzeGuide(selectedFile, optionsPayload, controller.signal);

      // 최신 요청이 아니면 반영하지 않음
      if (seq !== requestSeqRef.current) return;

      const analysisOnly = extractAnalysisOnly(payload);
      const steps = normalizeSteps(payload?.steps);

      setAnalysisResult(analysisOnly);
      setAvailableSteps(steps);
      setAnalysisStatus("done");
    } catch (err) {
      if (seq !== requestSeqRef.current) return;

      const msg = normalizeClientError(err);
      // ABORTED는 보통 에러 표시하지 않음
      if (!msg) {
        setAnalysisStatus("idle");
        setAnalysisError("");
        return;
      }

      console.error(err);
      setAnalysisStatus("error");
      setAnalysisError(msg);
    } finally {
      // 최신 요청일 때만 ref 정리
      if (seq === requestSeqRef.current) {
        analyzeAbortRef.current = null;
      }
    }
  };

  const handleGenerateGuide = async () => {
    setGuideError("");

    if (analysisStatus !== "done") {
      setGuideStatus("error");
      setGuideError("먼저 STEP 01 분석을 완료해주세요.");
      return;
    }

    if (guideStatus === "done" && guideSteps.length > 0) return;

    setGuideStatus("running");

    try {
      // 현재는 STEP01 payload에 steps가 있는 샘플/임시 구조만 지원
      // 추후 /api/guide/steps 연동 시 여기만 교체하면 됨
      if (!availableSteps || availableSteps.length === 0) {
        setGuideStatus("error");
        setGuideError(
          "현재 steps 데이터가 없어요.\n샘플 모드를 사용하거나, steps 생성 API(/api/guide/steps) 연동을 추가해주세요."
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

  const handleReset = () => {
    abortAnalyze();
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsOptionsOpen(false);
    resetAllResults();
  };

  return (
    <main className="analyze-page">
      <div className="analyze-container">
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
          onReset={handleReset}
          isOptionsOpen={isOptionsOpen}
          onToggleOptions={handleToggleOptions}
          gridSize={analysisOptions.gridSize}
          colorLimit={analysisOptions.colorLimit}
          onChangeGridSize={handleChangeGridSize}
          onChangeColorLimit={handleChangeColorLimit}
          brickMode={brickMode}
          brickAllowed={brickAllowed}
          onChangeBrickMode={handleChangeBrickMode}
          onChangeBrickAllowed={handleChangeBrickAllowed}
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
      </div>
    </main>
  );
}
