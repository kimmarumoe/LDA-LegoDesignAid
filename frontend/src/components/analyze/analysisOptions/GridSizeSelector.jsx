import { useEffect, useMemo, useState } from "react";
import {
  GRID_PRESETS,
  GRID_MIN,
  GRID_MAX,
  parseGridSizeDims,
  formatGridSize,
} from "../../../utils/analyzeOptions";
import "./GridSizeSelector.css";

/**
 * GridSizeSelector
 * - SRP: "그리드 크기 선택" UX만 담당
 * - 핵심: UI 모드(preset/custom)를 gridSize 값과 분리해서 유지
 *   → 커스텀을 눌렀는데 값이 프리셋이라 다시 튕기는 문제 해결
 */
export default function GridSizeSelector({ disabled, value, onChange }) {
  const normalizedValue = useMemo(() => {
    return typeof value === "string"
      ? value.trim().toLowerCase().replace(/\s+/g, "")
      : "16x16";
  }, [value]);

  const initialDims = useMemo(() => {
    return parseGridSizeDims(normalizedValue) ?? { w: 16, h: 16 };
  }, [normalizedValue]);

  // ✅ UI 모드: gridSize 값과 분리 (커스텀 선택이 유지되도록)
  const [uiMode, setUiMode] = useState(() =>
    (GRID_PRESETS).includes(normalizedValue) ? "preset" : "custom"
  );

  const [customW, setCustomW] = useState(initialDims.w);
  const [customH, setCustomH] = useState(initialDims.h);
  const [lockSquare, setLockSquare] = useState(true);

  // 외부에서 value가 "커스텀 값"으로 들어오면 custom 모드로 자동 전환
  useEffect(() => {
    const isPreset = (GRID_PRESETS).includes(normalizedValue);
    if (!isPreset) setUiMode("custom");
    // ⚠️ preset이면 uiMode를 강제로 preset으로 되돌리지 않음
    // 이유: 사용자가 custom을 선택했는데 값이 우연히 48x48이면 튕김 발생
  }, [normalizedValue]);

  // 외부 value 변경 시 입력칸도 동기화(프로젝트 로드/프리셋 클릭 등)
  useEffect(() => {
    setCustomW(initialDims.w);
    setCustomH(initialDims.h);
  }, [initialDims.w, initialDims.h]);

  function clampInt(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return null;
    const i = Math.trunc(x);
    return Math.max(GRID_MIN, Math.min(GRID_MAX, i));
  }

  function emitNext(w, h) {
    const wi = clampInt(w);
    const hi = clampInt(h);
    if (wi == null || hi == null) return;
    onChange?.(formatGridSize(wi, hi));
  }

  const handleSelect = (e) => {
    const next = e.target.value;

    if ((GRID_PRESETS).includes(next)) {
      // preset 선택 → uiMode preset + 즉시 값 반영
      setUiMode("preset");
      onChange?.(next);
      return;
    }

    if (next === "custom") {
      // ✅ custom 선택 → uiMode만 custom으로 변경
      // (여기서 onChange를 호출하면 값이 프리셋일 때 다시 튕길 수 있음)
      setUiMode("custom");
      return;
    }
  };

  const handleChangeW = (e) => {
    const wi = clampInt(e.target.value);
    if (wi == null) return;
    setCustomW(wi);

    if (lockSquare) {
      setCustomH(wi);
      emitNext(wi, wi);
    } else {
      emitNext(wi, customH);
    }
  };

  const handleChangeH = (e) => {
    const hi = clampInt(e.target.value);
    if (hi == null) return;
    setCustomH(hi);
    emitNext(customW, hi);
  };

  const handleToggleLock = (e) => {
    const checked = !!e.target.checked;
    setLockSquare(checked);

    if (checked) {
      setCustomH(customW);
      emitNext(customW, customW);
    }
  };

  // select 값은 "실제 gridSize"가 아니라 uiMode로 결정
  const selectValue = uiMode === "custom" ? "custom" : normalizedValue;

  return (
  <div className="grid-size">
    <div className="grid-size__row">
      <select
        className="form-select grid-size__select"
        value={selectValue}
        onChange={handleSelect}
        disabled={disabled}
      >
        <option value="16x16">16 x 16</option>
        <option value="32x32">32 x 32</option>
        <option value="48x48">48 x 48</option>
        <option value="custom">커스텀</option>
      </select>

      <label className="grid-size__lock">
        <input
          className="grid-size__checkbox"
          type="checkbox"
          checked={lockSquare}
          onChange={handleToggleLock}
          disabled={disabled}
        />
        정사각(가로=세로)
      </label>
    </div>

    {uiMode === "custom" && (
      <div className="grid-size__custom">
        <div className="grid-size__inputs">
          <label className="grid-size__input">
            <span>가로</span>
            <input
              className="grid-size__number"
              type="number"
              min={GRID_MIN}
              max={GRID_MAX}
              value={customW}
              onChange={handleChangeW}
              disabled={disabled}
            />
          </label>

          <span className="grid-size__x">x</span>

          <label className="grid-size__input">
            <span>세로</span>
            <input
              className="grid-size__number"
              type="number"
              min={GRID_MIN}
              max={GRID_MAX}
              value={customH}
              onChange={handleChangeH}
              disabled={disabled || lockSquare}
            />
          </label>
        </div>

        <div className="option-sub">
          {GRID_MIN}~{GRID_MAX} 범위에서 입력할 수 있어요. (예: 64x64, 64x80)
        </div>
      </div>
    )}
  </div>
);
}
