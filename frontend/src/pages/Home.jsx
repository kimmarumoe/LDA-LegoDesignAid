// src/pages/Home.jsx
import { Link } from "react-router-dom";
import "./Home.css";

/**
 * 홈(메인) 페이지
 * - 상단 히어로 섹션
 * - HOW IT WORKS 섹션
 */
export default function Home() {
  return (
    <div className="home-page">
      {/* ===== HERO 섹션 ===== */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-left">
            <p className="home-kicker">레고 디자인 도우미</p>
            <h1 className="home-hero-title">
              이미지로
              <br />
              나만의 레고 세트 설계하기
            </h1>

            {/* ✅ LDA 이름이 들어간 프로젝트 소개 문장 */}
            <p className="home-hero-desc">
              LDA(Lego Design Aid)는 만들고 싶은 그림이나 캐릭터를
              업로드하면, 필요한 브릭 조합과 조립 흐름을 구상해 볼 수 있도록
              도와주는 개인 토이 프로젝트입니다.
            </p>

            <div className="home-actions">
              <Link to="/analyze" className="btn btn-primary">
                이미지 분석 시작하기
              </Link>
              <Link to="/gallery" className="btn btn-ghost">
                샘플 결과 구경하기
              </Link>
            </div>
          </div>

          {/* 오른쪽 데코 박스 (색 블록들) */}
          <div className="home-hero-right" aria-hidden="true">
            <div className="hero-shape">
              <div className="hero-square" />
              <div className="hero-dot hero-dot-orange" />
              <div className="hero-dot hero-dot-green" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS 섹션 ===== */}
      <section className="home-how">
        <div className="home-how-inner">
          <div className="home-how-left">
            <p className="section-eyebrow">HOW IT WORKS</p>
            <h2 className="section-title home-how-title">
              이미지를 올리면
              <br />
              브릭 구성을 상상해 볼 수 있어요
            </h2>
            <p className="section-desc home-how-desc">
              아직은 완성된 상용 서비스가 아니라, 레고를 좋아하는 개발자가
              실험하는 토이 프로젝트입니다. 업로드한 이미지를 기준으로 필요한
              브릭의 색상, 형태, 크기 구성을 어떻게 나눌지 단계별로 정리해 보는
              것을 목표로 합니다.
            </p>

            <ol className="home-how-steps">
              <li>이미지를 업로드하고 분석을 실행합니다.</li>
              <li>색상/영역별로 브릭 그룹을 구상합니다.</li>
              <li>조립 순서를 텍스트 가이드로 정리하는 것을 목표로 합니다.</li>
            </ol>
          </div>

          {/* 오른쪽 샘플 팔레트 카드 */}
          <aside className="home-palette-card">
            <div className="home-palette-dots">
              <span className="dot dot-blue" />
              <span className="dot dot-yellow" />
              <span className="dot dot-red" />
            </div>
            <h3 className="home-palette-title">샘플 레고 브릭 팔레트</h3>
            <p className="home-palette-desc">
              실제 분석 결과는 아직 구현 중이지만, 나중에 요약 미리보기가
              들어갈 자리를 이렇게 카드 형태로 먼저 잡아 두었습니다.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
