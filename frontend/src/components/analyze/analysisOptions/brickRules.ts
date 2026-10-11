// frontend/src/components/analysisOptions/brickRules.ts

export type BrickMode = "auto" | "manual";

/**
 * UI에서 제공하는 브릭 규격(현재 화면 기준)
 * - 필요하면 여기만 늘리면 됨(OCP)
 */
export const BRICK_SIZES = [
  "1x1",
  "1x2",
  "1x3",
  "1x4",
  "1x5",
  "2x2",
  "2x3",
  "2x4",
  "2x5",
] as const;

export type BrickSize = (typeof BRICK_SIZES)[number];

export const DEFAULT_ALLOWED_BRICKS: BrickSize[] = [
  "1x1",
  "1x2",
  "1x3",
  "2x2",
  "2x3",
];

/**
 * allowedBricks 정규화
 * - manual에서도 1x1은 강제 포함(UX 규칙)
 * - auto면 DEFAULT로 고정(선택값이 와도 무시)
 */
export function normalizeAllowedBricks(
  mode: BrickMode,
  selected: string[] | undefined | null
): BrickSize[] {
  const safeSelected = Array.isArray(selected) ? selected : [];

  if (mode === "auto") {
    return [...DEFAULT_ALLOWED_BRICKS];
  }

  const filtered = safeSelected.filter((b) =>
    (BRICK_SIZES as readonly string[]).includes(b)
  ) as BrickSize[];

  const set = new Set<BrickSize>(filtered);
  set.add("1x1"); // 1x1 필수

  return Array.from(set);
}
