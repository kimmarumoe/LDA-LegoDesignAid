// src/components/layout/Layout.jsx
import { NavLink } from "react-router-dom";
import Footer from "./Footer"; // ✅ 같은 폴더
import "./Layout.css";

// 상단 네비게이션에 표시할 메뉴 정의
const NAV_ITEMS = [
  { to: "/", label: "홈", end: true },
  { to: "/analyze", label: "분석" },
  { to: "/sample", label: "샘플" },
];

/**
 * Layout
 * - 앱 전체 공통 레이아웃
 * - 상단 네비게이션 + 본문(main) + Footer
 */
export default function Layout({ children }) {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">LDA</div>

          <nav className="app-nav" aria-label="메인 네비게이션">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  "app-nav-link" + (isActive ? " app-nav-link-active" : "")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <Footer />
    </div>
  );
}
