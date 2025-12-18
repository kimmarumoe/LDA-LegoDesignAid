// frontend/src/components/BrickGuidePanel.jsx

/**
 * 브릭 분석 결과 패널 (STEP 01 결과만 담당)
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
  const hasGuide = Boolean(guide);

  const badgeLabel =
    analysisStatus === "idle"
      ? "분석 대기 중"
      : analysisStatus === "running"
      ? "분석 중..."
      : analysisStatus === "done"
      ? "분석 완료"
      : "분석 실패";

  const badgeClass =
    analysisStatus === "done"
      ? "done"
      : analysisStatus === "running"
      ? "running"
      : analysisStatus === "error"
      ? "error"
      : "idle";

  const summary = guide?.summary ?? null;
  const palette = Array.isArray(guide?.palette) ? guide.palette : [];

  return (
    <section className="panel brick-guide-panel">
      <h2>2. 브릭 분석 결과 {useSample ? "(샘플)" : ""}</h2>

      <p className="panel-desc">
        이미지를 업로드한 뒤, 왼쪽의 <strong>“분석하기”</strong> 버튼을 눌러주세요.
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
              아직 분석 결과가 없습니다.
            </p>
            <p className="result-placeholder-sub">
              STEP 01에서 “분석하기”를 실행하면 요약/팔레트가 표시됩니다.
            </p>
          </div>
        )}

        {/* 가이드가 있는 상태: 요약 + 팔레트만 표시 */}
        {hasGuide && analysisStatus !== "error" && (
          <>
            {/* 1) 요약 */}
            {summary && (
              <section className="result-section">
                <h3 className="result-section-title">요약</h3>
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
              </section>
            )}

            {/* 2) 브릭 팔레트 */}
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
                            background: p.colorHex,
                          }}
                        />
                        {p.color} · {p.count}개
                      </div>
                      <div className="result-group-items">{p.type}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
