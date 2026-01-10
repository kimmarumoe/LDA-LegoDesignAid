// frontend/src/components/BrickPalettePanel.jsx
import { useMemo, useState } from "react";

// 기본 샘플 팔레트 데이터
// - 1차 버전에서는 샘플로만 사용
// - 나중에 props.palette로 실제 분석 결과를 넘겨서 교체 가능
const DEFAULT_PALETTE = [
  { id: "white", name: "화이트", hex: "#F9FAFB", count: 120 },
  { id: "light-gray", name: "라이트 그레이", hex: "#E5E7EB", count: 80 },
  { id: "dark-gray", name: "다크 그레이", hex: "#9CA3AF", count: 48 },
  { id: "black", name: "블랙", hex: "#111827", count: 32 },
  { id: "yellow", name: "옐로우", hex: "#FACC15", count: 40 },
  { id: "red", name: "레드", hex: "#EF4444", count: 28 },
];

/**
 * BrickPalettePanel
 * - 브릭 분석 결과에서 사용된 색상 팔레트를 보여주는 패널
 * - 현재는 샘플 데이터 기반으로만 동작
 * - props.palette로 실제 데이터 주입 가능하도록 확장성 열어둠
 */
export default function BrickPalettePanel({ palette = DEFAULT_PALETTE }) {
  const [activeId, setActiveId] = useState(null);

  // 전체 브릭 개수 (퍼센트 계산용)
  const totalCount = useMemo(
    () => palette.reduce((sum, c) => sum + (c.count ?? 0), 0),
    [palette]
  );

  // 팔레트가 없으면 섹션 자체를 그리지 않음
  if (!palette?.length) return null;

  const handleClick = (colorId) => () => {
    setActiveId((prev) => (prev === colorId ? null : colorId));
  };

  return (
    <section className="palette-panel">
      <div className="panel-header">
        <h3 className="panel-title">브릭 색상 팔레트</h3>
        {totalCount > 0 && (
          <span className="palette-total">총 {totalCount}개</span>
        )}
      </div>

      <p className="panel-desc">
        사용된 브릭 색상 비율을 한눈에 볼 수 있어요. 색상을 선택하면 이후
        단계에서 강조 표시에 활용할 예정입니다.
      </p>

      <div className="palette-grid">
        {palette.map((color) => {
          const count = color.count ?? 0;
          const ratio = totalCount ? Math.round((count / totalCount) * 100) : null;
          const isActive = activeId === color.id;

          return (
            <button
              key={color.id}
              type="button"
              className={`palette-item ${isActive ? "is-active" : ""}`}
              onClick={handleClick(color.id)}
            >
              <span
                className="palette-swatch"
                aria-hidden="true"
                style={{ backgroundColor: color.hex }}
              />
              <div className="palette-meta">
                <div className="palette-name-row">
                  <span className="palette-name">{color.name}</span>
                </div>
                <span className="palette-count">{count} pcs</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
