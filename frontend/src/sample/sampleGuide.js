// frontend/src/sample/sampleGuide.js

// LDA Analyze 페이지용 샘플 브릭 가이드 데이터
// - 실제 AI/백엔드 붙이기 전에 UI/데이터 흐름을 검증하기 위한 용도
// - 백엔드 응답도 이 구조를 따르도록 설계

const SMILE_BRICKS = [
  { x: 4, y: 4, z: 0, color: "#000000", type: "1x1" },
  { x: 11, y: 4, z: 0, color: "#000000", type: "1x1" },
  { x: 7, y: 9, z: 0, color: "#000000", type: "1x1" },

  { x: 5, y: 5, z: 0, color: "#facc15", type: "1x1" },
  { x: 6, y: 6, z: 0, color: "#facc15", type: "1x1" },
  { x: 8, y: 6, z: 0, color: "#facc15", type: "1x1" },
  { x: 9, y: 5, z: 0, color: "#facc15", type: "1x1" },
  { x: 6, y: 8, z: 0, color: "#facc15", type: "1x1" },
  { x: 8, y: 8, z: 0, color: "#facc15", type: "1x1" },
];

export const SAMPLE_GUIDE = {
  summary: {
    totalBricks: SMILE_BRICKS.length,
    uniqueTypes: 2,
    difficulty: "초급",
    estimatedTime: "30~45분",
  },

  bricks: SMILE_BRICKS,

  groups: [
    {
      id: 1,
      title: "스마일 16x16 전체 조립",
      description: "AI 연동 전 Analyze 페이지 UI 테스트용 스마일 모자이크 샘플입니다.",
      
      bricks: SMILE_BRICKS,
    },
  ],

  //  BrickGuidePanel에서 p.colorHex / p.type 을 쓰는 구조면 아래 형태가 더 안전
  palette: [
    {
      color: "#FACC15",
      colorHex: "#facc15",
      count: 6,
      type: "1x1",
      name: "Yellow",
    },
    {
      color: "#000000",
      colorHex: "#000000",
      count: 3,
      type: "1x1",
      name: "Black",
    },
  ],

  meta: {
    width: 16,
    height: 16,
    createdAt: "2025-12-07T00:00:00Z",
    source: "sample",
  },
};

export const SAMPLE_GUIDE_PRESETS = {
  "smile-16": {
    summary: {
      totalBricks: SAMPLE_GUIDE.summary.totalBricks,
      uniqueTypes: SAMPLE_GUIDE.summary.uniqueTypes,
      difficulty: SAMPLE_GUIDE.summary.difficulty,
      estimatedTime: SAMPLE_GUIDE.summary.estimatedTime,
    },
    groups: [
      { name: "기본 브릭", items: ["1x1 노랑 6개"] },
      { name: "포인트 색상", items: ["1x1 검정 3개 (눈/입)"] },
    ],
    steps: [
      { step: 1, title: "1단계: 바닥 윤곽 잡기", hint: "16x16 베이스 가운데를 기준으로 얼굴이 들어갈 영역을 대략 잡아 주세요." },
      { step: 2, title: "2단계: 눈/입 배치하기", hint: "검정 1x1 브릭 3개를 사용해 양쪽 눈과 입 위치를 먼저 고정합니다." },
      { step: 3, title: "3단계: 노란색 채우기", hint: "나머지 빈 자리를 노란색 브릭으로 채워 얼굴 형태를 완성합니다." },
    ],
    tips: [
      "눈과 입 위치를 먼저 고정해두고 주변을 채우면 모양 맞추기가 쉽습니다.",
      "작은 브릭은 마지막에 한 번에 배치하면 손이 덜 꼬입니다.",
    ],
  },
};
