// frontend/src/api/guideClient.ts
import type { GuideResponse, AnalyzeOptions, BrickType } from "../types/legoGuide";
import { acceptGridSizeOrNull, normalizeBrickTypes, toSafeColorLimit } from "../utils/analyzeOptions";

/**
 * STEP2 요청/응답 타입은 지금은 api 클라이언트 내부에 최소 정의로 둔다.
 * (다음 단계에서 ../types/legoGuide.ts로 이동해서 SSOT로 만들 예정)
 */
export type BuildStepsRequest = {
  analysisId: string;
  brickTypes?: BrickType[];
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
 * 타입 가드
 * - 왜: options가 배열/원시값으로 들어오면 런타임에서 .gridSize 접근이 터질 수 있다.
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
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

/**
 * AnalyzeOptions 정규화(SSOT)
 * - 왜: 화면(Analyze)과 API 요청(guideClient)이 다른 규칙을 쓰면,
 *       커스텀 그리드/허용값 처리에서 쉽게 엇갈려 버그가 난다.
 * - 해결: /utils/analyzeOptions.ts 의 규칙을 그대로 사용한다.
 */
function normalizeAnalyzeOptions(options?: unknown): AnalyzeOptions | undefined {
  if (!isRecord(options)) return undefined;

  const gridSize: AnalyzeOptions["gridSize"] = acceptGridSizeOrNull(options.gridSize) ?? "16x16";
  const colorLimit: AnalyzeOptions["colorLimit"] = toSafeColorLimit(options.colorLimit);

  // brickTypes 규칙(허용 목록, 중복 제거, 1x1 강제)은 SSOT를 사용
  const brickTypes = normalizeBrickTypes(options.brickTypes);

  const brickModeRaw = options.brickMode;
  const brickMode: AnalyzeOptions["brickMode"] | undefined =
    brickModeRaw === "auto" || brickModeRaw === "manual" ? brickModeRaw : undefined;

  return brickMode ? { gridSize, colorLimit, brickTypes, brickMode } : { gridSize, colorLimit, brickTypes };
}

/**
 * 타임아웃 시그널 생성
 * - AbortError만으로는 "사용자 취소" vs "타임아웃" 구분이 안 되므로, 타임아웃 여부를 별도 플래그로 추적한다.
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
    if (signal.aborted) controller.abort();

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
    // options는 서버 확장(추가 옵션)용으로 함께 보낸다.
    form.append("options", JSON.stringify(normalized));

    // 서버가 Form 필드를 우선 파싱할 수 있도록 핵심 필드는 별도로도 전달한다.
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
