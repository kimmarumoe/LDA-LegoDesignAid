// frontend/src/pages/Analyze.jsx
import { useEffect, useRef, useState } from "react";
import UploadPanel from "../components/analyze/upload/UploadPanel.jsx";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE } from "../sample/sampleGuide.js";
import { analyzeGuide, buildGuideSteps } from "../api/guideClient";
import {
  AUTO_BRICK_PRESET,
  normalizeBrickTypes,
  toSafeBrickMode,
  toSafeColorLimit,
  toSafeGridSize,
} from "../utils/analyzeOptions";
import "./Analyze.css";

const MIN_LOADING_MS = 250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_OPTIONS = {
  gridSize: "16x16",
  colorLimit: 16, // 0 = 제한 없음
};

function attachRequestOptionsToResult(analysisOnly, requestOptions) {
  const base = analysisOnly && typeof analysisOnly === "object" ? analysisOnly : {};
  const prevMeta = base.meta && typeof base.meta === "object" ? base.meta : {};

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
  // STEP1 취소
  const analyzeAbortRef = useRef(null);
  const requestSeqRef = useRef(0);

  // STEP2 취소/시퀀스
  const guideAbortRef = useRef(null);
  const guideRequestSeqRef = useRef(0);

  // 입력 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useSample, setUseSample] = useState(true);

  // 옵션 상태
  const [analysisOptions, setAnalysisOptions] = useState(DEFAULT_OPTIONS);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 브릭 옵션
  const [brickMode, setBrickMode] = useState("manual"); // "auto" | "manual"
  const [brickAllowed, setBrickAllowed] = useState(["1x1"]);

  // STEP 01 결과
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

  // STEP 02 결과
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
    requestSeqRef.current += 1;
  }

  function abortGuide() {
    if (guideAbortRef.current) {
      guideAbortRef.current.abort();
      guideAbortRef.current = null;
    }
    guideRequestSeqRef.current += 1;
  }

  function abortAll() {
    abortAnalyze();
    abortGuide();
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

  useEffect(() => {
    return () => abortAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageSelect = (file, url) => {
    abortAll();
    setSelectedFile(file);
    setPreviewUrl(url);
    resetAllResults();
  };

  const handleToggleSample = (next) => {
    abortAll();
    setUseSample(next);
    resetAllResults();
  };

  const handleToggleOptions = () => {
    setIsOptionsOpen((prev) => !prev);
  };

  const handleChangeGridSize = (nextGridSize) => {
    abortAll();
    const safe = toSafeGridSize(nextGridSize);
    setAnalysisOptions((prev) => ({ ...prev, gridSize: safe }));
    resetAllResults();
  };

  const handleChangeColorLimit = (nextLimit) => {
    abortAll();
    const safe = toSafeColorLimit(nextLimit);
    setAnalysisOptions((prev) => ({ ...prev, colorLimit: safe }));
    resetAllResults();
  };

  const handleChangeBrickMode = (nextMode) => {
    abortAll();
    const safe = toSafeBrickMode(nextMode);
    setBrickMode(safe);
    resetAllResults();
  };

  const handleChangeBrickAllowed = (nextAllowed) => {
    abortAll();
    setBrickAllowed(normalizeBrickTypes(nextAllowed));
    resetAllResults();
  };

  const handleAnalyze = async () => {
    const startedAt = Date.now();

    setAnalysisError("");
    setGuideError("");
    setGuideSteps([]);
    setGuideStatus("idle");

    if (!useSample && !selectedFile) {
      setAnalysisStatus("error");
      setAnalysisError("실데이터 모드에서는 이미지를 업로드해야 분석할 수 있어요.");
      return;
    }

    abortAll();
    const seq = requestSeqRef.current;

    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setAnalysisStatus("running");

    const waitMinLoadingIfNeeded = async () => {
      const elapsed = Date.now() - startedAt;
      const remain = MIN_LOADING_MS - elapsed;
      if (remain > 0) await sleep(remain);
    };

    const requestOptions = {
      gridSize: analysisOptions.gridSize,
      colorLimit: analysisOptions.colorLimit,
      brickMode,
      brickTypes: getBrickTypesToSend(),
    };

    try {
      const payload = useSample
        ? SAMPLE_GUIDE
        : await analyzeGuide(selectedFile, requestOptions, controller.signal);

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
      // 샘플 모드는 payload에 steps가 있을 수 있으니 그대로 사용
      if (useSample) {
        if (!availableSteps || availableSteps.length === 0) {
          await waitMinLoadingIfNeeded();
          setGuideStatus("error");
          setGuideError("샘플 데이터에 steps가 없습니다. SAMPLE_GUIDE를 확인해주세요.");
          return;
        }
        await waitMinLoadingIfNeeded();
        setGuideSteps(availableSteps);
        setGuideStatus("done");
        return;
      }

      // 실데이터 모드: /api/guide/steps 호출
      const analysisId =
        analysisResult?.analysisId ??
        analysisResult?.analysisID ??
        analysisResult?.meta?.analysisId;

      if (!analysisId) {
        await waitMinLoadingIfNeeded();
        setGuideStatus("error");
        setGuideError("analysisId를 찾을 수 없습니다. STEP 01을 다시 실행해주세요.");
        return;
      }

      abortGuide();
      const seq = guideRequestSeqRef.current;

      const controller = new AbortController();
      guideAbortRef.current = controller;

      const res = await buildGuideSteps(
        {
          analysisId,
          brickTypes: getBrickTypesToSend(),
          optimize: true,
        },
        controller.signal
      );

      if (seq !== guideRequestSeqRef.current) return;

      await waitMinLoadingIfNeeded();
      if (seq !== guideRequestSeqRef.current) return;

      const steps = normalizeSteps(res?.steps);

      if (steps.length === 0) {
        setGuideStatus("error");
        return;
      }

      setGuideSteps(steps);
      setGuideStatus("done");
    } catch (err) {
      console.error(err);
      await waitMinLoadingIfNeeded();
      setGuideStatus("error");
      setGuideError(normalizeClientError(err));
    } finally {
      guideAbortRef.current = null;
    }
  };

  const handleReset = () => {
    abortAll();
    setSelectedFile(false);
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
