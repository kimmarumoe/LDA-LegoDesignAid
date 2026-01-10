// frontend/src/pages/Analyze.jsx
import { useEffect, useRef, useState } from "react";
import UploadPanel from "../components/analyze/upload/UploadPanel.jsx";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide } from "../api/guideClient";
import { BRICK_TYPES } from "../types/legoGuide";
import "./Analyze.css";

const MIN_LOADING_MS = 250; // 200~350ms 추천(너무 길면 느려보임)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_OPTIONS = {
  gridSize: "16x16", // "16x16" | "32x32" | "48x48"
  colorLimit: 16, // 0 | 8 | 16 | 24 (0 = 제한 없음)
};

const GRID_PRESETS = new Set(["16x16", "32x32", "48x48"]);
const COLOR_LIMIT_PRESETS = new Set([0, 8, 16, 24]);

// 자동 모드에서 기본으로 사용할 브릭 종류(원하면 이 목록만 바꾸면 됨)
const AUTO_BRICK_PRESET = ["1x1", "1x2", "1x3", "2x2", "2x3"];

// 이벤트(e)로 들어오든 값(value)로 들어오든 동일하게 처리하기 위한 함수
function toInputValue(input) {
  return typeof input === "object" && input?.target ? input.target.value : input;
}

// 그리드 크기는 허용된 값만 유지하고, 그 외는 기본값으로 되돌림
function toSafeGridSize(input) {
  const raw = toInputValue(input);
  const v = String(raw ?? "").replace(/\s+/g, "").toLowerCase();
  return GRID_PRESETS.has(v) ? v : "16x16";
}

// 색상 제한도 허용된 값만 유지하고, 그 외는 기본값으로 되돌림
function toSafeColorLimit(input) {
  const raw = toInputValue(input);
  const n = Number(raw);
  if (!Number.isFinite(n)) return 16;
  return COLOR_LIMIT_PRESETS.has(n) ? n : 16;
}

// 벽돌 모드는 auto/manual만 허용하고, 오타는 manual로 보정
function toSafeBrickMode(input) {
  const raw = toInputValue(input);
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "auto" || v === "manual") return v;
  if (v === "menual") return "manual"; // 예전 오타 호환
  return "manual";
}

// BRICK_TYPES 기준으로만 남기고, 중복 제거 + "1x1"은 항상 포함
function normalizeBrickTypes(list) {
  const allowedList = Array.isArray(BRICK_TYPES)
    ? BRICK_TYPES.map((b) => (typeof b === "string" ? b : b?.value)).filter(Boolean)
    : [];

  const allowed = new Set(allowedList);

  const input = Array.isArray(list) ? list : [];
  const filtered = input
    .map((x) => String(x).trim())
    .filter(Boolean)
    .filter((x) => allowed.has(x));

  const unique = Array.from(new Set(filtered));
  if (!unique.includes("1x1")) unique.unshift("1x1");
  return unique;
}

/*
  분석 결과에 "요청할 때 사용한 옵션"을 함께 저장한다.

  이유:
  - 서버가 결과에 옵션 정보를 안 넣어주더라도
    화면에서 "내가 어떤 옵션으로 분석했는지" 항상 확인할 수 있다.
  - 나중에 오류가 나도, 어떤 옵션이었는지 바로 추적할 수 있다.
*/
function attachRequestOptionsToResult(analysisOnly, requestOptions) {
  const base = analysisOnly && typeof analysisOnly === "object" ? analysisOnly : {};

  const prevMeta = base.meta && typeof base.meta === "object" ? base.meta : {};

  // gridSize("16x16")에서 가로/세로 값을 대략 추론한다.
  // 서버가 가로/세로 값을 이미 주면 서버 값을 우선한다.
  const [wRaw, hRaw] = String(requestOptions?.gridSize ?? "16x16")
    .toLowerCase()
    .replace(/\s+/g, "")
    .split("x");

  const inferredW = Number.isFinite(Number(wRaw)) ? Number(wRaw) : undefined;
  const inferredH = Number.isFinite(Number(hRaw)) ? Number(hRaw) : undefined;

  return {
    ...base,
    meta: {
      ...prevMeta,

      // 서버가 주는 값이 있으면 그 값을 사용하고, 없으면 gridSize로 보조한다.
      gridWidth: prevMeta.gridWidth ?? prevMeta.width ?? inferredW,
      gridHeight: prevMeta.gridHeight ?? prevMeta.height ?? inferredH,

      // 요청 시 사용한 옵션을 결과에 저장한다.
      requestOptions: {
        gridSize: requestOptions?.gridSize,
        colorLimit: requestOptions?.colorLimit,
        brickMode: requestOptions?.brickMode,
        brickTypes: requestOptions?.brickTypes,
      },
    },
  };
}

