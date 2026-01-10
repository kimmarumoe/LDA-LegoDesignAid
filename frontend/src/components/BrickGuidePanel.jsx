import { useEffect, useMemo, useState } from "react";
import BrickMosaicPreview from "./BrickMosaicPreview.jsx";

/*
  BrickGuidePanel
  - STEP 01: 분석 결과(요약/팔레트/미리보기)
  - STEP 02: 조립 가이드(steps)
  - 이 컴포넌트는 "보여주기" 중심이고, 실제 요청은 바깥에서 실행한다.
*/
export default function BrickGuidePanel({
  analysisStatus,
  analysisError,
  analysisResult,

  guideStatus,
  guideError,
  guideSteps,

  onGenerateGuide,

  // 선택 옵션: STEP 01을 다시 시도할 수 있게 바깥에서 함수를 넘겨받는다.
  onRetryAnalyze,
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showAllPalette, setShowAllPalette] = useState(false);

  const isAnalyzeRunning = analysisStatus === "running";
  const isAnalyzeDone = analysisStatus === "done";
  const showAnalyzeError = analysisStatus === "error" && Boolean(analysisError);

  const isGuideRunning = guideStatus === "running";
  const isGuideDone =
    guideStatus === "done" && Array.isArray(guideSteps) && guideSteps.length > 0;
  const showGuideError = guideStatus === "error" && Boolean(guideError);

  const summary = analysisResult?.summary;

  // 서버에서 summary 필드명이 조금 달라도 최대한 읽어서 보여준다.
  const summaryView = useMemo(() => {
    const s = summary ?? {};
    return {
      totalBricks: s.totalBricks ?? s.total ?? s.brickCount ?? s.total_bricks ?? null,
      uniqueTypes: s.uniqueTypes ?? s.brickTypes ?? s.unique_types ?? s.types ?? null,
      difficulty: s.difficulty ?? s.level ?? s.diff ?? null,
      estimatedTime: s.estimatedTime ?? s.time ?? s.eta ?? null,
    };
  }, [summary]);

  useEffect(() => {
    // 분석이 끝나기 전에는 토글 UI를 자동으로 닫아둔다.
    if (analysisStatus !== "done") {
      setShowPreview(false);
      setShowAllPalette(false);
    }
  }, [analysisStatus]);

  const paletteSummary = useMemo(() => {
    const raw = analysisResult?.palette;
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const map = new Map();

    for (const p of raw) {
      const hex = p?.hex ?? p?.color;
      if (!hex) continue;

      const inc = Number(p?.count ?? p?.qty ?? p?.amount);
      const add = Number.isFinite(inc) ? inc : 1;

      map.set(hex, (map.get(hex) ?? 0) + add);
    }

    return [...map.entries()]
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
  }, [analysisResult]);

  const isPaletteEmpty = paletteSummary.length === 0;

  const paletteLimit = 24;
  const paletteHiddenCount =
    paletteSummary.length > paletteLimit ? paletteSummary.length - paletteLimit : 0;

  const paletteToRender = showAllPalette
    ? paletteSummary
    : paletteSummary.slice(0, paletteLimit);

  // STEP 02 버튼 활성화 규칙: 분석 완료 + 가이드 생성중이 아니고 + 아직 완료가 아닐 때
  const canClickStep2 = isAnalyzeDone && !isGuideRunning && !isGuideDone;

  const canRetryAnalyze =
    typeof onRetryAnalyze === "function" && !isAnalyzeRunning;

  const canRetryGuide =
    typeof onGenerateGuide === "function" && isAnalyzeDone && !isGuideRunning;

  return (
    <section className="panel guide-panel" aria-busy={isAnalyzeRunning || isGuideRunning}>
      <h2>2. 브릭 분석 & 조립 가이드</h2>
      <p className="panel-desc">
        STEP 01에서 요약/팔레트를 확인하고, STEP 02에서 조립 순서를 생성하세요.
      </p>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ margin: "8px 0" }}>STEP 01. 분석 결과</h3>

        {analysisStatus === "running" && (
          <p aria-live="polite">분석 중입니다. 잠시만 기다려주세요.</p>
        )}

        {showAnalyzeError && (
          <div
            className="error-box"
            role="alert"
            style={{ display: "grid", gap: 10 }}
          >
            <div>{analysisError}</div>

            {canRetryAnalyze && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onRetryAnalyze}
                  disabled={!canRetryAnalyze}
                  aria-disabled={!canRetryAnalyze}
                >
                  다시 시도
                </button>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  서버가 꺼져 있었다면 서버를 켠 뒤 다시 시도해 주세요.
                </div>
              </div>
            )}
          </div>
        )}

        {isAnalyzeDone && analysisResult && (
          <div style={{ display: "grid", gap: 12 }}>
            {/* 1) 요약 */}
            {summary && (
              <div className="card" style={{ padding: 12, borderRadius: 12 }}>
                <strong>요약</strong>

                <div className="summary-cards" style={{ marginTop: 10 }}>
                  {summaryView.totalBricks != null && (
                    <div className="summary-card">
                      <div className="summary-card-label">총 브릭 수</div>
                      <div className="summary-card-value">{summaryView.totalBricks}</div>
                    </div>
                  )}

                  {summaryView.uniqueTypes != null && (
                    <div className="summary-card">
                      <div className="summary-card-label">브릭 종류</div>
                      <div className="summary-card-value">{summaryView.uniqueTypes}</div>
                    </div>
                  )}

                  {summaryView.difficulty != null && (
                    <div className="summary-card">
                      <div className="summary-card-label">난이도</div>
                      <div className="summary-card-value">{summaryView.difficulty}</div>
                    </div>
                  )}

                  {summaryView.estimatedTime != null && (
                    <div className="summary-card">
                      <div className="summary-card-label">예상 시간</div>
                      <div className="summary-card-value">{summaryView.estimatedTime}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2) 모자이크 미리보기(토글) */}
            <div className="card" style={{ padding: 12, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>모자이크 미리보기</strong>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowPreview((v) => !v)}
                  aria-expanded={showPreview}
                  style={{ padding: "6px 10px", fontSize: 12 }}
                >
                  {showPreview ? "숨기기" : "보기"}
                </button>
              </div>

              {!showPreview ? (
                <p style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
                  미리보기는 이미지 크기에 따라 표시까지 시간이 걸릴 수 있어요. 필요할 때만 열어 확인해 주세요.
                </p>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <BrickMosaicPreview guide={analysisResult} />
                </div>
              )}
            </div>

            {/* 3) 팔레트(전체보기 토글) */}
            <div className="card" style={{ padding: 12, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>팔레트</strong>

                {paletteHiddenCount > 0 && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowAllPalette((v) => !v)}
                    aria-expanded={showAllPalette}
                    style={{ padding: "6px 10px", fontSize: 12 }}
                  >
                    {showAllPalette ? "접기" : `전체 보기 (+${paletteHiddenCount})`}
                  </button>
                )}
              </div>

              {isPaletteEmpty ? (
                <p style={{ marginTop: 8, opacity: 0.8 }}>팔레트 데이터가 없어요.</p>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: 10,
                      marginTop: 10,
                      maxHeight: showAllPalette ? 340 : "none",
                      overflowY: showAllPalette ? "auto" : "visible",
                      paddingRight: showAllPalette ? 6 : 0,
                    }}
                  >
                    {paletteToRender.map((p, idx) => {
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
                            background: "var(--lda-surface-2)",
                            border: "1px solid var(--lda-border)",
                          }}
                        >
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 6,
                              background: color,
                              border: "1px solid var(--lda-border)",
                            }}
                          />
                          <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontSize: 12, opacity: 0.9 }}>{color}</div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>개수: {count}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showAllPalette && (
                    <p style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                      전체 색상은 스크롤로 확인할 수 있어요.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <h3 style={{ margin: "8px 0" }}>STEP 02. 조립 가이드 생성</h3>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onGenerateGuide}
            disabled={!canClickStep2}
            aria-disabled={!canClickStep2}
          >
            {isGuideRunning ? "생성중..." : isGuideDone ? "생성 완료" : "조립 가이드 생성"}
          </button>

          {!isAnalyzeDone && (
            <span style={{ fontSize: 12, opacity: 0.8 }}>먼저 분석을 완료해주세요.</span>
          )}
        </div>

        {showGuideError && (
          <div
            className="error-box"
            role="alert"
            style={{ marginTop: 12, display: "grid", gap: 10 }}
          >
            <div>{guideError}</div>

            {canRetryGuide && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onGenerateGuide}
                  disabled={!canRetryGuide}
                  aria-disabled={!canRetryGuide}
                >
                  다시 시도
                </button>

                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  조립 단계 데이터가 없다면 샘플 모드로 확인하거나, steps 생성 API 연동이 필요할 수 있어요.
                </div>
              </div>
            )}
          </div>
        )}

        {isGuideDone && (
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
