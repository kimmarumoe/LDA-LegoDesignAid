import React, { useMemo } from "react";
import "./BrickSizeSelector.css";

/**
 * 브릭 규격 선택 컴포넌트
 * - mode: "auto" | "manual"
 * - allowed: ["1x1","1x2",...]
 */

const BRICK_SIZES = [
  { id: "1x1", label: "1×1", locked: true },
  { id: "1x2", label: "1×2" },
  { id: "1x3", label: "1×3" },
  { id: "1x4", label: "1×4" },
  { id: "1x5", label: "1×5" },
  { id: "2x2", label: "2×2" },
  { id: "2x3", label: "2×3" },
  { id: "2x4", label: "2×4" },
  { id: "2x5", label: "2×5" },
];

function uniq(arr) {
  return Array.from(new Set(arr));
}

function ensureMinAllowed(next) {
  // 정책: 1x1은 항상 포함
  const set = new Set(next);
  set.add("1x1");
  return Array.from(set);
}

function isOneRow(id) {
  return String(id).startsWith("1x");
}
function isTwoRow(id) {
  return String(id).startsWith("2x");
}

export default function BrickSizeSelector({
  mode,
  allowed,
  onChangeMode,
  onChangeAllowed,
}) {
  const isManual = mode === "manual";
  const manualDisabled = !isManual; // 자동 모드면 수동 영역 비활성

  // 정책 적용: allowed가 비어 들어와도 1x1은 유지
  const safeAllowed = ensureMinAllowed(Array.isArray(allowed) ? allowed : []);
  const selectedCount = safeAllowed.length;

  const grouped = useMemo(() => {
    const one = BRICK_SIZES.filter((b) => isOneRow(b.id));
    const two = BRICK_SIZES.filter((b) => isTwoRow(b.id));
    return { one, two };
  }, []);

  const toggleAllowed = (sizeId) => {
    if (!isManual) return; // 자동 모드 방어
    if (sizeId === "1x1") return; // 1x1 해제 불가

    const next = safeAllowed.includes(sizeId)
      ? safeAllowed.filter((x) => x !== sizeId)
      : uniq([...safeAllowed, sizeId]);

    onChangeAllowed?.(ensureMinAllowed(next));
  };

  const selectPreset = (preset) => {
    if (!isManual) return; // 자동 모드 방어

    if (preset === "basic") {
      onChangeAllowed?.(ensureMinAllowed(["1x1", "1x2", "1x3", "2x2", "2x3"]));
      return;
    }
    if (preset === "detail") {
      onChangeAllowed?.(ensureMinAllowed(BRICK_SIZES.map((x) => x.id)));
      return;
    }
    if (preset === "easy") {
      onChangeAllowed?.(
        ensureMinAllowed(["1x1", "1x3", "1x4", "1x5", "2x3", "2x4", "2x5"])
      );
      return;
    }
    if (preset === "all") {
      onChangeAllowed?.(ensureMinAllowed(BRICK_SIZES.map((x) => x.id)));
      return;
    }
    if (preset === "clear") {
      onChangeAllowed?.(["1x1"]); // 정책상 완전 비우기 금지 → 1x1만
      return;
    }
  };

  const handleMode = (nextMode) => {
    onChangeMode?.(nextMode);

    // 수동 전환 시 최소값 보장
    if (nextMode === "manual") {
      onChangeAllowed?.(ensureMinAllowed(safeAllowed));
    }
  };

  return (
    <div className="optGroup">
      <div className="optHeader">
        <div className="option-label">브릭 규격</div>


        <div className="modeToggle" role="radiogroup" aria-label="브릭 규격 모드">
          <button
            type="button"
            className={`modeBtn ${mode === "auto" ? "active" : ""}`}
            onClick={() => handleMode("auto")}
            aria-checked={mode === "auto"}
            role="radio"
          >
            자동(추천)
          </button>
          <button
            type="button"
            className={`modeBtn ${mode === "manual" ? "active" : ""}`}
            onClick={() => handleMode("manual")}
            aria-checked={mode === "manual"}
            role="radio"
          >
            수동
          </button>
        </div>
      </div>

      {!isManual && (
        <div className="brickAutoNote">
          <div className="brickAutoTitle">추천 규격을 사용합니다</div>
          <p className="optHint">
            현재 옵션(그리드/색상 제한)을 기준으로 품질과 부품 수 균형을 맞춘 조합을 사용합니다.
          </p>
          <div className="brickSummaryBar">
            <span className="brickSummaryKey">현재 선택</span>
            <span className="brickSummaryVal">{selectedCount}개 규격</span>
            <span className="brickSummaryDot" />
            <span className="brickSummaryVal">
              1×N {safeAllowed.filter(isOneRow).length} / 2×N{" "}
              {safeAllowed.filter(isTwoRow).length}
            </span>
          </div>
        </div>
      )}

      <div
        className={`brickManualWrap ${isManual ? "enabled" : "disabled"}`}
        aria-disabled={manualDisabled}
      >
        {!isManual && (
          <div className="brickLockOverlay">
            수동 선택은 수동 모드에서 가능합니다
          </div>
        )}

        <div className="presetRow">
          <button
            type="button"
            className="presetBtn"
            onClick={() => selectPreset("basic")}
            disabled={manualDisabled}
          >
            기본
          </button>
          <button
            type="button"
            className="presetBtn"
            onClick={() => selectPreset("easy")}
            disabled={manualDisabled}
          >
            쉬움
          </button>
          <button
            type="button"
            className="presetBtn"
            onClick={() => selectPreset("detail")}
            disabled={manualDisabled}
          >
            정교
          </button>

          <div className="presetSpacer" />

          <button
            type="button"
            className="presetBtn"
            onClick={() => selectPreset("all")}
            disabled={manualDisabled}
          >
            전체
          </button>
          <button
            type="button"
            className="presetBtn danger"
            onClick={() => selectPreset("clear")}
            disabled={manualDisabled}
          >
            초기화
          </button>
        </div>

        <div className="brickSummaryBar">
          <span className="brickSummaryKey">선택</span>
          <span className="brickSummaryVal">{selectedCount}개 규격</span>
          <span className="brickSummaryDot" />
          <span className="brickSummaryVal">
            1×N {safeAllowed.filter(isOneRow).length} / 2×N{" "}
            {safeAllowed.filter(isTwoRow).length}
          </span>
          <span className="brickSummaryDot" />
          <span className="brickSummaryHint">1×1은 필수</span>
        </div>

        <div className="brickSection">
          <div className="brickSectionTitle">1×N</div>
          <div className="chipGrid">
            {grouped.one.map((b) => (
              <SizeChip
                key={b.id}
                item={b}
                selected={safeAllowed.includes(b.id)}
                onToggle={() => toggleAllowed(b.id)}
                disabled={manualDisabled}
              />
            ))}
          </div>
        </div>

        <div className="brickSection">
          <div className="brickSectionTitle">2×N</div>
          <div className="chipGrid">
            {grouped.two.map((b) => (
              <SizeChip
                key={b.id}
                item={b}
                selected={safeAllowed.includes(b.id)}
                onToggle={() => toggleAllowed(b.id)}
                disabled={manualDisabled}
              />
            ))}
          </div>
        </div>

        <p className="optHint">수동 모드에서도 1×1은 항상 포함됩니다.</p>
      </div>
    </div>
  );
}

function SizeChip({ item, selected, onToggle, disabled }) {
  const locked = item.locked || item.id === "1x1";
  const isDisabled = Boolean(disabled) || locked;

  return (
    <button
      type="button"
      className={[
        "sizeChip",
        selected ? "selected" : "",
        locked ? "locked" : "",
        isDisabled ? "isDisabled" : "",
      ].join(" ")}
      onClick={() => {
        if (isDisabled) return;
        onToggle();
      }}
      aria-pressed={selected}
      disabled={isDisabled}
      title={locked ? "1×1은 필수입니다" : "클릭하여 선택/해제"}
    >
      <span className="sizeChipLabel">{item.label}</span>

      {locked ? (
        <span className="sizeChipBadge">필수</span>
      ) : selected ? (
        <span className="sizeChipBadge ok">선택됨</span>
      ) : (
        <span className="sizeChipBadge ghost">미선택</span>
      )}
    </button>
  );
}
