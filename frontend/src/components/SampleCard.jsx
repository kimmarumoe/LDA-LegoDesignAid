// frontend/src/components/SampleCard.jsx
import { SAMPLE_GUIDE_PRESETS } from "../sample/sampleGuide.js";

function SampleCard({ mosaic, onOpenAnalyze }) {
  const {
    title,
    description,
    width,
    height,
    brickCount,
    difficulty,
    tags = [],
    thumbnail,
  } = mosaic;

  const handleClick = () => onOpenAnalyze?.(mosaic);
  const guide = SAMPLE_GUIDE_PRESETS[mosaic.id];

  return (
    <article className="sample-card">
      {/* 썸네일 영역 */}
      <div className="sample-thumb">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`${title} 썸네일`}
            className="sample-thumb-img"
          />
        ) : guide ? (
          <svg
            className="sample-thumb-mosaic"
            viewBox={`0 0 ${guide.meta.width} ${guide.meta.height}`}
            role="img"
            aria-label={`${title} 브릭 모자이크 미리보기`}
          >
            <rect width={guide.meta.width} height={guide.meta.height} fill="var(--lda-grid-empty)" />
            {guide.bricks.map((brick) => (
              <g key={brick.id}>
                <rect x={brick.x + 0.025} y={brick.y + 0.025} width="0.95" height="0.95" rx="0.08" fill={brick.hex} />
                <circle cx={brick.x + 0.5} cy={brick.y + 0.5} r="0.23" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.05" />
              </g>
            ))}
          </svg>
        ) : (
          <div className="sample-thumb-placeholder">
            <span className="sample-thumb-placeholder-label">
              미리보기 준비 중
            </span>
          </div>
        )}
      </div>

      {/* 본문 정보 */}
      <div className="sample-card-body">
        <h3 className="sample-card-title">{title}</h3>
        <p className="sample-card-desc">{description}</p>

        <dl className="sample-meta">
          <div className="sample-meta-item">
            <dt>크기</dt>
            <dd>
              {width} × {height} stud
            </dd>
          </div>
          <div className="sample-meta-item">
            <dt>브릭 수</dt>
            <dd>{brickCount} 개 </dd>
          </div>
          <div className="sample-meta-item">
            <dt>난이도</dt>
            <dd>{difficulty}</dd>
          </div>
        </dl>

        {tags.length > 0 && (
          <div className="sample-tags">
            {tags.map((tag) => (
              <span key={tag} className="sample-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="sample-card-footer">
        <button
          type="button"
          className="sample-card-btn"
          onClick={handleClick}
        >
          분석 페이지에서 보기
        </button>
        <p className="sample-card-hint">
          샘플을 분석하고 단계별 조립 가이드를 확인하세요.
        </p>
      </div>
    </article>
  );
}

export default SampleCard;
