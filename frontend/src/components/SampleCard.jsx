// frontend/src/components/SampleCard.jsx

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

  const handleClick = () => {
    if (onOpenAnalyze) {
      onOpenAnalyze(mosaic);
    }
  };

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
          className="btn-primary sample-card-btn"
          onClick={handleClick}
        >
          분석 페이지에서 보기
        </button>
        <p className="sample-card-hint">
          지금은 샘플 데이터로 Analyze 페이지를 여는 용도로 사용할 예정입니다.
        </p>
      </div>
    </article>
  );
}

export default SampleCard;
