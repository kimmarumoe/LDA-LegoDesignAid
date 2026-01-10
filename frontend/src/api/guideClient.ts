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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

/*
  일정 시간이 지나도 응답이 없으면 요청을 중단시키기 위한 장치다.
  사용자는 "멈춘 것 같은 느낌"을 받지 않게 된다.
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

/*
  예전 오타("menual")가 들어와도 "manual"로 바꿔서 처리한다.
*/
function toBrickModeOrNull(v: unknown): BrickModePreset | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s === "auto") return "auto";
  if (s === "manual") return "manual";
  if (s === "menual") return "manual";
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
  if (n === 0 || n === 8 || n === 16 || n === 24) {
    return n as AnalyzeOptions["colorLimit"];
  }
  return null;
}

/*
  BRICK_TYPES가 문자열 배열일 수도 있고,
  { value: "1x1" } 같은 객체 배열일 수도 있으므로
  둘 다 처리해서 "허용 목록"을 만든다.
*/
function getAllowedBrickValues(): string[] {
  if (!Array.isArray(BRICK_TYPES)) return [];

  return BRICK_TYPES
    .map((b: any) => (typeof b === "string" ? b : b?.value))
    .filter((v: unknown): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());
}

function filterBrickTypes(values: string[]): BrickType[] {
  const allowed = new Set<string>(getAllowedBrickValues());

  const cleaned = values.map((x) => x.trim()).filter(Boolean);
  const filtered = cleaned.filter((x) => allowed.has(x));

  return Array.from(new Set(filtered)) as BrickType[];
}

function ensure1x1(bricks: BrickType[]): BrickType[] {
  if (bricks.includes("1x1")) return bricks;
  return (["1x1", ...bricks] as BrickType[]);
}

/*
  프론트에서 넘어오는 옵션을 "서버가 이해하기 쉬운 형태"로 정리한다.

  왜 필요한가:
  - 필드 이름이 gridSize / grid_size 처럼 달라질 수 있다.
  - 숫자도 문자열로 올 수 있다.
  - brickTypes도 다른 이름으로 올 수 있다.

  결과:
  - 가능한 값만 남기고, 사용할 수 있는 형태로 정리해서 반환한다.
*/
function normalizeAnalyzeOptions(options: unknown): Partial<AnalyzeOptions> | null {
  if (!options) return null;
  if (!isRecord(options)) return null;

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
      normalized.brickTypes = ensure1x1(bricks);
    }
  }

  const hasGrid = typeof normalized.gridSize === "string";
  const hasColors = typeof normalized.colorLimit === "number"; // 0도 포함하기 위해 number로 체크
  const hasBricks = Array.isArray(normalized.brickTypes) && normalized.brickTypes.length > 0;

  /*
    grid/color/brickTypes 중 아무 것도 없으면
    서버에 보낼 "의미 있는 옵션"이 없다고 판단한다.
    (brickMode만 단독으로 보내는 것은 의미가 약하다고 보고 제외)
  */
  if (!hasGrid && !hasColors && !hasBricks) return null;

  return normalized;
}

/*
  서버 요청 공통 함수.
  - 타임아웃 적용
  - JSON 응답인지 확인
  - 실패 시 표준 에러 형태로 변환해서 던짐
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
          // 실패 응답을 JSON으로 읽지 못하면 기본 메시지를 사용한다.
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

  보내는 방식:
  - FormData를 사용한다(이미지 업로드에 적합)
  - options는 JSON 문자열로도 보내고,
    서버가 어떤 이름을 기대하든 맞추기 위해 개별 필드로도 같이 보낸다.
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
      form.append("allowed_bricks", json);
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
