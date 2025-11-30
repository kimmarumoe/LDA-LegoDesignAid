// src/components/Layout.jsx
import { NavLink } from "react-router-dom";
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
 * - 상단 LDA 네비게이션 바 + 본문(main)
 */
export default function Layout({ children }) {
  return (
    <div className="app-root">
      {/* 상단 네비게이션 바 */}
      <header className="app-header">
        <div className="app-header-inner">
          {/* 왼쪽: 브랜드 로고 텍스트 */}
          <div className="app-logo">LDA</div>

          {/* 오른쪽: 네비게이션 메뉴 */}
          <nav className="app-nav">
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

      {/* 페이지별 내용 */}
      <main className="app-main">{children}</main>
    </div>
  );
}
