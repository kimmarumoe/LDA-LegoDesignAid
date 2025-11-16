import "./index.css";
import UploadPanel from "./components/UploadPanel";
import BrickGuidePanel from "./components/BrickGuidePanel";

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
            <BrickGuidePanel />
          </section>

        </main>
    </div>
  );
}
export default App;
