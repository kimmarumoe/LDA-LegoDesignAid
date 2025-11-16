import "./index.css";
import UploadPanel from "./components/UploadPanel";

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>LDA (Lego Design Aid)</h1>
        <p className="app-subtitle">이미지,그림,사진 업로드하고, 레고브릭 설계 도움을 받는 개인 토이 프로젝트</p>
        </header>

        <main className="app-main">
          <section className="panel upload-panel">
            <UploadPanel />
          </section>

          <section className="panel result-panel">
            <h2>2.브릭 분석 &amp; 조립 가이드</h2>
            <p className="panel-desc">
              필요한 브릭 종류/ 개수 / 조립 순서가 여기 표시될 예정입니다
            </p>

            {/* TODO 나중에 서버 분석 결과를 리스트/카드 형태로 보여주기 */}
            <div className="result-placeholder">
              <span>분석 결과 표시 영역</span>
            </div>  
          </section>
        </main>
    </div>
  );
}
export default App;
