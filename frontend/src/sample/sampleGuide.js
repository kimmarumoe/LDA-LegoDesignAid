// frontend/src/sample/sampleGuide.js

// ✅ LDA Analyze 페이지용 샘플 브릭 가이드 데이터
// - 실제 AI/백엔드 붙이기 전에 UI/데이터 흐름을 검증하기 위한 용도
// - 나중에 백엔드 응답도 이 구조를 최대한 따르도록 설계하면 좋음

export const SAMPLE_GUIDE = {
  // 전체 모자이크 크기 (stud 기준)
  width: 16,
  height: 16,

  // 요약 정보
  summary: {
    title: "스마일 16x16 모자이크 (샘플)",
    totalBricks: 9,
    distinctColors: 2,
    difficulty: "초급",
    notes: "AI 연동 전, Analyze 페이지 UI 테스트용 샘플 데이터입니다.",
    colors: [
      { code: "#facc15", name: "Yellow", count: 6 },
      { code: "#000000", name: "Black", count: 3 },
    ],
  },

  // 개별 브릭 정보
  // 좌표계: (0,0)을 좌상단 기준으로 가정
  bricks: [
    // 눈 2개 (검정)
    { id: "b-1", x: 4,  y: 4,  z: 0, color: "#000000", colorName: "Black",  type: "1x1" },
    { id: "b-2", x: 11, y: 4,  z: 0, color: "#000000", colorName: "Black",  type: "1x1" },

    // 입 (검정)
    { id: "b-3", x: 7,  y: 9,  z: 0, color: "#000000", colorName: "Black",  type: "1x1" },

    // 주변 노란색 (배경 느낌)
    { id: "b-4", x: 5,  y: 5,  z: 0, color: "#facc15", colorName: "Yellow", type: "1x1" },
    { id: "b-5", x: 6,  y: 6,  z: 0, color: "#facc15", colorName: "Yellow", type: "1x1" },
    { id: "b-6", x: 8,  y: 6,  z: 0, color: "#facc15", colorName: "Yellow", type: "1x1" },
    { id: "b-7", x: 9,  y: 5,  z: 0, color: "#facc15", colorName: "Yellow", type: "1x1" },
    { id: "b-8", x: 6,  y: 8,  z: 0, color: "#facc15", colorName: "Yellow", type: "1x1" },
    { id: "b-9", x: 8,  y: 8,  z: 0, color: "#facc15", colorName: "Yellow", type: "1x1" },
  ],
};
export const SAMPLE_GUIDE_PRESETS = {
  // 샘플 페이지에서 사용할 기본 샘플 id
  // 예: Sample.jsx / sampleMosaics.js 에서 "smile-16" 이라는 id를 쓴다고 가정
  "smile-16": {
    summary: {
      // 위에 있는 SAMPLE_GUIDE.summary 값을 재활용해도 되고,
      // UI에 맞게 별도 값으로 둬도 됨
      totalBricks: SAMPLE_GUIDE.summary.totalBricks,
      uniqueTypes: SAMPLE_GUIDE.summary.distinctColors,
      difficulty: SAMPLE_GUIDE.summary.difficulty,
      estimatedTime: "30~45분",
    },
    groups: [
      {
        name: "기본 브릭",
        items: ["2x2 노랑 4개", "1x1 노랑 2개"],
      },
      {
        name: "포인트 색상",
        items: ["1x1 검정 3개 (눈/입)"],
      },
    ],
    steps: [
      {
        step: 1,
        title: "1단계: 바닥 윤곽 잡기",
        hint: "16x16 베이스 가운데를 기준으로 얼굴이 들어갈 영역을 대략 잡아 주세요.",
      },
      {
        step: 2,
        title: "2단계: 눈/입 배치하기",
        hint: "검정 1x1 브릭 3개를 사용해 양쪽 눈과 입 위치를 먼저 고정합니다.",
      },
      {
        step: 3,
        title: "3단계: 노란색 채우기",
        hint: "나머지 빈 자리를 노란색 브릭으로 채워 얼굴 형태를 완성합니다.",
      },
    ],
    tips: [
      "눈과 입 위치를 먼저 고정해두고 주변을 채우면 모양 맞추기가 쉽습니다.",
      "작은 브릭은 마지막에 한 번에 배치하면 손이 덜 꼬입니다.",
    ],
  },
};