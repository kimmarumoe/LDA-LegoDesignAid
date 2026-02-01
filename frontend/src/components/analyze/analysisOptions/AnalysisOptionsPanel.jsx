import BrickSizeSelector from "./BrickSizeSelector.jsx";
import GridSizeSelector from "./GridSizeSelector.jsx";
import "./AnalysisOptionsPanel.css";

/**
 * AnalysisOptionsPanel
 * - 옵션 UI 레이아웃만 담당(SRP)
 * - 입력 UX(그리드 커스텀)는 GridSizeSelector로 분리
 */
export default function AnalysisOptionsPanel({
  disabled,

  gridSize,
  colorLimit,
  onChangeGridSize,
  onChangeColorLimit,

  brickMode,
  brickAllowed,
  onChangeBrickMode,
  onChangeBrickAllowed,
}) {
  return (
    <div className="option-panel">
      <div className="option-field">
        <label className="option-label">그리드 크기</label>
        <GridSizeSelector
          disabled={disabled}
          value={gridSize}
          onChange={onChangeGridSize}
        />
      </div>

      <div className="option-field">
        <label className="option-label">색상 개수 제한</label>
        <select
          className="form-select"
          value={String(colorLimit)}
          onChange={(e) => onChangeColorLimit(Number(e.target.value))}
          disabled={disabled}
        >
          <option value="0">제한 없음</option>
          <option value="8">8 색</option>
          <option value="16">16 색</option>
          <option value="24">24 색</option>
        </select>

        <div className="option-sub">
          색상 제한이 낮을수록 단순화되고, 높을수록 원본에 가까워집니다.
        </div>
      </div>

      <BrickSizeSelector
        disabled={disabled}
        mode={brickMode}
        allowed={brickAllowed}
        onChangeMode={onChangeBrickMode}
        onChangeAllowed={onChangeBrickAllowed}
      />
    </div>
  );
}
