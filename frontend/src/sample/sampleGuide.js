// frontend/src/sample/sampleGuide.js

// LDA Analyze 페이지용 샘플 브릭 가이드 데이터 
// - 실제 AI/백엔드 붙이기 전에 UI/데이터 흐름을 검증하기 위한 용도
// - 백엔드 응답도 이 구조를 따르도록 설계

export const SAMPLE_GUIDE = {
  // 가이드 요약 정보 (GuideSummary)
  summary: {
    totalBricks: 9,
    uniqueTypes: 2,          // 예전 distinctColors
    difficulty: "초급",
    estimatedTime: "30~45분", // PRESET에서 쓰던 값 재사용
  },

  // 단계별 조립 정보 (GuideStep[])
  groups: [
    {
      id: 1,
      title: "스마일 16x16 전체 조립",
      description:
        "AI 연동 전 Analyze 페이지 UI 테스트용 스마일 모자이크 샘플입니다.",
      bricks: [
        // 눈 2개 (검정)
        { x: 4, y: 4, z: 0, color: "#000000", type: "1x1" },
        { x: 11, y: 4, z: 0, color: "#000000", type: "1x1" },

        // 입 (검정)
        { x: 7, y: 9, z: 0, color: "#000000", type: "1x1" },

        // 주변 노란색 (배경 느낌)
        { x: 5, y: 5, z: 0, color: "#facc15", type: "1x1" },
        { x: 6, y: 6, z: 0, color: "#facc15", type: "1x1" },
        { x: 8, y: 6, z: 0, color: "#facc15", type: "1x1" },
        { x: 9, y: 5, z: 0, color: "#facc15", type: "1x1" },
        { x: 6, y: 8, z: 0, color: "#facc15", type: "1x1" },
        { x: 8, y: 8, z: 0, color: "#facc15", type: "1x1" },
      ],
    },
  ],

  // 색상 팔레트 정보 (PaletteItem[])
  palette: [
    {
      color: "#facc15",
      name: "Yellow",
      count: 6,
      types: ["1x1"],
    },
    {
      color: "#000000",
      name: "Black",
      count: 3,
      types: ["1x1"],
    },
  ],

  // 부가 메타 정보 (GuideMeta)
  meta: {
    width: 16,
    height: 16,
    createdAt: "2025-12-07T00:00:00Z",
    source: "sample",
  },
};

// 샘플 목록/프리뷰용 PRESET 데이터
// - Sample 페이지나 갤러리에서 "간단 카드" 형태로 요약 보여줄 때 사용
export const SAMPLE_GUIDE_PRESETS = {
  "smile-16": {
    summary: {
      totalBricks: SAMPLE_GUIDE.summary.totalBricks,
      uniqueTypes: SAMPLE_GUIDE.summary.uniqueTypes,
      difficulty: SAMPLE_GUIDE.summary.difficulty,
      estimatedTime: SAMPLE_GUIDE.summary.estimatedTime,
    },
    groups: [
      {
        name: "기본 브릭",
        items: ["1x1 노랑 6개"],
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
