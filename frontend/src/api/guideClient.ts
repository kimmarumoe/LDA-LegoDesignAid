// frontend/src/api/guideClient.ts
import type { GuideResponse, AnalyzeOptions, BrickType } from "../types/legoGuide";
import { BRICK_TYPES } from "../types/legoGuide";

/**
 * STEP2 요청/응답 타입은 지금은 api 클라이언트 내부에 최소 정의로 둔다.
 * (다음 단계 B에서 ../types/legoGuide.ts로 이동해서 SSOT로 만들 예정)
 */
export type BuildStepsRequest = {
  analysisId: string;
  brickTypes?: BrickType[]; // 문자열 대신 SSOT 타입 사용
  optimize?: boolean;
  // 서버 확장용 옵션(있어도 되고 없어도 됨)
  [key: string]: unknown;
};

export type BuildStepsResponse = {
  analysisId: string;
  sections?: unknown[];
  steps?: unknown[];
  bricks?: unknown[];
  schemaVersion?: number;
  meta?: unknown;
};

type NormalizedApiErrorKind =
  | "TIMEOUT"
  | "NETWORK"
  | "HTTP_4XX"
  | "HTTP_5XX"
  | "INVALID_RESPONSE"
  | "ABORTED";

export type NormalizedApiError = {
  kind: NormalizedApiErrorKind;
  message: string;
  status?: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

/**
 * 타임아웃 시그널 생성
 * - 왜: AbortError만으로는 "사용자 취소" vs "타임아웃" 구분이 안 되므로, 타임아웃 여부를 별도 플래그로 추적한다.
 */
function createTimeout(ms: number) {
  const controller = new AbortController();
  let timedOut = false;

  const id = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(id),
    didTimeout: () => timedOut,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toErrorMessage(v: unknown, fallback: string) {
  if (typeof v === "string" && v.trim()) return v;
  if (isRecord(v) && typeof v.message === "string" && v.message.trim()) return v.message;
  try {
    if (v != null) return JSON.stringify(v);
  } catch {
    // ignore
  }
  return fallback;
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * AnalyzeOptions 정규화
 * - 왜: AnalyzeOptions는 gridSize/colorLimit/brickTypes가 필수인데,
 *       부분 객체를 반환하면 TS가 "옵셔널"로 추론해서 타입 에러가 난다.
 * - 해결: 입력이 들어오면 항상 "완전한 AnalyzeOptions"로 만들어 반환한다.
 */
function normalizeAnalyzeOptions(options?: unknown): AnalyzeOptions | undefined {
  if (!isRecord(options)) return undefined;

  const gridSizeRaw = options.gridSize;
  const gridSize: AnalyzeOptions["gridSize"] =
    gridSizeRaw === "16x16" || gridSizeRaw === "32x32" || gridSizeRaw === "48x48"
      ? gridSizeRaw
      : "16x16";

  const colorLimitNum = toNumberOrNull(options.colorLimit);
  const colorLimit: AnalyzeOptions["colorLimit"] =
    colorLimitNum === 0 || colorLimitNum === 8 || colorLimitNum === 16 || colorLimitNum === 24
      ? (colorLimitNum as AnalyzeOptions["colorLimit"])
      : 16;

  const brickTypesRaw = Array.isArray(options.brickTypes) ? options.brickTypes : [];
  const brickTypes = brickTypesRaw.filter(
    (t): t is BrickType => typeof t === "string" && (BRICK_TYPES as readonly string[]).includes(t)
  );

  const normalizedBrickTypes: BrickType[] = brickTypes.length > 0 ? brickTypes : [...BRICK_TYPES];

  const brickModeRaw = options.brickMode;
  const brickMode: AnalyzeOptions["brickMode"] | undefined =
    brickModeRaw === "auto" || brickModeRaw === "manual" ? brickModeRaw : undefined;

  return brickMode
    ? { gridSize, colorLimit, brickTypes: normalizedBrickTypes, brickMode }
    : { gridSize, colorLimit, brickTypes: normalizedBrickTypes };
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  const timeout = createTimeout(timeoutMs);

  // 외부 signal과 timeout signal을 합친 merged signal 구성
  let mergedSignal: AbortSignal = timeout.signal;
  let cleanup = () => timeout.clear();

  if (signal) {
    const controller = new AbortController();
    const onAbort = () => controller.abort();

    signal.addEventListener("abort", onAbort, { once: true });
    timeout.signal.addEventListener("abort", onAbort, { once: true });

    mergedSignal = controller.signal;
    cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      timeout.signal.removeEventListener("abort", onAbort);
      timeout.clear();
    };
  }

  try {
    const res = await fetch(url, { ...init, signal: mergedSignal });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let message = `HTTP ${res.status}`;

      if (isJson) {
        try {
          const data: any = await res.json();
          const raw = data?.detail ?? data?.message ?? data?.error;
          message = toErrorMessage(raw, message);
        } catch {
          // ignore
        }
      } else {
        try {
          const text = await res.text();
          if (text) message = text;
        } catch {
          // ignore
        }
      }

      const kind: NormalizedApiErrorKind = res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX";
      throw { kind, message, status: res.status } satisfies NormalizedApiError;
    }

    if (!isJson) {
      throw {
        kind: "INVALID_RESPONSE",
        message: "서버 응답이 JSON이 아닙니다.",
        status: res.status,
      } satisfies NormalizedApiError;
    }

    return (await res.json()) as T;
  } catch (e: any) {
    // AbortError: 타임아웃 vs 사용자 취소 구분
    if (e?.name === "AbortError") {
      if (timeout.didTimeout()) {
        throw { kind: "TIMEOUT", message: `timeout (${timeoutMs}ms)` } satisfies NormalizedApiError;
      }
      throw { kind: "ABORTED", message: "aborted" } satisfies NormalizedApiError;
    }

    // 이미 NormalizedApiError 형태면 그대로 throw
    if (e && typeof e === "object" && typeof e.kind === "string") throw e;

    const msg = String(e?.message ?? "");

    // 브라우저 fetch 네트워크 계열 에러 케이스들
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) {
      throw { kind: "NETWORK", message: msg } satisfies NormalizedApiError;
    }

    throw { kind: "INVALID_RESPONSE", message: msg || "unknown" } satisfies NormalizedApiError;
  } finally {
    cleanup();
  }
}

