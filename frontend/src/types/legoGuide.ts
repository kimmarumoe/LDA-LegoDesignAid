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
  z: number; // 높이 (1차 버전은 항상 0, 추후 2.5D/3D 확장용)
  color: string; // 색상
  type: BrickType; // 브릭 종류
}

// 조립 가이드에 대한 메타데이터
export interface GuideMeta {
  title?: string; // 디자인 제목
  width?: number; // 모자이크 가로 크기 (그리드 단위)
  height?: number; // 모자이크 세로 크기 (그리드 단위)
  language?: "ko" | "en"; // 설명 언어
}

// AI 서버로 보내는 조립 가이드 생성 요청 (기존 방식 유지)
export interface GuideRequest {
  bricks: Brick[]; // 모자이크에 사용되는 모든 브릭
  meta?: GuideMeta; // 부가 정보
}

// H-3 이미지 분석 옵션(체크박스/옵션 UI가 만드는 값)
export interface AnalyzeOptions {
  gridSize: "16x16" | "32x32" | "48x48";
  colorLimit: 8 | 16 | 24;
  brickTypes: BrickType[];
}

// 타일링 결과 배치 단위(H-3)
export interface Placement {
  id?: BrickId;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  type: BrickType;
}

// 조립 과정의 한 단계 정보 (기존 V1)
export interface GuideStepV1 {
  step: number; // 단계 번호
  title: string; // 단계 제목
  description: string; // 단계 설명 문장
  brickIds: BrickId[]; // 이 단계에서 사용할 브릭들의 id 목록
}

// 조립 과정의 한 단계 정보 (H-3 V2: placements 기반)
export interface GuideStepV2 {
  index: number; // 단계 번호
  title: string;
  description?: string;
  placements: Placement[];
}

// 서버가 V1/V2 중 무엇을 내려줘도 수용
export type GuideStep = GuideStepV1 | GuideStepV2;

// 가이드 전체에 대한 간단 통계 정보 (기존)
export interface GuideStats {
  totalBricks: number;
  totalSteps: number;
}

// 부품 수량(H-3)
// 서버가 BrickType 키를 주로 쓰겠지만, 유연하게 문자열 키도 허용
export type PartsMap = Partial<Record<BrickType, number>> & Record<string, number>;

// AI 서버에서 돌아오는 최종 조립 가이드 응답
export interface GuideResponse {
  steps: GuideStep[]; // 단계별 가이드 목록
  summary?: string; // 전체 요약 문장
  stats?: GuideStats; // 통계 정보

  // H-3 확장 필드
  meta?: GuideMeta;
  brick_types?: BrickType[]; // 서버 정규화 결과
  placements?: Placement[]; // 전체 배치
  parts?: PartsMap; // 타입별 수량
}
