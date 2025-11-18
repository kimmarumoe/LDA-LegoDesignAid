import { NavLink } from "react-router-dom";
import "./Layout.css";


/**
 * Layout
 * - 앱 전체 공통 레이아웃 담당
 * - 상단 로고 + 소개 텍스트 + 탭 네비게이션
 * - 본문 영역(main)에 children(각 페이지)을 렌더링
 */
export default function Layout({children}){
    return (
        <div className="app-root">
            <header className="app-header">
                <div className="app-logo-row">
                    <span className="app-logo-text-short">LDA</span>
                </div>
                <div>
                    <h1>LDA (Lego Design Aid)</h1>
                    <p className="app-subtitle">
                        이미지를 업로드하면 레고 브릭 조합 가이드를 제한해주는 프로젝트
                    </p>
                </div>
                <nav className="app-nav">
                    <NavLink 
                        to="/"
                        end
                        className={({isActive})=>
                        "app-nav-link"+(isActive?"app-nav-link-active":"")
                        }
                        >
                        홈
                    </NavLink>
                    <NavLink
                        to="/analyze"
                        className={({ isActive }) =>
                        "app-nav-link" + (isActive ? " app-nav-link-active" : "")
                        }
                    >
                        이미지 분석
                    </NavLink>

                    <NavLink
                        to="/gallery"
                        className={({ isActive }) =>
                        "app-nav-link" + (isActive ? " app-nav-link-active" : "")
                        }
                    >
                        샘플 결과
                    </NavLink>        
                </nav>
            </header>
            <main className="app-main">
            {children}
            </main>
        </div>

    );
}