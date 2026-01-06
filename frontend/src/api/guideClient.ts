// frontend/src/api/guideClient.ts
import type { GuideResponse, AnalyzeOptions, BrickType } from "../types/legoGuide";
import { BRICK_TYPES } from "../types/legoGuide";

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => window.clearTimeout(id) };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isNormalizedApiError(v: unknown): v is NormalizedApiError {
  return (
    isRecord(v) &&
    typeof v.kind === "string" &&
    typeof v.message === "string"
  );
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toStringArrayOrNull(v: unknown): string[] | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? [s] : null;
  }

  if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
    const cleaned = v.map((x) => x.trim()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }

  return null;
}

type BrickModePreset = "auto" | "manual";

/**
 * "menual" 같은 레거시 오타까지 흡수해서 "manual"로 정규화
 */
function toBrickModeOrNull(v: unknown): BrickModePreset | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s === "auto") return "auto";
  if (s === "manual") return "manual";
  if (s === "menual") return "manual"; // 오타 호환
  return null;
}

function acceptGridSize(v: unknown): AnalyzeOptions["gridSize"] | null {
  if (typeof v !== "string") return null;
  const g = v.toLowerCase().replace(/\s+/g, "");
  if (g === "16x16" || g === "32x32" || g === "48x48") {
    return g as AnalyzeOptions["gridSize"];
  }
  return null;
}

function acceptColorLimit(n: number): AnalyzeOptions["colorLimit"] | null {
  // legoGuide.ts 기준: 0 | 8 | 16 | 24
  if (n === 0 || n === 8 || n === 16 || n === 24) {
    return n as AnalyzeOptions["colorLimit"];
  }
  return null;
}

function filterBrickTypes(values: string[]): BrickType[] {
  const allowed = new Set<string>(BRICK_TYPES as readonly string[]);
  const cleaned = values.map((x) => x.trim()).filter(Boolean);
  const filtered = cleaned.filter((x) => allowed.has(x));
  return Array.from(new Set(filtered)) as BrickType[];
}

function ensure1x1(bricks: BrickType[]): BrickType[] {
  if (bricks.includes("1x1")) return bricks;
  return (["1x1", ...bricks] as BrickType[]);
}

/**
 * UI/서버 표기(gridSize vs grid_size 등)를 흡수해서 정규화한다.
 *
 * 정책:
 * - 0(제한 없음)은 falsy이므로 typeof === "number"로 체크
 * - brickMode만 단독이면 의미가 약하므로 null 반환(의도/주석 일치)
 * - brickTypes는 BRICK_TYPES 기준으로 필터링
 * - 수동 선택이 들어오면 1x1 강제 포함
 */
function normalizeAnalyzeOptions(
  options: unknown
): Partial<AnalyzeOptions> | null {
  if (!options) return null;
  if (!isRecord(options)) return null;

  const gridCandidate =
    options.gridSize ??
    options.grid_size ??
    options.grid ??
    options.gridSizePreset;

  // colorLimit / maxColors 모두 흡수
  const colorsCandidate =
    options.colorLimit ??
    options.color_limit ??
    options.maxColors ??
    options.max_colors ??
    options.colors;

  const brickModeCandidate =
    options.brickMode ??
    options.brick_mode ??
    options.mode ??
    options.bricksMode;

  // brickTypes / allowedBricks / brick_types 등 모두 흡수
  const brickTypesCandidate =
    options.brickTypes ??
    options.brick_types ??
    options.allowedBricks ??
    options.allowed_bricks ??
    options.brickType ??
    options.brick_type;

  const normalized: Partial<AnalyzeOptions> = {};

  const grid = acceptGridSize(gridCandidate);
  if (grid) normalized.gridSize = grid;

  const num = toNumberOrNull(colorsCandidate);
  if (num !== null) {
    const cl = acceptColorLimit(num);
    if (cl !== null) normalized.colorLimit = cl;
  }

  const mode = toBrickModeOrNull(brickModeCandidate);
  if (mode) normalized.brickMode = mode;

  const raw = toStringArrayOrNull(brickTypesCandidate);
  if (raw) {
    const bricks = filterBrickTypes(raw);
    if (bricks.length > 0) {
      // brickTypes가 있으면 사실상 manual 성격이므로 1x1 포함
      normalized.brickTypes = ensure1x1(bricks);
    }
  }

  const hasGrid = typeof normalized.gridSize === "string";
  const hasColors = typeof normalized.colorLimit === "number"; // 0도 true
  const hasBricks =
    Array.isArray(normalized.brickTypes) && normalized.brickTypes.length > 0;

  // brickMode 단독이면 의미가 약하므로 null
  if (!hasGrid && !hasColors && !hasBricks) return null;

  return normalized;
}

