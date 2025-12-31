// frontend/src/api/guideClient.ts
import type { GuideResponse } from "../types/legoGuide";

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

type GridSizePreset = "16x16" | "32x32" | "48x48";

// 0 = 제한 없음
type MaxColorsPreset = 0 | 8 | 16 | 24;

export type AnalyzeOptions = {
  gridSize: GridSizePreset;
  maxColors: MaxColorsPreset;

  // ✅ 추가: 예) ["2x5"] / ["plate"] / ["2x5","1x1"] 등
  brickTypes?: string[];
};

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

function acceptMaxColors(n: number): n is MaxColorsPreset {
  return n === 0 || n === 8 || n === 16 || n === 24;
}

function toStringArrayOrNull(v: unknown): string[] | null {
  // "2x5" -> ["2x5"]
  if (typeof v === "string") {
    const s = v.trim();
    return s ? [s] : null;
  }

  // ["2x5","plate"] -> 그대로 (빈 문자열 제거)
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
    const cleaned = v.map((x) => x.trim()).filter(Boolean);
    return cleaned.length ? cleaned : null;
  }

  return null;
}

/**
 * UI/서버 양쪽 표기(gridSize vs grid_size 등)를 흡수해서
 * 일관된 옵션 객체로 정규화한다.
 *
 * 중요한 포인트:
 * - maxColors: 0(제한 없음)도 유효 값으로 취급해야 한다.
 * - 0은 falsy이므로 "있음/없음" 체크를 typeof === "number"로 해야 한다.
 * - brickTypes는 options JSON 안에 brick_types로 실어서 보낸다(스웨거와 동일)
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

  const colorsCandidate =
    options.maxColors ??
    options.max_colors ??
    options.colors ??
    options.colorLimit;

  // ✅ brick types: camel/snake/단수 키까지 흡수
  const brickTypesCandidate =
    options.brickTypes ??
    options.brick_types ??
    options.brickType ??
    options.brick_type;

  const normalized: Partial<AnalyzeOptions> = {};

  if (typeof gridCandidate === "string") {
    const g = gridCandidate.toLowerCase().replace(/\s+/g, "");
    if (g === "16x16" || g === "32x32" || g === "48x48") {
      normalized.gridSize = g as GridSizePreset;
    }
  }

  const n = toNumberOrNull(colorsCandidate);
  if (n !== null && acceptMaxColors(n)) {
    normalized.maxColors = n;
  }

  const bt = toStringArrayOrNull(brickTypesCandidate);
  if (bt) {
    normalized.brickTypes = bt;
  }

  const hasGrid = typeof normalized.gridSize === "string";
  const hasMaxColors = typeof normalized.maxColors === "number"; // 0도 true
  const hasBrickTypes =
    Array.isArray(normalized.brickTypes) && normalized.brickTypes.length > 0;

  // ✅ brickTypes만 있어도 options는 유효
  if (!hasGrid && !hasMaxColors && !hasBrickTypes) return null;

  return normalized;
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 30000,
  externalSignal?: AbortSignal
): Promise<T> {
  const { signal: tSignal, clear } = timeoutSignal(timeoutMs);
  const controller = new AbortController();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }

  tSignal.addEventListener("abort", () => controller.abort(), { once: true });

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

    return (await res.json()) as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw {
        kind: "ABORTED",
        message: "요청이 취소되었습니다.",
      } satisfies NormalizedApiError;
    }

    if (err && typeof err === "object" && typeof err.kind === "string") {
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

/**
 * 이미지 파일로 가이드 분석: /api/guide/analyze
 *
 * 전송 정책:
 * - options(JSON): gridSize, maxColors(0 포함), brick_types 전달
 * - grid_size / max_colors: Form 필드 호환 전달 (0도 전달)
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
    // ✅ 스웨거와 같은 키로 구성해서 보냄
    const optionsPayload: Record<string, unknown> = {};

    if (normalized.gridSize) {
      optionsPayload.gridSize = normalized.gridSize;
    }

    // 0(제한 없음)도 포함
    if (typeof normalized.maxColors === "number") {
      optionsPayload.maxColors = normalized.maxColors;
      // (호환) 서버에서 colorLimit도 보는 경우 대비
      optionsPayload.colorLimit = normalized.maxColors;
    }

    if (normalized.brickTypes && normalized.brickTypes.length > 0) {
      optionsPayload.brick_types = normalized.brickTypes;
      // (호환) camelCase도 같이(서버에서 brickTypes 볼 때 대비)
      optionsPayload.brickTypes = normalized.brickTypes;
    }

    form.append("options", JSON.stringify(optionsPayload));
  }

  if (normalized?.gridSize) {
    form.append("grid_size", normalized.gridSize);
  }

  // 0(제한 없음)도 전달해야 백엔드가 None 처리할 수 있다
  if (typeof normalized?.maxColors === "number") {
    form.append("max_colors", String(normalized.maxColors));
  }

  return requestJson<GuideResponse>(
    `${API_BASE_URL}/api/guide/analyze`,
    { method: "POST", body: form },
    30000,
    signal
  );
}
