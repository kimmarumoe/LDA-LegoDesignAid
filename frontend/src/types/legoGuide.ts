// frontend/src/types/legoGuide.ts

// 브릭 식별자 타입 (나중에 문자열 포맷을 바꿔도, 타입 이름은 그대로 쓸 수 있게 분리)
export type BrickId = string;

// 레고 브릭 한 개에 대한 기본 정보
export interface Brick {
  id: BrickId;   // 고유 식별자 
  x: number;     // 가로 좌표
  y: number;     // 세로 좌표
  z: number;     // 높이 (1차 버전은 항상 0, 추후 2.5D/3D 확장용)
  color: string; // 색상 
  type: string;  // 브릭 종류 (예: "1x1", "2x2", "2x4" 등)
}

// 조립 가이드에 대한 메타데이터
export interface GuideMeta {
  title?: string;             // 디자인 제목
  width?: number;             // 모자이크 가로 크기 (그리드 단위)
  height?: number;            // 모자이크 세로 크기 (그리드 단위)
  language?: "ko" | "en";     // 설명 언어 
}

// AI 서버로 보내는 조립 가이드 생성 요청
export interface GuideRequest {
  bricks: Brick[];       // 모자이크에 사용되는 모든 브릭
  meta?: GuideMeta;      // 부가 정보 (없어도 동작, 있으면 더 좋은 가이드 생성 가능)
}

// 조립 과정의 한 단계 정보
export interface GuideStep {
  step: number;          // 단계 번호 (1, 2, 3, ...)
  title: string;         // 단계 제목 (예: "1단계: 바닥줄 먼저 깔기")
  description: string;   // 단계 설명 문장
  brickIds: BrickId[];   // 이 단계에서 사용할 브릭들의 id 목록
}

// 가이드 전체에 대한 간단 통계 정보
export interface GuideStats {
  totalBricks: number;   // 총 브릭 개수
  totalSteps: number;    // 총 단계 수
}

// AI 서버에서 돌아오는 최종 조립 가이드 응답
export interface GuideResponse {
  steps: GuideStep[];    // 단계별 가이드 목록
  summary?: string;      // 전체 요약 문장 
  stats?: GuideStats;    // 통계 정보 
}
