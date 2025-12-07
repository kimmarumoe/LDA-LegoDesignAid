// frontend/src/components/BrickGuidePanel.jsx

/**
 * 브릭 분석 & 조립 가이드 패널
 * - guide: GuideResponse | null
 * - analysisStatus: "idle" | "running" | "done" | "error"
 * - errorMessage: string
 * - useSample: boolean
 * - selectedFile: File | null
 */
export default function BrickGuidePanel({
  guide,
  analysisStatus,
  errorMessage,
  useSample,
  selectedFile,
}) {
  const statusLabelMap = {
    idle: "분석 대기 중",
    running: "분석 중...",
    done: useSample ? "샘플 가이드 표시 중" : "분석 완료",
    error: "오류 발생",
  };

  const statusClassMap = {
    idle: "is-idle",
    running: "is-running",
    done: "is-done",
    error: "is-error",
  };

  const badgeLabel = statusLabelMap[analysisStatus] ?? "분석 대기 중";
  const badgeClass = statusClassMap[analysisStatus] ?? "is-idle";

  const summary = guide?.summary ?? null;
  const groups = guide?.groups ?? [];
  const palette = guide?.palette ?? [];

  const hasGuide = !!guide && analysisStatus === "done";

  return (
    <section className="panel result-panel">
      <h2>2. 브릭 분석 & 조립 가이드{useSample ? " (샘플)" : ""}</h2>
      <p className="panel-desc">
        이미지를 업로드한 뒤, 왼쪽의{" "}
        <strong>“분석하기”</strong> 버튼을 눌러주세요.
      </p>

      <div className="result-header">
        <span className={`result-badge ${badgeClass}`}>{badgeLabel}</span>
        <span className="result-file-name">
          {selectedFile
            ? selectedFile.name
            : "선택된 파일 없음 · 샘플 모드에서 UI만 확인 중"}
        </span>
      </div>

      <div className="result-body">
        {/* 에러 상태 */}
        {analysisStatus === "error" && (
          <div className="result-placeholder">
            <p className="result-placeholder-text">
              분석 중 오류가 발생했습니다.
            </p>
            {errorMessage && (
              <p className="result-placeholder-text">{errorMessage}</p>
            )}
          </div>
        )}

        {/* 아직 가이드가 없는 상태 */}
        {!hasGuide && analysisStatus !== "error" && (
          <div className="result-placeholder">
            <p className="result-placeholder-text">
              아직 생성된 조립 가이드가 없습니다.
            </p>
            <ul className="result-placeholder-list">
              <li>왼쪽에서 이미지를 선택하고 “분석하기” 버튼을 눌러 주세요.</li>
              {useSample && (
                <li>샘플 모드에서는 준비된 예시 가이드가 표시됩니다.</li>
              )}
            </ul>
          </div>
        )}

        {/* 가이드가 있을 때 */}
        {hasGuide && (
          <div className="result-sample">
            {/* 1) 요약 정보 */}
            {summary && (
              <div className="result-summary-grid">
                <div className="result-summary-item">
                  <div className="result-summary-label">총 브릭 수</div>
                  <div className="result-summary-value">
                    {summary.totalBricks}
                  </div>
                </div>
                <div className="result-summary-item">
                  <div className="result-summary-label">브릭 종류 수</div>
                  <div className="result-summary-value">
                    {summary.uniqueTypes}
                  </div>
                </div>
                <div className="result-summary-item">
                  <div className="result-summary-label">난이도 / 예상 시간</div>
                  <div className="result-summary-value">
                    {summary.difficulty} · {summary.estimatedTime}
                  </div>
                </div>
              </div>
            )}

            {/* 2) 단계별 조립 가이드 (GuideStep 리스트) */}
            {groups.length > 0 && (
              <section className="result-section">
                <h3 className="result-section-title">단계별 조립 가이드</h3>
                <div className="result-steps">
                  {groups.map((step) => (
                    <div
                      key={step.id ?? step.title}
                      className="result-step"
                    >
                      <div className="result-step-num">
                        {typeof step.id === "number" ? step.id : "•"}
                      </div>
                      <div className="result-step-body">
                        <div className="result-step-title">{step.title}</div>
                        {step.description && (
                          <div className="result-step-hint">
                            {step.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3) 브릭 팔레트 */}
            {palette.length > 0 && (
              <section className="result-section">
                <h3 className="result-section-title">사용 브릭 팔레트</h3>
                <div>
                  {palette.map((p) => (
                    <div key={p.color} className="result-group">
                      <div className="result-group-name">
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "999px",
                            marginRight: 6,
                            backgroundColor: p.color,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        {p.name ?? p.color} · {p.count}개
                      </div>
                      {Array.isArray(p.types) && p.types.length > 0 && (
                        <ul className="result-group-list">
                          {p.types.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
