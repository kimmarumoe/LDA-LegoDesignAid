export const BRICK_TYPES = [
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

export type BrickType = (typeof BRICK_TYPES)[number];

// 브릭 식별자 타입 (나중에 문자열 포맷을 바꿔도, 타입 이름은 그대로 쓸 수 있게 분리)
export type BrickId = string;

// 레고 브릭 한 개에 대한 기본 정보
export interface Brick {
  id: BrickId; // 고유 식별자
  x: number; // 가로 좌표
  y: number; // 세로 좌표
  z: number; // 높이 (1층이면 0)
  type: BrickType;
  color: string; // hex
  colorName?: string; // human-readable
}

// 팔레트 요약 정보
export interface PaletteItem {
  id: string;
  name: string;
  hex: string;
  count: number;
}

// 분석 결과가 반환하는 메타 정보
export interface GuideMeta {
  width?: number;
  height?: number;
  gridWidth?: number;
  gridHeight?: number;
  colorLimit?: number;
  brickTypes?: BrickType[];
  brickMode?: "auto" | "manual";
  requestOptions?: unknown;
}

// 조립 단계/가이드 응답
export interface GuideResponse {
  schemaVersion?: number;
  analysisId?: string;
  meta?: GuideMeta;
  palette?: PaletteItem[];
  bricks?: Brick[];
  sections?: unknown[];
  steps?: unknown[];
}

// 이미지 분석 옵션(체크박스/옵션 UI가 만드는 값)
export type GridSizePreset = "16x16" | "32x32" | "48x48";

// 커스텀 그리드: "숫자x숫자" (범위 검증은 runtime에서 수행)
export type GridSize = GridSizePreset | `${number}x${number}`;

export interface AnalyzeOptions {
  gridSize: GridSize;
  colorLimit: 0 | 8 | 16 | 24;
  brickTypes: BrickType[];

  brickMode?: "auto" | "manual";
}

export interface BuildStepsRequest {
  analysisId: string;
  sectionMode: "single" | "rows" | "quadrants";
  rowsPerSection: number;
  rowsPerStep: number;
  maxPlacementsPerStep: number;
  optimize?: boolean;
}

export interface BuildStepsResponse {
  analysisId: string;
  sections: unknown[];
  steps: unknown[];
  bricks: Brick[];
  meta: {
    width: number;
    height: number;
    sectionMode: string;
    rowsPerSection: number;
    rowsPerStep: number;
    maxPlacementsPerStep: number;
    optimize: boolean;
  };
}
