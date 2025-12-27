import React from "react";

/**
 * AnalysisOptionsPanel
 * - 옵션 UI만 담당
 * - variant:
 *   - "panel": 단독 패널용(제목/설명 포함)
 *   - "embedded": 업로드 영역 내부 삽입용(필드만)
 */
export default function AnalysisOptionsPanel({
  options,
  disabled,
  onChange,
  variant = "panel",
}) {
  const Wrapper = variant === "embedded" ? "div" : "section";
  const wrapperClassName = variant === "embedded" ? "" : "panel options-panel";

  const handleGridChange = (e) => {
    const next = { ...options, gridPreset: Number(e.target.value) };
    onChange(next);
  };

  const handleColorLimitChange = (e) => {
    const next = { ...options, colorLimit: Number(e.target.value) };
    onChange(next);
  };

  return (
    <Wrapper className={wrapperClassName}>
      {variant !== "embedded" && (
        <>
          <h2>1-1. 분석 옵션</h2>
          <p className="panel-desc">
            옵션을 바꾸면 결과가 초기화되며, 다시 분석해야 적용됩니다.
          </p>
        </>
      )}

      <div className="card" style={{ padding: 12, borderRadius: 12 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <strong style={{ fontSize: 14 }}>그리드 크기</strong>

            <select
              value={options.gridPreset}
              onChange={handleGridChange}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "inherit",
              }}
            >
              <option value={16}>16 x 16</option>
              <option value={32}>32 x 32</option>
              <option value={48}>48 x 48</option>
            </select>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="text"
                placeholder="커스텀 (예: 24)"
                disabled
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "inherit",
                  opacity: 0.7,
                }}
              />
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                커스텀은 다음 업데이트에서 지원됩니다.
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <strong style={{ fontSize: 14 }}>색상 개수 제한</strong>

            <select
              value={options.colorLimit}
              onChange={handleColorLimitChange}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "inherit",
              }}
            >
              <option value={8}>8 색</option>
              <option value={16}>16 색</option>
              <option value={24}>24 색</option>
            </select>

            <p style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
              색상 제한이 낮을수록 단순화되며, 높을수록 원본에 가까워집니다.
            </p>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
