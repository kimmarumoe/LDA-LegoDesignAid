// src/components/layout/Footer.jsx
import "./Footer.css";

/**
 * Footer (미니 버전)
 * - 랜딩/앱 톤을 해치지 않도록 얇게 유지
 * - 신뢰 요소(링크/카피)만 최소로 제공
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__inner">
        <p className="app-footer__copy">
          © {year} LDA (Lego Design Aid) · Personal Toy Project
        </p>

        <nav className="app-footer__links" aria-label="푸터 링크">
          <a href="#" onClick={(e) => e.preventDefault()}>
            GitHub
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
