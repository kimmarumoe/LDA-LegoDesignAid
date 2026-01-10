// frontend/src/utils/analyzeOptions.ts
import type { AnalyzeOptions, BrickType } from "../types/legoGuide";
import { BRICK_TYPES } from "../types/legoGuide";

/*
  이 파일은 “분석 옵션 규칙”의 단일 기준(SSOT)입니다.

  화면(Analyze.jsx)과 API 요청(guideClient.ts)이
  서로 다른 규칙을 쓰기 시작하면,
  작은 변경에도 결과가 다르게 나오거나 오류가 생길 수 있습니다.

  그래서 허용값, 보정 규칙, 브릭 타입 필터 규칙을
  여기 한 곳에만 두고, 다른 파일들은 여기 함수를 가져다 씁니다.
*/

export const GRID_PRESETS = ["16x16", "32x32", "48x48"] as const;
export const COLOR_LIMIT_PRESETS = [0, 8, 16, 24] as const;

// 자동 모드에서 사용할 기본 브릭 후보(필요하면 여기만 바꾸면 됨)
export const AUTO_BRICK_PRESET: BrickType[] = ["1x1", "1x2", "1x3", "2x2", "2x3"];

type BrickModePreset = "auto" | "manual";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/*
  입력값이 “그냥 값”으로 오든,
  “이벤트(e.target.value)”로 오든,
  같은 방식으로 읽기 위한 보조 함수입니다.
*/
function readInputValue(input: unknown): unknown {
  if (isRecord(input) && isRecord(input.target)) return input.target.value;
  return input;
}

/*
  BRICK_TYPES가 문자열 배열이든, {value} 객체 배열이든
  모두 안전하게 “문자열 목록”으로 바꿔서 사용합니다.
*/
function getAllowedBrickTypeSet(): Set<string> {
  const list = Array.isArray(BRICK_TYPES) ? BRICK_TYPES : [];
  const normalized = list
    .map((b: any) => (typeof b === "string" ? b : b?.value))
    .filter(Boolean)
    .map((s: any) => String(s).trim())
    .filter(Boolean);

  return new Set(normalized);
}

/*
  gridSize를 “허용값이면 반환, 아니면 null”로 처리합니다.
  (API 쪽에서는 기본값을 강제하지 않고, 유효할 때만 넣는 방식이 안전합니다.)
*/
export function acceptGridSizeOrNull(v: unknown): AnalyzeOptions["gridSize"] | null {
  if (typeof v !== "string") return null;
  const g = v.toLowerCase().replace(/\s+/g, "");
  return (GRID_PRESETS as readonly string[]).includes(g) ? (g as AnalyzeOptions["gridSize"]) : null;
}

/*
  colorLimit도 “허용값이면 반환, 아니면 null”입니다.
  0은 “제한 없음”이라서 유효한 값입니다.
*/
export function acceptColorLimitOrNull(n: number): AnalyzeOptions["colorLimit"] | null {
  return (COLOR_LIMIT_PRESETS as readonly number[]).includes(n)
    ? (n as AnalyzeOptions["colorLimit"])
    : null;
}

/*
  brickMode는 auto/manual만 허용합니다.
  예전에 menual 같은 오타가 들어왔던 기록이 있으면 manual로 보정합니다.
*/
export function toBrickModeOrNull(v: unknown): BrickModePreset | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s === "auto") return "auto";
  if (s === "manual") return "manual";
  if (s === "menual") return "manual";
  return null;
}

/*
  UI에서 쓰는 “안전한 값 반환” 버전들입니다.
  사용자가 이상한 값을 넣어도 기본값으로 되돌려서 UI/요청이 안정적으로 동작하게 합니다.
*/
export function toSafeGridSize(input: unknown): AnalyzeOptions["gridSize"] {
  return acceptGridSizeOrNull(readInputValue(input)) ?? "16x16";
}

export function toSafeColorLimit(input: unknown): AnalyzeOptions["colorLimit"] {
  const raw = readInputValue(input);
  const n = Number(raw);
  if (!Number.isFinite(n)) return 16;
  return acceptColorLimitOrNull(n) ?? 16;
}

export function toSafeBrickMode(input: unknown): BrickModePreset {
  return toBrickModeOrNull(readInputValue(input)) ?? "manual";
}

/*
  brickTypes는
  - 허용 목록 안에 있는 것만 남기고
  - 중복을 제거하고
  - 1x1은 항상 포함시키는 규칙을 강제합니다.
*/
export function normalizeBrickTypes(list: unknown): BrickType[] {
  const allowed = getAllowedBrickTypeSet();
  const input = Array.isArray(list) ? list : [];

  const filtered = input
    .map((x) => String(x).trim())
    .filter(Boolean)
    .filter((x) => allowed.has(x));

  const unique = Array.from(new Set(filtered)) as BrickType[];

  if (!unique.includes("1x1")) unique.unshift("1x1");
  return unique;
}
