import React from "react";

/**
 * 브릭 규격 선택(모드 토글 + 체크박스) 컴포넌트
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

export default function BrickSizeSelector({
  mode,
  allowed,
  onChangeMode,
  onChangeAllowed,
}) {
  const isManual = mode === "manual";

  // 정책 적용: 외부에서 allowed가 비어 들어와도 1x1은 유지
  const safeAllowed = ensureMinAllowed(Array.isArray(allowed) ? allowed : []);

  const toggleAllowed = (sizeId) => {
    // 1x1은 해제 불가
    if (sizeId === "1x1") return;

    const next = safeAllowed.includes(sizeId)
      ? safeAllowed.filter((x) => x !== sizeId)
      : uniq([...safeAllowed, sizeId]);

    onChangeAllowed(ensureMinAllowed(next));
  };

  const selectPreset = (preset) => {
    if (preset === "basic") {
      onChangeAllowed(ensureMinAllowed(["1x1", "1x2", "1x3", "2x2", "2x3"]));
      return;
    }
    if (preset === "only1x1") {
      onChangeAllowed(["1x1"]);
      return;
    }
    if (preset === "all") {
      onChangeAllowed(ensureMinAllowed(BRICK_SIZES.map((x) => x.id)));
      return;
    }
    if (preset === "clear") {
      // 정책상 완전 비우기 금지 → 1x1만 남김
      onChangeAllowed(["1x1"]);
      return;
    }
  };

  const handleMode = (nextMode) => {
    onChangeMode(nextMode);

    // 수동 전환 시 최소값 보장
    if (nextMode === "manual") {
      onChangeAllowed(ensureMinAllowed(safeAllowed));
    }
  };

  return (
    <div className="optGroup">
      <div className="optHeader">
        <div className="optTitle">브릭 규격</div>

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
        <p className="optHint">
          자동은(추후) 결과 품질/부품 수 균형을 위해 추천 규격을 사용합니다.
        </p>
      )}

      {isManual && (
        <>
          <div className="presetRow">
            <button
              type="button"
              className="presetBtn"
              onClick={() => selectPreset("basic")}
            >
              기본(1×1/1×2/1×3/2×2/2×3)
            </button>

            <button
              type="button"
              className="presetBtn"
              onClick={() => selectPreset("only1x1")}
            >
              1×1만
            </button>

            <button
              type="button"
              className="presetBtn"
              onClick={() => selectPreset("all")}
            >
              전체 선택
            </button>

            <button
              type="button"
              className="presetBtn danger"
              onClick={() => selectPreset("clear")}
            >
              전체 해제
            </button>
          </div>

          <div className="checkGrid">
            {BRICK_SIZES.map((b) => {
              const locked = b.locked || b.id === "1x1";
              return (
                <label
                  key={b.id}
                  className={`checkItem ${locked ? "locked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={safeAllowed.includes(b.id)}
                    disabled={locked}
                    onChange={() => toggleAllowed(b.id)}
                  />
                  <span>{b.id === "1x1" ? "1×1 (필수)" : b.label}</span>
                </label>
              );
            })}
          </div>

          <p className="optHint">
            수동 모드에서도 1×1은 항상 포함됩니다.
          </p>
        </>
      )}
    </div>
  );
}
