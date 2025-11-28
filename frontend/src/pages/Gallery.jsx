// src/pages/Gallery.jsx

const MOCK_SAMPLES = [
  {
    id: 1,
    title: "스마일 얼굴 아이콘",
    bricks: 180,
    colors: 4,
    baseplate: "32 x 32",
  },
  {
    id: 2,
    title: "심플 로고 디자인",
    bricks: 220,
    colors: 5,
    baseplate: "48 x 48",
  },
  {
    id: 3,
    title: "픽셀 아트 캐릭터",
    bricks: 310,
    colors: 7,
    baseplate: "48 x 48",
  },
];

// ✅ 꼭 `export default function Gallery()` 형태로!
export default function Gallery() {
  return (
    <main className="gallery-page">
      <div className="gallery-inner">
        <header className="gallery-header">
          <h1 className="gallery-title">샘플 결과 갤러리</h1>
          <p className="gallery-desc">
            실제 분석 기능이 완성되기 전까지는, 이렇게 샘플 데이터를
            하드코딩해서 결과 화면을 설계합니다.
          </p>
        </header>

        <section className="gallery-grid">
          {MOCK_SAMPLES.map((sample) => (
            <article key={sample.id} className="gallery-card">
              <div className="gallery-thumb">
                썸네일 자리
              </div>

              <h2 className="gallery-card-title">{sample.title}</h2>

              <ul className="gallery-meta">
                <li>브릭 개수: {sample.bricks} 개</li>
                <li>색상 수: {sample.colors} 가지</li>
                <li>베이스 플레이트: {sample.baseplate}</li>
              </ul>

              <button className="gallery-detail-btn">
                상세 결과 보기 (예정)
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
