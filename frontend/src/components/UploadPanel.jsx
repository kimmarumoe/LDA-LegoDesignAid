// frontend/src/components/UploadPanel.jsx
export default function UploadPanel({
  selectedFile,
  previewUrl,
  analysisStatus,
  onImageSelect,
  onAnalyze,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onImageSelect?.(file, url);
  };

  const isAnalyzing = analysisStatus === "running";

  return (
    <section className="panel upload-panel">
      <h2>1. 이미지 / 디자인 업로드</h2>
      <p className="panel-desc">
        레고로 만들고 싶은 그림, 로고, 캐릭터 이미지를 선택하세요.
      </p>

      {/* 파일 선택 */}
      <div className="upload-field">
        <label className="btn-primary">
          이미지 선택
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        {selectedFile && (
          <span className="upload-file-name">{selectedFile.name}</span>
        )}
      </div>

      {/* 미리보기 */}
      <div className="upload-preview">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="업로드 미리보기"
            className="upload-preview-image"
          />
        ) : (
          <p className="upload-preview-placeholder">
            아직 선택된 이미지가 없습니다.
          </p>
        )}
      </div>

      {/* 분석 버튼 */}
      <div className="upload-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onAnalyze}
          disabled={isAnalyzing || !selectedFile}
        >
          {isAnalyzing ? "분석 중..." : "분석 실행"}
        </button>
      </div>
    </section>
  );
}
