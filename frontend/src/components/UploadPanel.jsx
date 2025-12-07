// frontend/src/components/UploadPanel.jsx
import { useRef, useState } from "react";

/**
 * 이미지 업로드 + 분석 버튼 + 샘플 토글을 담당하는 입력 패널
 *
 * @param {Object} props
 * @param {(file: File, previewUrl: string) => void} props.onImageSelect
 * @param {() => void} props.onAnalyze
 * @param {string | null} props.previewUrl
 * @param {"idle" | "running" | "done" | "error"} props.analysisStatus
 * @param {boolean} props.useSample
 * @param {(useSample: boolean) => void} props.onToggleSample
 */
export default function UploadPanel({
  onImageSelect,
  onAnalyze,
  previewUrl,
  analysisStatus,
  useSample,
  onToggleSample,
}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");

  // 파일 선택 시: File + 미리보기 URL을 부모로 전달
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileName(file.name);
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
        &quot;분석하기&quot; 버튼을 눌러 브릭 조립 가이드를 생성합니다.
      </p>

      {/* 파일 선택 영역 */}
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
          {fileName || "선택된 파일 없음"}
        </p>
      </div>

      {/* 미리보기 영역 */}
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

      {/* 샘플/실제 토글 + 분석 버튼 */}
      <div className="upload-actions">
        <label className="sample-toggle">
          <input
            type="checkbox"
            checked={useSample}
            onChange={handleToggleSample}
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
