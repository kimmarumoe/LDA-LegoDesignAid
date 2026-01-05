import { useEffect, useMemo, useRef, useState } from "react";

/*
  guide에서 가능한 여러 필드명을 흡수해서
  (x, y, colorHex) 형태로 렌더 가능한 데이터로 정규화한다
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

/*
  bricks 우선 사용 → 없으면 groups 기반으로 복원한다

  지원 케이스
  - guide.bricks / guide.mosaic.bricks / guide.result.bricks ...
  - groups[].bricks
  - groups[].cells(행 데이터) : ["#RRGGBB", ...] 또는 [{x, colorHex}, ...]
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

  const fromGroups = groups.flatMap((g) =>
    Array.isArray(g?.bricks) ? g.bricks : []
  );
  if (fromGroups.length > 0) return fromGroups;

  const restored = [];

  for (let gi = 0; gi < groups.length; gi += 1) {
    const g = groups[gi];

    const yRaw = g?.y ?? g?.rowIndex ?? g?.row ?? gi;
    const y = Number(yRaw);
    if (!Number.isFinite(y) || y < 0 || y >= h) continue;

    const cells =
      g?.cells ?? g?.rowCells ?? g?.pixels ?? g?.items ?? g?.data ?? null;

    if (!Array.isArray(cells) || cells.length === 0) continue;

    if (typeof cells[0] === "string") {
      for (let x = 0; x < Math.min(w, cells.length); x += 1) {
        const colorHex = cells[x];
        if (!colorHex) continue;
        restored.push({ x, y, colorHex });
      }
      continue;
    }

    for (let ci = 0; ci < cells.length; ci += 1) {
      const c = cells[ci];

      const xRaw = c?.x ?? c?.col ?? c?.column ?? ci;
      const x = Number(xRaw);
      const cy = Number(c?.y ?? y);

      if (!Number.isFinite(x) || !Number.isFinite(cy)) continue;
      if (x < 0 || cy < 0 || x >= w || cy >= h) continue;

      const colorHex =
        c?.colorHex ??
        c?.hex ??
        c?.color ??
        c?.fill ??
        c?.value ??
        "#E5E7EB";

      restored.push({ x, y: cy, colorHex });
    }
  }

  return restored;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/*
  모자이크 영역의 "실제 내부 폭"을 계산한다
  clientWidth는 padding을 포함하므로, padding을 빼서 그리드가 들어갈 수 있는 폭을 만든다
*/
function getInnerWidth(el) {
  if (!el) return 0;
  const style = window.getComputedStyle(el);
  const pl = parseFloat(style.paddingLeft) || 0;
  const pr = parseFloat(style.paddingRight) || 0;
  return el.clientWidth - pl - pr;
}

export default function BrickMosaicPreview({ guide }) {
  const viewportRef = useRef(null);

  const MIN_CELL = 4;
  const HARD_MAX = 28;
  const DEFAULT_CELL = 10;

  const { w, h } = useMemo(() => pickGridSize(guide), [guide]);
  const bricks = useMemo(() => pickBricks(guide, w, h), [guide, w, h]);

  const [maxCell, setMaxCell] = useState(HARD_MAX);
  const [cell, setCell] = useState(DEFAULT_CELL);

  /*
    핵심: 현재 화면(모자이크 뷰포트)의 폭을 재서,
    w칸이 절대 화면 밖으로 나가지 않는 최대 cell(px)을 계산한다
  */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const innerW = getInnerWidth(el);
      if (!innerW || !w) return;

      const visibleW = window.visualViewport?.width ?? window.innerWidth ?? innerW;
      const safeW = Math.min(innerW, visibleW);

      const byWidth = Math.floor(safeW / w);
      const nextMax = clamp(byWidth, MIN_CELL, HARD_MAX);

      setMaxCell(nextMax);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [w]);

  /*
    maxCell이 바뀌면(모바일/데스크탑 전환, 회전, 창 크기 변경 등)
    현재 cell 값이 최대를 넘지 않도록 자동으로 보정한다
  */
  useEffect(() => {
    setCell((prev) => clamp(prev, MIN_CELL, maxCell));
  }, [maxCell]);

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
            {w}×{h} · {w * h}칸 · 채움 {bricks.length}칸
          </span>

          <label className="mosaic-zoom">
            <span className="mosaic-zoom-label">확대</span>
            <input
              type="range"
              min={MIN_CELL}
              max={maxCell}
              value={cell}
              onChange={(e) =>
                setCell(clamp(Number(e.target.value), MIN_CELL, maxCell))
              }
            />
            <span className="mosaic-zoom-value">{cell}px</span>
          </label>
        </div>
      </div>

      {!hasData ? (
        <div className="result-placeholder">프리뷰 데이터가 아직 없습니다.</div>
      ) : (
        <div ref={viewportRef} className="mosaic-viewport">
          <div
            className="mosaic-grid"
            style={{
              "--cell": `${cell}px`,
              gridTemplateColumns: `repeat(${w}, var(--cell))`,
              gridTemplateRows: `repeat(${h}, var(--cell))`,
            }}
          >
            {cells.map((c, i) => (
              <div key={i} className="mosaic-cell" style={{ background: c }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
