import BrickSizeSelector from "./BrickSizeSelector.jsx";
import "./AnalysisOptionsPanel.css";

/**
 * AnalysisOptionsPanel
 * - 옵션 UI만 담당
 * - UploadPanel에서 토글된 영역 안에 그대로 삽입할 수 있도록 구성
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
        <select
          className="form-select"
          value={gridSize}
          onChange={(e) => onChangeGridSize(e.target.value)}
          disabled={disabled}
        >
          <option value="16x16">16 x 16</option>
          <option value="32x32">32 x 32</option>
          <option value="48x48">48 x 48</option>
        </select>
        <div className="option-sub">커스텀 크기는 다음 업데이트에서 지원됩니다.</div>
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
