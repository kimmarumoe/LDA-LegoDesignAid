import { useState } from "react";
import "./index.css";
import UploadPanel from "./components/UploadPanel";
import BrickGuidePanel from "./components/BrickGuidePanel";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState("idle"); // idle, analyzing, ready
  
  const handleImageSelect = (File, url) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!File) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalysisStatus("idle");
      return;
    }

    setSelectedFile(File);
    setPreviewUrl(url);
    setAnalysisStatus("idle");
  };

  const handleAnalyze = () => {
    if (!selectedFile||analysisStatus=== "running") return;

    setAnalysisStatus("running");

    //todo 실제 분석 api 연동
    setTimeout(() => {
      setAnalysisStatus("done");
    },1000);
  };
  
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo-row">
          <div className="app-logo-mark">
            <span className="app-logo-text-short">LDA</span>
          </div>

          <div>
            <h1>LDA (Lego Design Aid)</h1>
            <p className="app-subtitle">이미지,그림,사진 업로드하고, 레고브릭 설계 도움을 받는 개인 토이 프로젝트</p>
          </div>
        </div>
      </header>

        <main className="app-main">
          <section className="panel upload-panel">
            <UploadPanel 
              file={selectedFile}
              previewUrl={previewUrl}               
              analysisStatus={analysisStatus}
              onSelect={handleImageSelect}
              onAnalyze={handleAnalyze}
            />
            <BrickGuidePanel 
            analysisStatus={analysisStatus}
            fileName={selectedFile?.name ?? ""}
            />
          </section>
        </main>
    </div>
  );
}
export default App;
