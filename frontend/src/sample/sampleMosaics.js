// frontend/src/sample/sampleMosaics.js

// TODO: 썸네일 이미지는 나중에 public/samples/... 경로에 추가 예정
// 지금은 thumbnail이 null이어도 UI는 placeholder를 보여줍니다.

export const SAMPLE_MOSAICS = [
  {
    id: "smile-16",
    title: "스마일 16x16 모자이크",
    description: "입문용으로 가볍게 만들어볼 수 있는 스마일 이모티콘 모자이크입니다.",
    width: 16,
    height: 16,
    brickCount: 160,
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
    brickCount: 420,
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
    brickCount: 260,
    difficulty: "중급",
    tags: ["풍경", "와이드"],
    thumbnail: null,
  },
];
