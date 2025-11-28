// frontend/src/components/UploadPanel.jsx

// 이미지 업로드, 미리보기
export default function UploadPanel({
  file,
  previewUrl,
  onSelect,
  onAnalyze,
  analysisStatus,
}) {
  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];

    if (!selected) {
      // 파일 선택을 취소한 경우
      onSelect?.(null, null);
      return;
    }

    const url = URL.createObjectURL(selected);
    onSelect?.(selected, url);
  };

  const hasFile = !!file;
  const isRunning = analysisStatus === "running";

  let buttonLabel = "이미지 분석 시작";
  if (analysisStatus === "running") {
    buttonLabel = "분석 중...";
  } else if (analysisStatus === "done") {
    buttonLabel = "다시 분석하기";
  }

  return (
    <section className="panel upload-panel">
      <h2>1. 이미지 / 디자인 업로드</h2>
      <p className="panel-desc">
        레고로 만들고 싶은 그림, 로고, 캐릭터 이미지를 선택하세요.
      </p>

      {/* 파일 선택 */}
      <div className="upload-control">
        <label className="upload-label">
          이미지 선택하세요
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
        {file && (
          <p className="upload-filename">선택된 파일: {file.name}</p>
        )}
      </div>

      {/* 미리보기 */}
      <div className="upload-preview">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="미리보기"
            className="upload-preview-image"
          />
        ) : (
          <p className="preview-placeholder">
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
          disabled={!hasFile || isRunning}
        >
          {buttonLabel}
        </button>
        <p className="upload-actions-hint">
          이미지를 선택한 뒤 &quot;이미지 분석&quot; 버튼을 누르면 오른쪽
          패널에 브릭 추천 결과와 조립 가이드가 표시됩니다.
        </p>
      </div>
    </section>
  );
}
