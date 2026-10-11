import { SAMPLE_GUIDE_PRESETS } from "./sampleGuide.js";

// frontend/src/sample/sampleMosaics.js

// 별도 이미지가 없으면 샘플 가이드의 브릭 데이터로 썸네일을 렌더링합니다.

export const SAMPLE_MOSAICS = [
  {
    id: "smile-16",
    title: "스마일 16x16 모자이크",
    description: "입문용으로 가볍게 만들어볼 수 있는 스마일 이모티콘 모자이크입니다.",
    width: 16,
    height: 16,
    brickCount: SAMPLE_GUIDE_PRESETS["smile-16"].summary.totalBricks,
    difficulty: "입문",
    tags: ["캐릭터", "입문"],
    thumbnail: null,
  },
  {
    id: "mario-hat-32",
    title: "슈퍼마리오 모자 32x32",
    description: "빨간 모자 심볼을 중심으로 한 32x32 사이즈의 마리오 모자이크입니다.",
    width: 32,
    height: 32,
    brickCount: SAMPLE_GUIDE_PRESETS["mario-hat-32"].summary.totalBricks,
    difficulty: "중급",
    tags: ["게임", "컬러 포인트"],
    thumbnail: null,
  },
  {
    id: "skyline-32x16",
    title: "도시 스카이라인 32x16",
    description: "밤하늘과 건물 실루엣이 강조된 와이드 비율 스카이라인 샘플입니다.",
    width: 32,
    height: 16,
    brickCount: SAMPLE_GUIDE_PRESETS["skyline-32x16"].summary.totalBricks,
    difficulty: "중급",
    tags: ["풍경", "와이드"],
    thumbnail: null,
  },
];