/**
 * UI에서 "이 에러가 콜드스타트/일시적 장애일 가능성이 높은지" 판단하는 용도
 */
export function isLikelyColdStart(err: unknown): boolean {
  if (!isNormalizedApiError(err)) return false;

  if (err.kind === "NETWORK" || err.kind === "TIMEOUT") return true;

  if (
    err.kind === "HTTP_5XX" &&
    (err.status === 502 || err.status === 503 || err.status === 504)
  ) {
    return true;
  }

  return false;
}

function shouldRetry(err: NormalizedApiError): boolean {
  // 사용자가 취소한 요청은 재시도하지 않음
  if (err.kind === "ABORTED") return false;

  // 네트워크/타임아웃은 대표적인 일시 오류
  if (err.kind === "NETWORK" || err.kind === "TIMEOUT") return true;

  // Render 콜드스타트에서 자주 나오는 상태코드만 제한적으로 재시도
  if (
    err.kind === "HTTP_5XX" &&
    (err.status === 502 || err.status === 503 || err.status === 504)
  ) {
    return true;
  }

  return false;
}

function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => resolve(), ms);

    if (!signal) return;

    const onAbort = () => {
      window.clearTimeout(id);
      reject({
        kind: "ABORTED",
        message: "요청이 취소되었습니다.",
      } satisfies NormalizedApiError);
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * JSON 요청 1회 실행 (타임아웃/abort/응답표준화)
 * - SRP: 재시도는 여기서 하지 않는다.
 */
async function requestJsonOnce<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<T> {
  const { signal: tSignal, clear } = timeoutSignal(timeoutMs);
  const controller = new AbortController();
  let timedOut = false;

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else {
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  tSignal.addEventListener(
    "abort",
    () => {
      timedOut = true;
      controller.abort();
    },
    { once: true }
  );

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let message = `HTTP ${res.status}`;

      if (isJson) {
        try {
          const data: any = await res.json();
          message = data?.detail || data?.message || data?.error || message;
        } catch {
          // ignore
        }
      }

      const kind: NormalizedApiErrorKind =
        res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX";

      throw { kind, message, status: res.status } satisfies NormalizedApiError;
    }

    if (!isJson) {
      throw {
        kind: "INVALID_RESPONSE",
        message: "서버 응답이 JSON이 아닙니다.",
      } satisfies NormalizedApiError;
    }

    try {
      return (await res.json()) as T;
    } catch {
      throw {
        kind: "INVALID_RESPONSE",
        message: "서버 JSON 파싱에 실패했습니다.",
      } satisfies NormalizedApiError;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      if (timedOut) {
        throw {
          kind: "TIMEOUT",
          message: "요청 시간이 초과되었습니다.",
        } satisfies NormalizedApiError;
      }
      throw {
        kind: "ABORTED",
        message: "요청이 취소되었습니다.",
      } satisfies NormalizedApiError;
    }

    if (isNormalizedApiError(err)) {
      throw err;
    }

    throw {
      kind: "NETWORK",
      message: "네트워크 오류가 발생했습니다.",
    } satisfies NormalizedApiError;
  } finally {
    clear();
  }
}

