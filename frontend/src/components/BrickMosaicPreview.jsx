import { useMemo, useState } from "react";

/**
 * guide에서 가능한 여러 필드명을 흡수해서
 * (x,y,colorHex) 형태로 렌더 가능한 데이터로 정규화
 */
function pickGridSize(guide) {
  const w =
    guide?.meta?.gridWidth ??
    guide?.meta?.width ??
    guide?.gridWidth ??
    guide?.width ??
    16;

  const h =
    guide?.meta?.gridHeight ??
    guide?.meta?.height ??
    guide?.gridHeight ??
    guide?.height ??
    16;

  return { w: Number(w) || 16, h: Number(h) || 16 };
}

function pickColorHex(b) {
  return b?.colorHex ?? b?.hex ?? b?.color ?? b?.fill ?? "#E5E7EB";
}

/**
 * ✅ bricks 우선 → 없으면 groups를 복원
 * - groups[].bricks(기존)
 * - groups[].cells(row/좌표) (추가)
 */
function pickBricks(guide, w, h) {
  const direct =
    guide?.bricks ??
    guide?.mosaic?.bricks ??
    guide?.result?.bricks ??
    guide?.meta?.bricks;

  if (Array.isArray(direct) && direct.length > 0) return direct;

  const groups = Array.isArray(guide?.groups) ? guide.groups : [];
  if (groups.length === 0) return [];

  // 1) 기존: groups[].bricks
  const fromGroups = groups.flatMap((g) => (Array.isArray(g?.bricks) ? g.bricks : []));
  if (fromGroups.length > 0) return fromGroups;

  // 2) 추가: groups[].cells 등 row 데이터 → (x,y,colorHex)로 복원
  const restored = [];

  for (let gi = 0; gi < groups.length; gi += 1) {
    const g = groups[gi];

    const yRaw = g?.y ?? g?.rowIndex ?? g?.row ?? gi;
    const y = Number(yRaw);
    if (!Number.isFinite(y) || y < 0 || y >= h) continue;

    const cells =
      g?.cells ?? g?.rowCells ?? g?.pixels ?? g?.items ?? g?.data ?? null;

    if (!Array.isArray(cells) || cells.length === 0) continue;

    // A) row 배열: ["#RRGGBB", ...]
    if (typeof cells[0] === "string") {
      for (let x = 0; x < Math.min(w, cells.length); x += 1) {
        const colorHex = cells[x];
        if (!colorHex) continue;
        restored.push({ x, y, colorHex });
      }
      continue;
    }

    // B) 객체 배열: [{x, hex/color}, ...]
    for (let ci = 0; ci < cells.length; ci += 1) {
      const c = cells[ci];

      const xRaw = c?.x ?? c?.col ?? c?.column ?? ci;
      const x = Number(xRaw);
      const cy = Number(c?.y ?? y);

      if (!Number.isFinite(x) || !Number.isFinite(cy)) continue;
      if (x < 0 || cy < 0 || x >= w || cy >= h) continue;

      const colorHex =
        c?.colorHex ?? c?.hex ?? c?.color ?? c?.fill ?? c?.value ?? "#E5E7EB";

      restored.push({ x, y: cy, colorHex });
    }
  }

  return restored;
}

export default function BrickMosaicPreview({ guide }) {
  const [cell, setCell] = useState(14);

  const { w, h } = useMemo(() => pickGridSize(guide), [guide]);
  const bricks = useMemo(() => pickBricks(guide, w, h), [guide, w, h]);

  const cells = useMemo(() => {
    const arr = new Array(w * h).fill("#F3F4F6");
    for (const b of bricks) {
      const x = Number(b?.x);
      const y = Number(b?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      arr[y * w + x] = pickColorHex(b);
    }
    return arr;
  }, [bricks, w, h]);

  const hasData = bricks.length > 0;

  return (
    <section className="result-section">
      <div className="mosaic-head">
        <h3 className="result-section-title">모자이크 프리뷰</h3>

        <div className="mosaic-controls">
          <span className="mosaic-meta">
            {w}×{h} · {w * h} cells · filled {bricks.length}
          </span>

          <label className="mosaic-zoom">
            <span>확대</span>
            <input
              type="range"
              min="8"
              max="22"
              value={cell}
              onChange={(e) => setCell(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      {!hasData ? (
        <div className="result-placeholder">
          프리뷰 데이터가 아직 없습니다. (API 응답에 bricks 또는 groups row 데이터가 포함되면 자동 표시됩니다)
        </div>
      ) : (
        <div
          className="mosaic-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${w}, ${cell}px)`,
            gridTemplateRows: `repeat(${h}, ${cell}px)`,
            "--cell": `${cell}px`,
          }}
        >
          {cells.map((c, i) => (
            <div
              key={i}
              className="mosaic-cell"
              style={{
                background: c,
                width: `${cell}px`,
                height: `${cell}px`,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
