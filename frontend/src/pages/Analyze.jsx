// frontend/src/pages/Analyze.jsx
import { useEffect, useRef, useState } from "react";
import UploadPanel from "../components/analyze/upload/UploadPanel.jsx";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide } from "../api/guideClient";
import {
  AUTO_BRICK_PRESET,
  normalizeBrickTypes,
  toSafeBrickMode,
  toSafeColorLimit,
  toSafeGridSize,
} from "../utils/analyzeOptions";
import "./Analyze.css";

const MIN_LOADING_MS = 250; // 너무 짧으면 깜빡이고, 너무 길면 느려보여서 중간값 사용
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_OPTIONS = {
  gridSize: "16x16", // "16x16" | "32x32" | "48x48"
  colorLimit: 16, // 0 | 8 | 16 | 24 (0 = 제한 없음)
};

/*
  분석 결과에 “요청할 때 사용한 옵션”을 같이 저장한다.

  이유:
  - 서버가 옵션 정보를 결과에 안 넣어줘도, 화면에서 어떤 설정으로 분석했는지 알 수 있다.
  - 나중에 오류가 생겨도, 어떤 옵션으로 요청했는지 추적이 쉽다.
*/
function attachRequestOptionsToResult(analysisOnly, requestOptions) {
  const base = analysisOnly && typeof analysisOnly === "object" ? analysisOnly : {};
  const prevMeta = base.meta && typeof base.meta === "object" ? base.meta : {};

  // gridSize("16x16")에서 가로/세로 값을 추측한다. (서버 값이 있으면 서버 값을 우선)
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
      gridWidth: prevMeta.gridWidth ?? prevMeta.width ?? inferredW,
      gridHeight: prevMeta.gridHeight ?? prevMeta.height ?? inferredH,
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
  // 진행 중인 요청을 취소하기 위한 저장소
  const analyzeAbortRef = useRef(null);

  // “마지막 요청만 화면에 반영”하기 위한 번호
  const requestSeqRef = useRef(0);

  // 입력 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useSample, setUseSample] = useState(true);

  // 옵션 상태
  const [analysisOptions, setAnalysisOptions] = useState(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 브릭 옵션
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
          // 옵션/파일 변경 등으로 의도적으로 취소된 경우는 메시지를 안 보여준다.
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
      if (remain > 0) await sleep(remain);
    };

    // “요청에 쓰는 옵션 묶음” (요청 직전에 한 번만 만들어서 사용)
    const requestOptions = {
      gridSize: analysisOptions.gridSize,
      colorLimit: analysisOptions.colorLimit, // 0(제한 없음) 포함
      brickMode,
      brickTypes: getBrickTypesToSend(),
    };

    try {
      const payload = useSample
        ? SAMPLE_GUIDE
        : await analyzeGuide(selectedFile, requestOptions, controller.signal);

      // 최신 요청이 아니면 반영하지 않음
      if (seq !== requestSeqRef.current) return;

      await waitMinLoadingIfNeeded();
      if (seq !== requestSeqRef.current) return;

      const analysisOnly = extractAnalysisOnly(payload);
      const analysisWithOptions = attachRequestOptionsToResult(analysisOnly, requestOptions);
      const steps = normalizeSteps(payload?.steps);

      setAnalysisResult(analysisWithOptions);
      setAvailableSteps(steps);
      setAnalysisStatus("done");
    } catch (err) {
      if (seq !== requestSeqRef.current) return;

      const msg = normalizeClientError(err);

      // 의도적으로 취소된 요청은 에러로 안 보여줌
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
      if (seq === requestSeqRef.current) {
        analyzeAbortRef.current = null;
      }
    }
  };

  const handleGenerateGuide = async () => {
    const startedAt = Date.now();

    const waitMinLoadingIfNeeded = async () => {
      const elapsed = Date.now() - startedAt;
      const remain = MIN_LOADING_MS - elapsed;
      if (remain > 0) await sleep(remain);
    };

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
        await waitMinLoadingIfNeeded();
        setGuideStatus("error");
        setGuideError(
          "현재 조립 단계 정보가 없습니다. 샘플 모드를 사용하거나, steps 생성 API 연동이 필요합니다."
        );
        return;
      }

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