export default function Analyze() {
  // 진행 중인 요청을 취소하기 위해 저장해두는 곳
  const analyzeAbortRef = useRef(null);

  // "가장 마지막 요청만 화면에 반영"하기 위한 번호
  const requestSeqRef = useRef(0);

  // 입력 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useSample, setUseSample] = useState(true);

  // 옵션 상태
  const [analysisOptions, setAnalysisOptions] = useState(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 벽돌 옵션
  const [brickMode, setBrickMode] = useState("manual"); // "auto" | "manual"
  const [brickAllowed, setBrickAllowed] = useState(["1x1"]); // manual 모드에서 사용

  // STEP 01 결과
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

  // STEP 02 결과(steps)
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
          return "네트워크 오류가 발생했습니다. 서버 주소(VITE_API_BASE_URL)와 서버 실행 상태를 확인해주세요.";
        case "HTTP_4XX":
          return err.message || "요청이 올바르지 않습니다. 입력/파일을 확인해주세요.";
        case "HTTP_5XX":
          return err.message || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        case "INVALID_RESPONSE":
          return "서버 응답 형식이 올바르지 않습니다. 서버 로그를 확인해주세요.";
        case "ABORTED":
          // 사용자가 옵션/파일을 바꾸면 기존 요청은 취소될 수 있다.
          // 이 경우는 오류 메시지를 보여주지 않는다.
          return "";
        default:
          return err.message || "알 수 없는 오류가 발생했습니다.";
      }
    }

    if (err instanceof Error) return err.message || "오류가 발생했습니다.";
    return "분석 중 오류가 발생했습니다. 서버 실행 상태를 확인해주세요.";
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
    // 이전 요청이 늦게 도착해도 반영되지 않게 번호를 올린다.
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

  // 화면을 벗어나면 진행 중 요청을 끊는다.
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
  const startedAt = Date.now();

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

  // 로딩 문구가 너무 빨리 사라지지 않게 최소 표시 시간을 보장
  const waitMinLoadingIfNeeded = async () => {
    const elapsed = Date.now() - startedAt;
    const remain = MIN_LOADING_MS - elapsed;
    if (remain > 0) {
      await sleep(remain);
    }
  };

  try {
    const optionsPayload = {
      gridSize: analysisOptions.gridSize,
      colorLimit: analysisOptions.colorLimit, // 0(제한 없음) 포함
      brickMode,
      brickTypes: getBrickTypesToSend(),
    };

    const payload = useSample
      ? SAMPLE_GUIDE
      : await analyzeGuide(selectedFile, optionsPayload, controller.signal);

    // 최신 요청이 아니면 반영하지 않음
    if (seq !== requestSeqRef.current) return;

    await waitMinLoadingIfNeeded();
    if (seq !== requestSeqRef.current) return;

    const analysisOnly = extractAnalysisOnly(payload);
    const steps = normalizeSteps(payload?.steps);

    setAnalysisResult(analysisOnly);
    setAvailableSteps(steps);
    setAnalysisStatus("done");
  } catch (err) {
    if (seq !== requestSeqRef.current) return;

    const msg = normalizeClientError(err);

    // 사용자가 옵션을 바꾸는 등 의도적으로 취소된 요청은 에러로 안 보여줌
    if (!msg) {
      setAnalysisStatus("idle");
      setAnalysisError("");
      return;
    }

    await waitMinLoadingIfNeeded();
    if (seq !== requestSeqRef.current) return;

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
  const startedAt = Date.now();

  // "생성중..."이 너무 빨리 사라지지 않게 최소 표시 시간을 보장
  const waitMinLoadingIfNeeded = async () => {
    const elapsed = Date.now() - startedAt;
    const remain = MIN_LOADING_MS - elapsed;
    if (remain > 0) await sleep(remain);
  };

  setGuideError("");

  // STEP 01이 완료되지 않았다면 STEP 02는 진행할 수 없음
  if (analysisStatus !== "done") {
    setGuideStatus("error");
    setGuideError("먼저 STEP 01 분석을 완료해주세요.");
    return;
  }

  // 이미 조립 가이드가 만들어졌다면 다시 만들지 않음
  if (guideStatus === "done" && guideSteps.length > 0) return;

  // 여기서부터 사용자에게 "생성중..." 상태를 보여줌
  setGuideStatus("running");

  try {
    // 현재 구조에서는 steps 데이터가 있어야만 화면에 조립 단계를 보여줄 수 있음
    // (나중에 steps 생성 API를 붙이면 여기만 서버 호출로 바뀌게 됨)
    if (!availableSteps || availableSteps.length === 0) {
      await waitMinLoadingIfNeeded();

      setGuideStatus("error");
      setGuideError(
        "현재 조립 단계 정보가 없습니다. 샘플 모드를 사용하거나, steps 생성 API 연동이 필요합니다."
      );
      return;
    }

    // 빠르게 끝나더라도 '생성중...'이 잠깐은 보이도록 대기
    await waitMinLoadingIfNeeded();

    setGuideSteps(availableSteps);
    setGuideStatus("done");
  } catch (err) {
    console.error(err);

    await waitMinLoadingIfNeeded();

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
          onRetryAnalyze={handleAnalyze}
        />
      </div>
    </main>
  );
}
