// src/components/layout/Layout.jsx
import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { getInitialTheme, saveTheme } from "../../utils/theme.js";
import Footer from "./Footer";
import "./Layout.css";
import AccountMenu from "./AccountMenu.jsx";

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
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState({ path: "", open: false });
  const [accountError, setAccountError] = useState("");
  const mobileOpen = mobileMenu.open && mobileMenu.path === location.pathname;
  const closeMenu = () => setMobileMenu({ path: location.pathname, open: false });
  const [theme, setTheme] = useState(getInitialTheme);

  const handleThemeChange = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    saveTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div className="app-root">
      <header className="app-header" onKeyDown={(event) => {
        if (event.key === "Escape" && mobileOpen) {
          closeMenu();
          document.getElementById("mobile-menu-trigger")?.focus();
        }
      }}>
        <div className="app-header-inner">
          <Link to="/" className="app-logo" aria-label="LDA 메인 화면" onClick={closeMenu}>LDA</Link>

          <nav id="main-navigation" className={`app-nav${mobileOpen ? " app-nav--open" : ""}`} aria-label="메인 네비게이션">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMenu}
                className={({ isActive }) =>
                  "app-nav-link" + (isActive ? " app-nav-link-active" : "")
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="theme-trigger"
              onClick={handleThemeChange}
              aria-label={theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경"}
              title={theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경"}
            >
              {theme === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>
            <AccountMenu onNavigate={closeMenu} onError={setAccountError} />
            <button id="mobile-menu-trigger" type="button" className="mobile-menu-trigger" aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={mobileOpen} aria-controls="main-navigation" onClick={() => setMobileMenu({ path: location.pathname, open: !mobileOpen })}>
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {accountError && <p className="header-account-error" role="alert">{accountError}</p>}
      </header>

      <main className="app-main">{children}</main>

      <Footer />
    </div>
  );
}
