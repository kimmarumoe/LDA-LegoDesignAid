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
type MaxColorsPreset = 8 | 16 | 24;

export type AnalyzeOptions = {
  gridSize: GridSizePreset;
  maxColors: MaxColorsPreset;
};

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => window.clearTimeout(id) };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * UI/서버 양쪽 표기(gridSize vs grid_size 등)를 흡수해서
 * 일관된 옵션 객체로 정규화한다.
 */
function normalizeAnalyzeOptions(options: unknown): Partial<AnalyzeOptions> | null {
  if (!options) return null;
  if (!isRecord(options)) return null;

  // 후보 키들
  const gridCandidate =
    options.gridSize ?? options.grid_size ?? options.grid ?? options.gridSizePreset;
  const colorsCandidate =
    options.maxColors ?? options.max_colors ?? options.colors ?? options.colorLimit;

  const normalized: Partial<AnalyzeOptions> = {};

  if (typeof gridCandidate === "string") {
    const g = gridCandidate.toLowerCase().replace(/\s+/g, "");
    if (g === "16x16" || g === "32x32" || g === "48x48") {
      normalized.gridSize = g as GridSizePreset;
    }
  }

  if (typeof colorsCandidate === "number") {
    if (colorsCandidate === 8 || colorsCandidate === 16 || colorsCandidate === 24) {
      normalized.maxColors = colorsCandidate as MaxColorsPreset;
    }
  } else if (typeof colorsCandidate === "string") {
    const n = Number(colorsCandidate);
    if (n === 8 || n === 16 || n === 24) {
      normalized.maxColors = n as MaxColorsPreset;
    }
  }

  // 아무 것도 정규화 못 했으면 null 처리(불필요한 options 전송 방지)
  if (!normalized.gridSize && !normalized.maxColors) return null;
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

  // 외부 signal(Analyze.jsx AbortController) 연동
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // 타임아웃 signal 연동
  tSignal.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      if (isJson) {
        try {
          const data = await res.json();
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
        message: "서버 응답이 JSON이 아닙니다.",
      } satisfies NormalizedApiError;
    }

    const data = (await res.json()) as T;
    return data;
  } catch (err: any) {
    if (err?.name === "AbortError") {
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

/**
 * 이미지 파일로 가이드 분석: /api/guide/analyze
 * H4 목적: 옵션을 서버로 전달하고, 서버 응답 meta에 저장된 값을 기반으로 표시할 수 있게 만든다.
 *
 * - options 필드(JSON): 기존/현 구조 호환
 * - grid_size / max_colors 필드: 서버가 Form(...)으로 받는 방식 호환
 */
export async function analyzeGuide(
  imageFile: File,
  options?: unknown,
  signal?: AbortSignal
): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile);

  const normalized = normalizeAnalyzeOptions(options);

  // 1) 기존 방식: options JSON 문자열 전달
  if (normalized) {
    form.append("options", JSON.stringify(normalized));
  }

  // 2) 호환 방식: 개별 Form 필드도 같이 전달
  if (normalized?.gridSize) {
    form.append("grid_size", normalized.gridSize);
  }
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
