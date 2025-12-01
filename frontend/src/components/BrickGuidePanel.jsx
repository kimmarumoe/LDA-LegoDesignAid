// frontend/src/components/BrickGuidePanel.jsx
import { useEffect, useState } from "react";

// 샘플 데이터
const sampleResult = {
  summary: {
    totalBricks: 124,
    uniqueTypes: 8,
    difficulty: "중급",
    estimatedTime: "60~90분",
  },
  groups: [
    {
      name: "기본 브릭",
      items: ["2x2 빨강 30개", "2x4 노랑 20개", "1x2 흰색 16개"],
    },
    {
      name: "포인트 색상",
      items: ["1x1 검정 12개", "원형 타일 눈 모양 2개"],
    },
  ],
  steps: [
    {
      step: 1,
      title: "바닥 판 만들기",
      hint: "2x4, 2x2 브릭으로 전체 윤곽을 먼저 잡습니다.",
    },
    {
      step: 2,
      title: "캐릭터 실루엣 쌓기",
      hint: "몸통과 머리의 실루엣을 먼저 만든 뒤, 세부를 채웁니다.",
    },
    {
      step: 3,
      title: "눈/입 등 디테일 추가",
      hint: "작은 브릭과 타일을 사용해 표정을 완성합니다.",
    },
  ],
  tips: [
    "동일한 색상의 브릭은 미리 모아두면 조립 시간이 줄어듭니다.",
    "작은 브릭은 마지막 디테일 단계에서 한 번에 처리하세요.",
  ],
};

function BrickGuidePanel({ analysisStatus = "idle", fileName }) {
  const [showSample, setShowSample] = useState(false);

  const toggleSample = () => {
    setShowSample((prev) => !prev);
  };

  // 분석 상태에 따른 자동 토글
  useEffect(() => {
    if (analysisStatus === "done") {
      setShowSample(true);
    } else if (analysisStatus === "idle") {
      setShowSample(false);
    }
  }, [analysisStatus]);

  let statusLabel = "분석 대기 중";
  let badgeClass = "is-idle";
  if (analysisStatus === "running") {
    statusLabel = "분석 중...";
    badgeClass = "is-running";
  } else if (analysisStatus === "done") {
    statusLabel = "분석 완료";
    badgeClass = "is-ready";
  }

  const hasFile = !!fileName;

  return (
    <section className="panel result-panel">
      <div className="result-header">
        <h2>2.브릭분석 &amp; 조립가이드 </h2>
        <span className={`result-badge ${badgeClass}`}>{statusLabel}</span>
      </div>

      {hasFile && (
        <p className="result-file-name">
          선택된 이미지 : <span>{fileName}</span>
        </p>
      )}

      {/* 우측 상단 툴바 (샘플 보기용 버튼) */}
      <div className="result-toolbar">
        <button
          type="button"
          className="btn-outline"
          onClick={toggleSample}
          disabled={analysisStatus === "running"} // 🔧 오타 수정
        >
          {showSample ? "빈 상태로 보기" : "샘플 결과 보기"}
        </button>
      </div>

      <div className="result-body">
        {showSample ? (
          /* 샘플 결과 화면 */
          <div className="result-sample">
            {/* 요약 카드들 */}
            <div className="result-summary-grid">
              <div className="result-summary-item">
                <div className="result-summary-label">총 브릭 수</div>
                <div className="result-summary-value">
                  {sampleResult.summary.totalBricks} 개
                </div>
              </div>
              <div className="result-summary-item">
                <div className="result-summary-label">브릭 종류</div>
                <div className="result-summary-value">
                  {sampleResult.summary.uniqueTypes} 타입
                </div>
              </div>
              <div className="result-summary-item">
                <div className="result-summary-label">난이도 / 예상 시간</div>
                <div className="result-summary-value">
                  {sampleResult.summary.difficulty} ·{" "}
                  {sampleResult.summary.estimatedTime}
                </div>
              </div>
            </div>

            {/* 색상/종류별 그룹 */}
            <div>
              <h3 className="result-section-title">브릭 구성</h3>
              <div className="result-groups">
                {sampleResult.groups.map((group) => (
                  <div key={group.name} className="result-group">
                    <div className="result-group-name">{group.name}</div>
                    <ul className="result-group-list">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 단계별 조립 가이드 */}
            <div>
              <h3 className="result-section-title">단계별 조립 가이드</h3>
              <div className="result-steps">
                {sampleResult.steps.map((s) => (
                  <div key={s.step} className="result-step">
                    <span className="result-step-num">STEP {s.step}</span>
                    <div className="result-step-body">
                      <div className="result-step-title">{s.title}</div>
                      <div className="result-step-hint">{s.hint}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 팁 영역 */}
            <div className="result-tips">
              <div className="result-section-title">조립 팁</div>
              <ul>
                {sampleResult.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          /* 분석 전(빈) 상태 화면 */
          <div className="result-placeholder">
            <p className="result-placeholder-text">
              아직 분석이 진행되지 않았습니다.
            </p>
            <ul className="result-placeholder-list">
              <li>
                왼쪽에서 이미지를 선택하고 &quot;분석 실행&quot;을 눌러 주세요.
              </li>
              <li>
                분석이 완료되면 필요한 브릭 수, 종류, 난이도 정보를 보여줄
                예정입니다.
              </li>
              <li>
                당장은 샘플 결과를 통해 레이아웃만 먼저 확인할 수 있습니다.
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default BrickGuidePanel;
