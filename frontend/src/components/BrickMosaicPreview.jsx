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

function pickBricks(guide) {

  const direct =
    guide?.bricks ??
    guide?.mosaic?.bricks ??
    guide?.result?.bricks ??
    guide?.meta?.bricks;

  if (Array.isArray(direct) && direct.length > 0) return direct;

  const fromGroups = Array.isArray(guide?.groups)
    ? guide.groups.flatMap((g) => (Array.isArray(g?.bricks) ? g.bricks : []))
    : [];

  return fromGroups;
}

function pickColorHex(b) {
  return b?.colorHex ?? b?.hex ?? b?.color ?? b?.fill ?? "#E5E7EB";
}

export default function BrickMosaicPreview({ guide }) {
  const [cell, setCell] = useState(14);

  const { w, h } = useMemo(() => pickGridSize(guide), [guide]);
  const bricks = useMemo(() => pickBricks(guide), [guide]);

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
            {w}×{h} · {bricks.length} cells
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
          프리뷰 데이터(bricks)가 아직 없습니다. (API 응답에 bricks가 포함되면 자동 표시됩니다)
        </div>
      ) : (
        <div
          className="mosaic-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${w}, ${cell}px)`,
            gridTemplateRows: `repeat(${h}, ${cell}px)`,
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
