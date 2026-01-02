// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import "./Home.css";

const FEATURES = [
  {
    icon: "🎯",
    title: "이미지 → 브릭 맵핑",
    desc: "업로드한 이미지를 분석하여 레고 브릭으로 표현 가능한 형태와 색상으로 자동 변환합니다.",
  },
  {
    icon: "📊",
    title: "브릭 사용량 계산",
    desc: "필요한 브릭의 종류(1×1, 1×2, 2×2...)와 색상별 개수를 정확하게 계산하여 리스트로 보여드립니다.",
  },
  {
    icon: "📋",
    title: "조립 순서 가이드",
    desc: "층별, 단계별로 나눈 조립 가이드를 제공하여 실제 제작 시 참고할 수 있습니다.",
  },
];

const STEPS = [
  {
    title: "이미지 업로드하고 분석 설정",
    desc: "그림, 디자인, 사진 등 원하는 이미지를 업로드하세요. 최종 그리드 크기(16x16 / 32x32 / 48x48)와 색상 수(4색 / 8색 / 12색)를 선택할 수 있습니다.",
  },
  {
    title: "색상/형태별로 브릭 구성 상상해 보기",
    desc: "이미지를 분석하여 레고 브릭으로 변환하고, 필요한 브릭의 사양(색상, 형태, 개수)을 계산합니다. 어떤 구조와 배치가 필요한지 확인할 수 있어요.",
  },
  {
    title: "조립 순서를 텍스트 가이드로 정리하기",
    desc: "변환된 레고 이미지와 함께 브릭 리스트(BOM), 그리고 간단한 조립 가이드를 확인하세요. 실제로 만들 때 참고할 수 있는 단계별 안내를 제공합니다.",
  },
];

const USERS = [
  { emoji: "🎨", title: "크리에이터", desc: "자신만의 캐릭터, 로고를 레고로 구현하고 싶은 분" },
  { emoji: "👨‍👩‍👧", title: "부모 & 선생님", desc: "아이들과 레고 창작을 하고 싶은 분" },
  { emoji: "🧱", title: "레고 덕후", desc: "MOC 작품을 만들고 싶은 레고 애호가" },
  { emoji: "✨", title: "입문자", desc: "레고를 시작하며 작품을 만들고 싶은 분" },
];

export default function Home() {
  // HTML script로 만들던 demo grid를 React 렌더로 전환
  const demo = useMemo(() => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#FFE66D",
      "#95E1D3",
      "#F38181",
      "#AA96DA",
      "#FCBAD3",
      "#A8D8EA",
    ];

    const pattern = [
      [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
      [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
      [6, 6, 7, 7, 0, 0, 1, 1, 2, 2, 3, 3],
      [6, 6, 7, 7, 0, 0, 1, 1, 2, 2, 3, 3],
      [4, 4, 5, 5, 6, 6, 7, 7, 0, 0, 1, 1],
      [4, 4, 5, 5, 6, 6, 7, 7, 0, 0, 1, 1],
      [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
      [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
    ];

    const bricks = [];
    pattern.forEach((row) => row.forEach((idx) => bricks.push(colors[idx])));
    return bricks;
  }, []);

  // 스크롤 등장 애니메이션 (IntersectionObserver)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".home-page .reveal"));

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.25 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="home-page">

      {/* HERO */}
      <section className="home-hero">
        <div className="home-container home-hero-inner">
          <div className="home-hero-content">
            <div className="home-hero-tag">🧱 레고 디자인 도우미</div>

            <h1 className="home-h1">
              이미지로<br />
              나만의 레고 세트<br />
              설계하기
            </h1>

            <p className="home-subtitle">
              LDA(Lego Design Aid)는 만들고 싶은 그림이나 캐릭터를 업로드하면, 필요한 브릭 조립까지
              구성해 볼 수 있도록 도와주는 개인 토이 프로젝트입니다.
            </p>

            <div className="home-cta-group">
              <Link to="/analyze" className="home-btn home-btn-primary">
                이미지 분석 시작하기
              </Link>
              <Link to="/gallery" className="home-btn home-btn-secondary">
                샘플 결과 구경하기
              </Link>
            </div>

            <div className="home-hero-stats">
              <div className="home-stat">
                <span>✅</span>
                <span>브릭 자동 계산</span>
              </div>
              <div className="home-stat">
                <span>📋</span>
                <span>조립 가이드 제공</span>
              </div>
            </div>
          </div>

          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-demo-container">
              <div className="home-demo-header">
                <span className="home-demo-dot dot-red" />
                <span className="home-demo-dot dot-yellow" />
                <span className="home-demo-dot dot-green" />
              </div>

              <div className="home-demo-content">
                <div className="home-demo-bg-pattern" />
                <div className="home-demo-grid">
                  {demo.map((c, i) => (
                    <div key={i} className="home-brick" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-features home-section" id="features">
        <div className="home-container">
          <div className="home-section-header">
            <h2 className="home-section-title">
              이미지를 올리면<br />
              브릭 구성을 상상해 볼 수 있어요
            </h2>
            <p className="home-section-desc">아이디어를 실제 설계로 옮기는 3가지 핵심 기능</p>
          </div>

          <div className="home-features-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="home-feature-card reveal">
                <div className="home-feature-icon">{f.icon}</div>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="home-how home-section" id="how">
        <div className="home-container">
          <div className="home-section-header">
            <h2 className="home-section-title">어떻게 작동하나요?</h2>
            <p className="home-section-desc">간단한 3단계로 아이디어를 레고 설계로 변환</p>
          </div>

          <div className="home-steps-container">
            {STEPS.map((s, idx) => (
              <div key={s.title} className="home-step reveal">
                <div className="home-step-number">{idx + 1}</div>
                <div className="home-step-content">
                  <h3 className="home-step-title">{s.title}</h3>
                  <p className="home-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARGET USERS */}
      <section className="home-target home-section" id="target">
        <div className="home-container">
          <div className="home-section-header">
            <h2 className="home-section-title">누구를 위한 서비스인가요?</h2>
            <p className="home-section-desc">레고로 자신만의 작품을 만들고 싶은 모든 분들을 위해</p>
          </div>

          <div className="home-users-grid">
            {USERS.map((u) => (
              <article key={u.title} className="home-user-card reveal">
                <div className="home-user-emoji">{u.emoji}</div>
                <h3 className="home-user-title">{u.title}</h3>
                <p className="home-user-desc">{u.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-final-cta">
        <div className="home-container">
          <h2>지금 바로 시작해보세요</h2>
          <p>당신의 아이디어를 레고로 구현하는 첫 걸음</p>
          <Link to="/analyze" className="home-btn home-btn-primary home-btn-invert">
            무료로 시작하기
          </Link>
        </div>
      </section>
    </div>
  );
}
