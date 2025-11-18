// src/pages/Home.jsx
import { Link } from "react-router-dom";

// ✅ 파일의 대표 컴포넌트로 default export
export default function Home() {
  return (
    <main className="home-page">
      <div className="home-inner">
        <h1 className="home-title">LDA (Lego Design Aid)</h1>

        <p className="home-desc">
          이미지를 업로드하면 레고 브릭 조합과 조립 가이드를 제안해주는
          개인 토이 프로젝트입니다. 아래 버튼을 눌러 실제 분석이나 샘플
          결과를 확인해보세요.
        </p>

        <div className="home-actions">
          <Link to="/analyze" className="btn btn-primary">
            이미지 분석 시작하기
          </Link>
          <Link to="/gallery" className="btn btn-outline">
            샘플 결과 구경하기
          </Link>
        </div>
      </div>
    </main>
  );
}
