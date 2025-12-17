// frontend/src/components/BrickGuidePanel.jsx

/**
 * 브릭 분석 패널(= 1단계 결과)
 * - 책임(SRP): 분석 결과(요약/팔레트)만 보여준다.
 * - 단계별 조립 가이드는 STEP 02 카드에서 보여준다.
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
    analyzed: "분석 완료",
    done: "분석 완료", // STEP 02가 완료돼도 이 패널은 분석 결과만 보여줌
    error: "오류 발생",
  };

  // 기존 CSS 클래스(is-done)를 그대로 활용하기 위해 analyzed/done을 같은 스타일로 처리
  const statusClassMap = {
    idle: "is-idle",
    running: "is-running",
    analyzed: "is-done",
    done: "is-done",
    error: "is-error",
  };

  const badgeLabel = statusLabelMap[analysisStatus] ?? "분석 대기 중";
  const badgeClass = statusClassMap[analysisStatus] ?? "is-idle";

  const summary = guide?.summary ?? null;
  const palette = guide?.palette ?? [];

  const hasAnalysis =
    Boolean(guide) && (analysisStatus === "analyzed" || analysisStatus === "done");

  const fileLabel = useSample
    ? "샘플 모드"
    : selectedFile?.name || "선택된 파일 없음";

  return (
    <section className="panel result-panel">
      <h2>2. 브릭 분석 &amp; 조립 가이드{useSample ? " (샘플)" : ""}</h2>
      <p className="panel-desc">
        이미지를 업로드한 뒤, 왼쪽의 <strong>“분석하기”</strong> 버튼을 눌러주세요.
      </p>

      <div className="result-header">
        <span className={`result-badge ${badgeClass}`}>{badgeLabel}</span>
        <span className="result-file-name">{fileLabel}</span>
      </div>

      <div className="result-body">
        {/* 에러 */}
        {analysisStatus === "error" && (
          <div className="result-placeholder">
            <p className="result-placeholder-text">분석 중 오류가 발생했습니다.</p>
            {errorMessage && (
              <p className="result-placeholder-text">{errorMessage}</p>
            )}
          </div>
        )}

        {/* 분석 전 */}
        {!hasAnalysis && analysisStatus !== "error" && (
          <div className="result-placeholder">
            <p className="result-placeholder-text">아직 분석 결과가 없습니다.</p>
            <ul className="result-placeholder-list">
              <li>왼쪽에서 이미지를 선택하고 “분석하기” 버튼을 눌러 주세요.</li>
              {useSample && <li>샘플 모드에서는 예시 결과를 확인할 수 있어요.</li>}
            </ul>
          </div>
        )}

        {/* 분석 결과(요약/팔레트) */}
        {hasAnalysis && (
          <div className="result-sample">
            {/* 1) 요약 정보 */}
            {summary && (
              <div className="result-summary-grid">
                <div className="result-summary-item">
                  <div className="result-summary-label">총 브릭 수</div>
                  <div className="result-summary-value">{summary.totalBricks}</div>
                </div>

                <div className="result-summary-item">
                  <div className="result-summary-label">브릭 종류 수</div>
                  <div className="result-summary-value">{summary.uniqueTypes}</div>
                </div>

                <div className="result-summary-item">
                  <div className="result-summary-label">난이도 / 예상 시간</div>
                  <div className="result-summary-value">
                    {summary.difficulty} · {summary.estimatedTime}
                  </div>
                </div>
              </div>
            )}

            {/* 2) 안내 */}
            <div className="result-placeholder" style={{ marginTop: 12 }}>
              <p className="result-placeholder-text">
                단계별 조립 가이드는 아래 <strong>STEP 02</strong>에서 “조립 가이드 생성”을 누르면 표시됩니다.
              </p>
            </div>

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
