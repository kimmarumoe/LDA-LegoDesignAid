// frontend/src/pages/Analyze.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { clearPendingAnalysis, readPendingAnalysis } from "../utils/pendingAnalysis.js";
import SaveWorkForm from "../components/works/SaveWorkForm.jsx";
import UploadPanel from "../components/analyze/upload/UploadPanel.jsx";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import { SAMPLE_GUIDE, SAMPLE_GUIDE_PRESETS } from "../sample/sampleGuide.js";
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
  const location = useLocation();
  const { member, loading } = useAuth();
  if (new URLSearchParams(location.search).get("resume") !== "1") return <AnalyzeContent />;
  if (loading) return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (!member) return <section className="account-page"><p>임시 결과를 복원하려면 로그인해 주세요.</p><Link to="/login?resume=1">로그인하기</Link></section>;
  return <ResumeAnalysis key={member.id} memberId={member.id} />;
}

function ResumeAnalysis({ memberId }) {
  const [result] = useState(() => readPendingAnalysis(memberId));
  const [cleanupError, setCleanupError] = useState("");
  useEffect(() => {
    if (result.status === "expired" || result.status === "invalid") clearPendingAnalysis();
  }, [result.status]);
  if (result.status === "ready") return <AnalyzeContent draft={result.draft} />;
  const messages = {
    missing: "복원할 임시 결과가 없습니다. 이미 저장했거나 초기화한 결과일 수 있습니다.",
    expired: "임시 보관 시간이 30분을 지나 결과를 복원할 수 없습니다.",
    invalid: "임시 결과의 형식이 올바르지 않습니다. 다시 분석해 주세요.",
    unavailable: "브라우저 임시 저장 공간에 접근할 수 없거나 데이터를 읽지 못했습니다.",
    "different-member": "다른 계정의 임시 결과는 복원하지 않았습니다. 원래 계정으로 다시 로그인하거나 임시 결과를 삭제해 주세요.",
  };
  return <section className="account-page"><div className="account-card"><h1>분석 결과 복원</h1><p role="status">{messages[result.status] ?? "로그인이 필요합니다."}</p>
    <Link to="/analyze">새 분석 시작하기</Link>
    {result.status === "different-member" && <button className="account-secondary" onClick={() => {
      setCleanupError(clearPendingAnalysis() ? "임시 결과를 삭제했습니다." : "임시 결과를 삭제하지 못했습니다. 이 탭을 닫아 주세요.");
    }}>임시 결과 삭제</button>}
    {cleanupError && <p role="status">{cleanupError}</p>}
  </div></section>;
}