export async function analyzeGuide(
  imageFile: File,
  options?: unknown,
  signal?: AbortSignal
): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile);

  const normalized = normalizeAnalyzeOptions(options);
  if (normalized) {
    form.append("options", JSON.stringify(normalized)),
   form.append("grid_size", normalized.gridSize);
    form.append("color_limit", String(normalized.colorLimit)); // 0이면 제한 없음
    form.append("allowed_bricks", JSON.stringify(normalized.brickTypes));

    if (normalized.brickMode) {
      form.append("brick_mode", normalized.brickMode);
    }
  }
  return requestJson<GuideResponse>(
    `${API_BASE_URL}/api/guide/analyze`,
    { method: "POST", body: form },
    30000,
    signal
  );
}

/**
 * STEP2: analysisId 기반으로 조립 단계를 생성한다.
 * - 요청 바디는 JSON
 * - 응답은 sections/steps 중심
 */
export async function buildGuideSteps(
  req: BuildStepsRequest,
  signal?: AbortSignal
): Promise<BuildStepsResponse> {
  if (!req?.analysisId) {
    // 클라이언트 단에서 빠르게 막아 디버깅 시간을 줄인다.
    throw {
      kind: "INVALID_RESPONSE",
      message: "analysisId가 필요합니다. STEP 01 분석을 먼저 실행해주세요.",
    } satisfies NormalizedApiError;
  }

  return requestJson<BuildStepsResponse>(
    `${API_BASE_URL}/api/guide/steps`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    },
    60000,
    signal
  );
}
