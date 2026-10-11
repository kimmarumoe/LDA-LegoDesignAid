// 샘플 목록과 분석 화면이 같은 완성된 가이드 데이터를 사용합니다.
const COLOR_NAMES = {
  "#000000": "검정", "#FACC15": "노랑", "#FFFFFF": "흰색",
  "#DC2626": "빨강", "#0F172A": "밤하늘", "#334155": "건물",
};

function createGuide(width, height, pixel) {
  const bricks = [];
  const paletteMap = new Map();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const hex = pixel(x, y);
      if (!hex) continue;
      bricks.push({ id: `${x},${y}:1x1`, x, y, z: 0, type: "1x1", width: 1, height: 1, hex, color: COLOR_NAMES[hex] });
      const item = paletteMap.get(hex) ?? { hex, color: hex, name: COLOR_NAMES[hex], count: 0, types: ["1x1"] };
      item.count += 1;
      paletteMap.set(hex, item);
    }
  }
  const steps = [];
  for (let y = 0; y < height; y += 2) {
    const delta = bricks.filter((b) => b.y >= y && b.y < y + 2);
    if (!delta.length) continue;
    const index = steps.length + 1;
    steps.push({ id: `S1-STEP-${index}`, sectionId: "S1", index, title: `${index}단계`, description: `${y + 1}~${Math.min(y + 2, height)}행을 왼쪽부터 배치하세요.`, bricks: delta });
  }
  return {
    schemaVersion: 1,
    summary: { totalBricks: bricks.length, uniqueTypes: paletteMap.size, difficulty: width === 16 ? "초급" : "중급", estimatedTime: width === 16 ? "30~45분" : "45~90분" },
    bricks, palette: [...paletteMap.values()], groups: [], steps,
    sections: [{ id: "S1", name: "전체", bounds: { x: 0, y: 0, w: width, h: height } }],
    meta: { width, height, gridSize: `${width}x${height}`, createdAt: "2025-12-07T00:00:00Z", source: "sample" },
  };
}

export const SAMPLE_GUIDE_PRESETS = {
  "smile-16": createGuide(16, 16, (x, y) => {
    if ((x - 7.5) ** 2 + (y - 7.5) ** 2 > 49) return null;
    if ((y === 5 && (x === 5 || x === 10)) || (y === 10 && x >= 5 && x <= 10) || (y === 9 && (x === 4 || x === 11))) return "#000000";
    return "#FACC15";
  }),
  "mario-hat-32": createGuide(32, 32, (x, y) => {
    if (y >= 8 && y <= 19 && x >= 7 && x <= 24) {
      if (x >= 12 && x <= 19 && y >= 10 && y <= 16) {
        return x === 13 || x === 18 || (y === 11 && (x === 14 || x === 17)) || (y === 12 && (x === 15 || x === 16)) ? "#DC2626" : "#FFFFFF";
      }
      return "#DC2626";
    }
    return y >= 20 && y <= 23 && x >= 5 && x <= 28 ? "#DC2626" : null;
  }),
  "skyline-32x16": createGuide(32, 16, (x, y) => {
    const roof = [8, 5, 9, 3, 7, 6, 10, 4][Math.floor(x / 4)];
    if (y < roof) return "#0F172A";
    return x % 4 === 1 && y > roof && y % 3 === 0 ? "#FACC15" : "#334155";
  }),
};

export const SAMPLE_GUIDE = SAMPLE_GUIDE_PRESETS["smile-16"];