type RequestRetryOptions = {
  timeoutMs?: number;
  retries?: number;        // 추가 재시도 횟수(0이면 단발)
  baseDelayMs?: number;    // 백오프 시작값
  maxDelayMs?: number;     // 백오프 상한
};

/**
 * JSON 요청 + 재시도(백오프)
 * - Render 콜드스타트 대응을 위해 제한적인 조건에서만 재시도한다.
 */
async function requestJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  externalSignal?: AbortSignal,
  opts?: RequestRetryOptions
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 12000;
  const retries = opts?.retries ?? 2;
  const baseDelayMs = opts?.baseDelayMs ?? 700;
  const maxDelayMs = opts?.maxDelayMs ?? 4000;

  let lastError: NormalizedApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (externalSignal?.aborted) {
      throw {
        kind: "ABORTED",
        message: "요청이 취소되었습니다.",
      } satisfies NormalizedApiError;
    }

    try {
      return await requestJsonOnce<T>(url, init, timeoutMs, externalSignal);
    } catch (e) {
      const err: NormalizedApiError = isNormalizedApiError(e)
        ? e
        : ({
            kind: "NETWORK",
            message: "네트워크 오류가 발생했습니다.",
          } satisfies NormalizedApiError);

      lastError = err;

      const canRetry = attempt < retries && shouldRetry(err);
      if (!canRetry) throw err;

      const backoff = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = Math.floor(Math.random() * 250);

      await sleepWithAbort(backoff + jitter, externalSignal);
    }
  }

  // 사실상 도달하지 않지만 타입 안전을 위해
  throw (
    lastError ??
    ({
      kind: "INVALID_RESPONSE",
      message: "알 수 없는 오류가 발생했습니다.",
    } satisfies NormalizedApiError)
  );
}

/**
 * 이미지 파일로 가이드 분석: /api/guide/analyze
 *
 * 전송 정책(호환 중심):
 * - options(JSON) + Form 필드 동시 전송
 * - colorLimit: color_limit + max_colors 둘 다 전송(서버 키 차이 흡수)
 * - brickMode: brick_mode 전송
 * - brickTypes: brick_types + allowed_bricks (JSON 문자열) 전송
 */
export async function analyzeGuide(
  imageFile: File,
  options?: unknown,
  signal?: AbortSignal
): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile);

  const normalized = normalizeAnalyzeOptions(options);

  if (normalized) {
    const optionsPayload: Record<string, unknown> = {};

    if (normalized.gridSize) {
      optionsPayload.grid_size = normalized.gridSize;
      optionsPayload.gridSize = normalized.gridSize;
      form.append("grid_size", normalized.gridSize);
    }

    if (typeof normalized.colorLimit === "number") {
      optionsPayload.color_limit = normalized.colorLimit;
      optionsPayload.colorLimit = normalized.colorLimit;

      // 레거시 호환
      optionsPayload.max_colors = normalized.colorLimit;
      optionsPayload.maxColors = normalized.colorLimit;

      form.append("color_limit", String(normalized.colorLimit));
      form.append("max_colors", String(normalized.colorLimit));
    }

    if (normalized.brickMode) {
      optionsPayload.brick_mode = normalized.brickMode;
      optionsPayload.brickMode = normalized.brickMode;
      form.append("brick_mode", normalized.brickMode);
    }

    if (normalized.brickTypes && normalized.brickTypes.length > 0) {
      optionsPayload.brick_types = normalized.brickTypes;
      optionsPayload.brickTypes = normalized.brickTypes;

      const json = JSON.stringify(normalized.brickTypes);
      form.append("brick_types", json);
      form.append("allowed_bricks", json); // 서버 키 차이 흡수
    }

    form.append("options", JSON.stringify(optionsPayload));
  }

  return requestJsonWithRetry<GuideResponse>(
    `${API_BASE_URL}/api/guide/analyze`,
    { method: "POST", body: form },
    signal,
    {
      timeoutMs: 12000,
      retries: 2,
      baseDelayMs: 700,
      maxDelayMs: 4000,
    }
  );
}
