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
