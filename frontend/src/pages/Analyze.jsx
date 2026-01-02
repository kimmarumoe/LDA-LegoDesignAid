import { useRef, useState } from "react";
import UploadPanel from "../components/UploadPanel.jsx";
import BrickGuidePanel from "../components/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide } from "../api/guideClient";
import "./Analyze.css";

const DEFAULT_OPTIONS = {
  gridSize: "16x16", // "16x16" | "32x32" | "48x48"
  colorLimit: 16, // 0 | 8 | 16 | 24 (0 = 제한 없음)
};

const GRID_PRESETS = new Set(["16x16", "32x32", "48x48"]);
const COLOR_LIMIT_PRESETS = new Set([0, 8, 16, 24]);

// 자동 모드 프리셋(원하면 여기만 바꾸면 됨)
const AUTO_BRICK_PRESET = ["1x1", "1x2", "1x3", "2x2", "2x3"];

function toSafeGridSize(input) {
  const raw =
    typeof input === "object" && input?.target ? input.target.value : input;

  const v = String(raw ?? "")
    .replace(/\s+/g, "")
    .toLowerCase();

  return GRID_PRESETS.has(v) ? v : "16x16";
}

function toSafeColorLimit(input) {
  const raw =
    typeof input === "object" && input?.target ? input.target.value : input;

  const n = Number(raw);
  if (!Number.isFinite(n)) return 16;
  return COLOR_LIMIT_PRESETS.has(n) ? n : 16;
}

function parseGridSize(gridSize) {
  const [w, h] = String(gridSize)
    .split("x")
    .map((v) => Number(v));
  const width = Number.isFinite(w) ? w : 16;
  const height = Number.isFinite(h) ? h : 16;
  return { width, height };
}

// (현재는 미사용이지만 유지)
function buildAnalyzeOptionsPayload(options) {
  const { width, height } = parseGridSize(options?.gridSize);
  return {
    grid: { mode: "preset", width, height },
    colorLimit: options?.colorLimit ?? 16,
  };
}

// 브릭 타입 최소 보장(1x1 항상 포함)
function ensureBrickTypes(list) {
  const set = new Set(Array.isArray(list) ? list : []);
  set.add("1x1");
  return Array.from(set);
}

export default function Analyze() {
  const analyzeAbortRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [useSample, setUseSample] = useState(true);

  const [analysisOptions, setAnalysisOptions] = useState(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 브릭 옵션(H-3)
  const [brickMode, setBrickMode] = useState("manual"); // "auto" | "manual"
  const [brickAllowed, setBrickAllowed] = useState(["1x1"]); // manual 모드에서 사용

  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

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
          return "요청이 취소되었습니다.";
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

  function extractAnalysisOnly(guidePayload) {
    const { steps, ...analysisOnly } = guidePayload ?? {};
    return analysisOnly;
  }

  function normalizeSteps(steps) {
    if (!Array.isArray(steps)) return [];
    return steps;
  }

  function getBrickTypesToSend() {
    if (brickMode === "auto") return ensureBrickTypes(AUTO_BRICK_PRESET);
    return ensureBrickTypes(brickAllowed);
  }

  const handleImageSelect = (file, url) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    resetAllResults();
  };

  const handleToggleSample = (next) => {
    setUseSample(next);
    resetAllResults();
  };

  const handleToggleOptions = () => {
    setIsOptionsOpen((prev) => !prev);
  };

  const handleChangeGridSize = (nextGridSize) => {
    const safe = toSafeGridSize(nextGridSize);
    setAnalysisOptions((prev) => ({ ...prev, gridSize: safe }));
    resetAllResults();
  };

  const handleChangeColorLimit = (nextLimit) => {
    const safe = toSafeColorLimit(nextLimit);
    setAnalysisOptions((prev) => ({ ...prev, colorLimit: safe }));
    resetAllResults();
  };

  // 브릭 옵션 변경 핸들러(H-3)
  const handleChangeBrickMode = (nextMode) => {
    setBrickMode(nextMode);
    resetAllResults();
  };

  const handleChangeBrickAllowed = (nextAllowed) => {
    setBrickAllowed(ensureBrickTypes(nextAllowed));
    resetAllResults();
  };

  const handleAnalyze = async () => {
    setAnalysisError("");
    setGuideError("");
    setGuideSteps([]);
    setGuideStatus("idle");

    if (!useSample && !selectedFile) {
      setAnalysisStatus("error");
      setAnalysisError("실데이터 모드에서는 이미지를 업로드해야 분석할 수 있어요.");
      return;
    }

    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
      analyzeAbortRef.current = null;
    }

    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setAnalysisStatus("running");

    try {
      const optionsPayload = {
        gridSize: analysisOptions.gridSize,
        maxColors: analysisOptions.colorLimit, // 0(제한 없음)도 그대로 전송
        brickTypes: getBrickTypesToSend(),
      };

      const payload = useSample
        ? SAMPLE_GUIDE
        : await analyzeGuide(selectedFile, optionsPayload, controller.signal);

      const analysisOnly = extractAnalysisOnly(payload);
      const steps = normalizeSteps(payload?.steps);

      setAnalysisResult(analysisOnly);
      setAvailableSteps(steps);

      setAnalysisStatus("done");
    } catch (err) {
      console.error(err);
      setAnalysisStatus("error");
      setAnalysisError(normalizeClientError(err));
    } finally {
      analyzeAbortRef.current = null;
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
      if (!availableSteps || availableSteps.length === 0) {
        setGuideStatus("error");
        setGuideError(
          "현재 steps 데이터가 없어요.\n샘플 모드를 사용하거나, steps 생성 API 연동을 추가해주세요."
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
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
      analyzeAbortRef.current = null;
    }

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
