// frontend/src/api/guideClient.ts
import type { GuideResponse, AnalyzeOptions } from "../types/legoGuide";
import {
  acceptGridSizeOrNull,
  acceptColorLimitOrNull,
  toBrickModeOrNull,
  normalizeBrickTypes,
} from "../utils/analyzeOptions";

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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000").replace(/\/$/, "");

/*
  일정 시간이 지나도 응답이 없으면 요청을 중단시키기 위한 장치다.
*/
function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => window.clearTimeout(id) };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/*
  프론트에서 넘어오는 옵션을 서버가 이해하기 쉬운 형태로 정리한다.
  (규칙은 utils/analyzeOptions.ts를 SSOT로 사용)
*/
function normalizeAnalyzeOptions(options: unknown): Partial<AnalyzeOptions> | null {
  if (!options || !isRecord(options)) return null;

  const gridCandidate =
    options.gridSize ?? options.grid_size ?? options.grid ?? options.gridSizePreset;

  const colorsCandidate =
    options.colorLimit ??
    options.color_limit ??
    options.maxColors ??
    options.max_colors ??
    options.colors;

  const brickModeCandidate =
    options.brickMode ?? options.brick_mode ?? options.mode ?? options.bricksMode;

  const brickTypesCandidate =
    options.brickTypes ??
    options.brick_types ??
    options.allowedBricks ??
    options.allowed_bricks ??
    options.brickType ??
    options.brick_type;

  const normalized: Partial<AnalyzeOptions> = {};

  // gridSize
  const grid = acceptGridSizeOrNull(gridCandidate);
  if (grid) normalized.gridSize = grid;

  // colorLimit (0 포함)
  const n = toNumberOrNull(colorsCandidate);
  if (n !== null) {
    const cl = acceptColorLimitOrNull(n);
    if (cl !== null) normalized.colorLimit = cl;
  }

  // brickMode
  const mode = toBrickModeOrNull(brickModeCandidate);
  if (mode) normalized.brickMode = mode;

  // brickTypes (SSOT normalize로 필터 + 중복 제거 + 1x1 보장)
  const bricks = normalizeBrickTypes(brickTypesCandidate);
  if (bricks.length > 0) normalized.brickTypes = bricks;

  const hasGrid = typeof normalized.gridSize === "string";
  const hasColors = typeof normalized.colorLimit === "number"; // 0도 포함
  const hasBricks = Array.isArray(normalized.brickTypes) && normalized.brickTypes.length > 0;

  // 의미 있는 옵션이 하나도 없으면 null
  if (!hasGrid && !hasColors && !hasBricks) return null;

  return normalized;
}

/*
  서버 요청 공통 함수.
*/
async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 30000,
  externalSignal?: AbortSignal
): Promise<T> {
  const { signal: tSignal, clear } = timeoutSignal(timeoutMs);

  const controller = new AbortController();
  let timedOut = false;

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
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

      const kind: NormalizedApiErrorKind = res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX";
      throw { kind, message, status: res.status } satisfies NormalizedApiError;
    }

    if (!isJson) {
      throw {
        kind: "INVALID_RESPONSE",
        message: "서버 응답이 JSON 형식이 아닙니다.",
      } satisfies NormalizedApiError;
    }

    try {
      return (await res.json()) as T;
    } catch {
      throw {
        kind: "INVALID_RESPONSE",
        message: "서버 JSON 읽기에 실패했습니다.",
      } satisfies NormalizedApiError;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      if (timedOut) {
        throw { kind: "TIMEOUT", message: "요청 시간이 초과되었습니다." } satisfies NormalizedApiError;
      }
      throw { kind: "ABORTED", message: "요청이 취소되었습니다." } satisfies NormalizedApiError;
    }

    if (err && typeof err === "object" && typeof err.kind === "string") {
      throw err;
    }

    throw { kind: "NETWORK", message: "네트워크 오류가 발생했습니다." } satisfies NormalizedApiError;
  } finally {
    clear();
  }
}

/*
  이미지 파일을 서버에 보내 분석 결과를 받는다.
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
    // 서버 호환용 payload(한 번에)
    const optionsPayload: Record<string, unknown> = {};

    if (normalized.gridSize) {
      optionsPayload.grid_size = normalized.gridSize;
      form.append("grid_size", normalized.gridSize);
    }

    if (typeof normalized.colorLimit === "number") {
      optionsPayload.color_limit = normalized.colorLimit;
      form.append("color_limit", String(normalized.colorLimit));
    }

    if (normalized.brickMode) {
      optionsPayload.brick_mode = normalized.brickMode;
      form.append("brick_mode", normalized.brickMode);
    }

    if (normalized.brickTypes && normalized.brickTypes.length > 0) {
      optionsPayload.brick_types = normalized.brickTypes;
      form.append("brick_types", JSON.stringify(normalized.brickTypes));
    }

    form.append("options", JSON.stringify(optionsPayload));
  }

  return requestJson<GuideResponse>(
    `${API_BASE_URL}/api/guide/analyze`,
    { method: "POST", body: form },
    30000,
    signal
  );
}
