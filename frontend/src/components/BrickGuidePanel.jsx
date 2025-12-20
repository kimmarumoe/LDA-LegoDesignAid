import { useMemo } from "react";
import BrickMosaicPreview from "./BrickMosaicPreview.jsx";

/**
 * BrickGuidePanel
 * - 분석 결과(요약/팔레트/프리뷰) 표시
 * - 조립 가이드(steps) 표시
 * - “표시 UI”만 담당 (SRP)
 */
export default function BrickGuidePanel({
  analysisStatus,
  analysisError,
  analysisResult,
  guideStatus,
  guideError,
  guideSteps,
  onGenerateGuide,
}) {
  const isAnalyzeDone = analysisStatus === "done";
  const isGuideRunning = guideStatus === "running";

  const summary = analysisResult?.summary;

  // ✅ palette가 170개처럼 커질 수 있어서(셀 단위일 가능성) 집계해서 보여줌
  const paletteSummary = useMemo(() => {
    const raw = analysisResult?.palette;
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const map = new Map();
    for (const p of raw) {
      const hex = p?.hex ?? p?.color;
      if (!hex) continue;

      // count가 있으면 사용, 없으면 1로 집계(셀 단위 palette도 대응)
      const inc = Number(p?.count ?? p?.qty ?? p?.amount);
      const add = Number.isFinite(inc) ? inc : 1;

      map.set(hex, (map.get(hex) ?? 0) + add);
    }

    return [...map.entries()]
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
  }, [analysisResult]);

  const isPaletteEmpty = paletteSummary.length === 0;

  return (
    <section className="panel guide-panel">
      <h2>2. 브릭 분석 & 조립 가이드</h2>
      <p className="panel-desc">
        STEP 01에서 요약/팔레트를 확인하고, STEP 02에서 조립 순서를 생성하세요.
      </p>

      {/* ===== STEP 01 결과 영역 ===== */}
      <div style={{ marginTop: 12 }}>
        <h3 style={{ margin: "8px 0" }}>STEP 01. 분석 결과</h3>

        {analysisStatus === "running" && <p>분석중...</p>}

        {analysisStatus === "error" && analysisError && (
          <div className="error-box">{analysisError}</div>
        )}

        {isAnalyzeDone && analysisResult && (
          <div style={{ display: "grid", gap: 12 }}>
            {/* ✅ 모자이크 프리뷰 (STEP01에 포함) */}
            <BrickMosaicPreview guide={analysisResult} />

            {/* 요약 */}
            {summary && (
              <div className="card" style={{ padding: 12, borderRadius: 12 }}>
                <strong>요약</strong>
                <ul style={{ marginTop: 8 }}>
                  {"totalBricks" in summary && <li>총 브릭 수: {summary.totalBricks}</li>}
                  {"uniqueTypes" in summary && <li>브릭 종류: {summary.uniqueTypes}</li>}
                  {"difficulty" in summary && <li>난이도: {summary.difficulty}</li>}
                  {"estimatedTime" in summary && <li>예상 시간: {summary.estimatedTime}</li>}
                </ul>
              </div>
            )}

            {/* 팔레트 */}
            <div className="card" style={{ padding: 12, borderRadius: 12 }}>
              <strong>팔레트</strong>

              {isPaletteEmpty ? (
                <p style={{ marginTop: 8, opacity: 0.8 }}>팔레트 데이터가 없어요.</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {paletteSummary.slice(0, 24).map((p, idx) => {
                    const color = p.hex ?? "#999999";
                    const count = p.count ?? "-";

                    return (
                      <div
                        key={`${color}-${idx}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: 10,
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 6,
                            background: color,
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                        />
                        <div style={{ lineHeight: 1.2 }}>
                          <div style={{ fontSize: 12, opacity: 0.9 }}>{color}</div>
                          <div style={{ fontSize: 12, opacity: 0.75 }}>개수: {count}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 팔레트가 많을 때 안내 */}
                  {paletteSummary.length > 24 && (
                    <div style={{ fontSize: 12, opacity: 0.7, padding: 10 }}>
                      +{paletteSummary.length - 24}개 더 있음
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== STEP 02 액션 + 결과 ===== */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: "8px 0" }}>STEP 02. 조립 가이드 생성</h3>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
  type="button"
  className="btn-primary"
  onClick={onGenerateGuide}
  disabled={!isAnalyzeDone || isGuideRunning}
>
  {isGuideRunning ? "생성중..." : "조립 가이드 생성"}
</button>

          {!isAnalyzeDone && (
            <span style={{ fontSize: 12, opacity: 0.8 }}>먼저 분석을 완료해주세요.</span>
          )}
        </div>

        {guideStatus === "error" && guideError && (
          <div className="error-box" style={{ marginTop: 12 }}>
            {guideError}
          </div>
        )}

        {guideStatus === "done" && guideSteps.length > 0 && (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {guideSteps.map((step, idx) => {
              const title = step?.title ?? `STEP ${idx + 1}`;
              const desc = step?.description ?? step?.desc ?? "";
              const bricks = step?.bricks ?? step?.bricksUsed ?? [];

              return (
                <div key={idx} className="card" style={{ padding: 12, borderRadius: 12 }}>
                  <strong>{title}</strong>
                  {desc && <p style={{ marginTop: 8, opacity: 0.9 }}>{desc}</p>}

                  {Array.isArray(bricks) && bricks.length > 0 && (
                    <details style={{ marginTop: 10 }}>
                      <summary>사용 브릭 보기 ({bricks.length})</summary>
                      <ul style={{ marginTop: 8 }}>
                        {bricks.map((b, bIdx) => (
                          <li key={bIdx} style={{ fontSize: 12, opacity: 0.85 }}>
                            {typeof b === "string" ? b : JSON.stringify(b)}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
