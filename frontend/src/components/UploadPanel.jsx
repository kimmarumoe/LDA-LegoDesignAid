// frontend/src/components/UploadPanel.jsx
import { useRef } from "react";

/**
 * 이미지 업로드 + 분석 버튼 + 샘플 토글을 담당하는 입력 패널
 * - 파일명/선택 상태는 부모(Analyze.jsx)의 selectedFile을 단일 출처(SSOT)로 사용
 */
export default function UploadPanel({
  onImageSelect,
  onAnalyze,
  previewUrl,
  selectedFile,
  analysisStatus,
  useSample,
  onToggleSample,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onImageSelect?.(file, url);
  };

  const isRunning = analysisStatus === "running";
  const isAnalyzable = !isRunning && (Boolean(previewUrl) || useSample);

  const handleClickAnalyze = () => {
    if (!isAnalyzable) return;
    onAnalyze?.();
  };

  const handleToggleSample = (event) => {
    onToggleSample?.(event.target.checked);
  };

  return (
    <section className="panel upload-panel">
      <h2 className="panel-title">1. 이미지 / 디자인 업로드</h2>
      <p className="panel-desc">
        레고로 만들고 싶은 그림·로고·캐릭터 이미지를 선택한 뒤,
        <br />
        “분석하기” 버튼을 눌러 브릭 분석을 진행합니다.
      </p>

      <div className="upload-control">
        <label className="upload-label">
          파일 선택
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>

        <p className="upload-filename">
          {selectedFile?.name || "선택된 파일 없음"}
        </p>
      </div>

      <div className="upload-preview">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="선택한 이미지 미리보기"
            className="upload-preview-image"
          />
        ) : (
          <p className="preview-placeholder">
            이미지를 선택하면 여기에서 미리보기를 확인할 수 있어요.
          </p>
        )}
      </div>

      <div className="upload-actions">
        <label className="sample-toggle">
          <input
            type="checkbox"
            checked={useSample}
            onChange={handleToggleSample}
            disabled={isRunning}
          />
          <span>샘플 데이터로만 보기</span>
        </label>

        <button
          type="button"
          onClick={handleClickAnalyze}
          disabled={!isAnalyzable}
          className="btn-primary"
        >
          {isRunning ? "분석 중..." : "분석하기"}
        </button>

        <p className="upload-actions-hint">
          이미지를 업로드하거나 샘플 데이터로 브릭 분석을 테스트해볼 수 있어요.
        </p>
      </div>
    </section>
  );
}