function AnalyzeContent({ draft = null }) {
  const location = useLocation();
  const sampleId = draft?.sampleId ?? location.state?.sampleId ?? "smile-16";
  const sampleGuide = SAMPLE_GUIDE_PRESETS[sampleId] ?? SAMPLE_GUIDE;
  const [restoration, setRestoration] = useState(draft);
  const [draftNotice, setDraftNotice] = useState("");
  // STEP1 취소
  const analyzeAbortRef = useRef(null);
  const requestSeqRef = useRef(0);

  // STEP2 취소/시퀀스
  const guideAbortRef = useRef(null);
  const guideRequestSeqRef = useRef(0);

  // 입력 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [useSample, setUseSample] = useState(draft?.useSample ?? true);

  // 옵션 상태
  const [analysisOptions, setAnalysisOptions] = useState(() => ({
    ...DEFAULT_OPTIONS,
    gridSize: toSafeGridSize(draft?.options?.gridSize ?? `${sampleGuide.meta.width}x${sampleGuide.meta.height}`),
    colorLimit: toSafeColorLimit(draft?.options?.colorLimit ?? DEFAULT_OPTIONS.colorLimit),
  }));
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // 브릭 옵션
  const [brickMode, setBrickMode] = useState(toSafeBrickMode(draft?.options?.brickMode)); // "auto" | "manual"
  const [brickAllowed, setBrickAllowed] = useState(() => normalizeBrickTypes(draft?.options?.brickTypes));

  // STEP 01 결과
  const [analysisResult, setAnalysisResult] = useState(draft?.analysis ?? null);
  const [analysisStatus, setAnalysisStatus] = useState(draft ? "done" : "idle"); // idle | running | done | error
  const [analysisError, setAnalysisError] = useState("");

  // STEP 02 결과
  const [availableSteps, setAvailableSteps] = useState(draft?.steps ?? []);
  const [guideSteps, setGuideSteps] = useState(draft?.steps ?? []);
  const [guideStatus, setGuideStatus] = useState(draft ? "done" : "idle"); // idle | running | done | error
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

  function clearRestoration() {
    if (restoration && !clearPendingAnalysis(restoration.id)) {
      setDraftNotice("화면은 초기화했지만 임시 데이터를 삭제하지 못했습니다. 이 탭을 닫아 주세요.");
    } else { setDraftNotice(""); }
    setRestoration(null);
  }

  function resetAllResults() {
    clearRestoration();
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
    return { ...guidePayload, steps: [] };
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
    clearRestoration();
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
        ? sampleGuide
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

    abortGuide();
    const seq = guideRequestSeqRef.current;
    const controller = new AbortController();
    guideAbortRef.current = controller;
    setGuideStatus("running");

    try {
      // 샘플 모드는 payload에 steps가 있을 수 있으니 그대로 사용
      if (useSample) {
        if (!availableSteps || availableSteps.length === 0) {
          await waitMinLoadingIfNeeded();
          if (seq !== guideRequestSeqRef.current) return;
          setGuideStatus("error");
          setGuideError("샘플 데이터에 steps가 없습니다. SAMPLE_GUIDE를 확인해주세요.");
          return;
        }
        await waitMinLoadingIfNeeded();
        if (seq !== guideRequestSeqRef.current) return;
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
        if (seq !== guideRequestSeqRef.current) return;
        setGuideStatus("error");
        setGuideError("analysisId를 찾을 수 없습니다. STEP 01을 다시 실행해주세요.");
        return;
      }

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
        setGuideError("조립 단계가 없습니다. STEP 01을 다시 실행해주세요.");
        return;
      }

      setGuideSteps(steps);
      setGuideStatus("done");
    } catch (err) {
      if (seq !== guideRequestSeqRef.current) return;
      const message = normalizeClientError(err);
      if (!message) {
        setGuideStatus("idle");
        return;
      }
      console.error(err);
      await waitMinLoadingIfNeeded();
      if (seq !== guideRequestSeqRef.current) return;
      setGuideStatus("error");
      setGuideError(message);
    } finally {
      if (seq === guideRequestSeqRef.current) guideAbortRef.current = null;
    }
  };

  const handleReset = () => {
    abortAll();
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsOptionsOpen(false);
    resetAllResults();
  };

  return (
    <main className="analyze-page">
      <div className="analyze-container">
        {restoration && <p className="account-notice" role="status">분석 결과와 작품 이름을 복원했습니다. 저장 버튼을 눌러 내 작품으로 저장해 주세요. 원본 파일은 복원하지 않았으므로 새 분석에는 파일을 다시 선택해야 할 수 있습니다.</p>}
        {draftNotice && <p role="alert">{draftNotice}</p>}
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

        <div className="analysis-results">
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
        {analysisStatus === "done" && guideStatus === "done" && guideSteps.length > 0 && (
          <SaveWorkForm key={useSample ? sampleGuide.meta.createdAt + sampleGuide.meta.gridSize : analysisResult.analysisId} analysis={analysisResult} steps={guideSteps} options={analysisResult.meta?.requestOptions ?? restoration?.options ?? {}} useSample={useSample} sampleId={sampleId} initialTitle={restoration?.title ?? ""} pendingId={restoration?.id} onSaved={() => setRestoration(null)} />
        )}
        </div>
      </div>
    </main>
  );
}
