import { useRef } from "react";
import BrickSizeSelector from "./BrickSizeSelector.jsx";

export default function UploadPanel({
  previewUrl,
  hasFile,
  fileName,
  useSample,
  onToggleSample,
  analysisStatus,
  analysisError,
  onImageSelect,
  onAnalyze,
  onReset,

  isOptionsOpen,
  onToggleOptions,
  gridSize,
  colorLimit,
  onChangeGridSize,
  onChangeColorLimit,

  // 브릭 옵션 추가
  brickMode,
  brickAllowed,
  onChangeBrickMode,
  onChangeBrickAllowed,
}) {
  const lastObjectUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;

    onImageSelect(file, url);
  };

  const handleResetClick = () => {
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (typeof onReset === "function") onReset();
  };

  const isRunning = analysisStatus === "running";
  const canAnalyze = useSample || hasFile;

  const optionSummary = `${gridSize} · ${
    Number(colorLimit) === 0 ? "제한 없음" : `${colorLimit}색`
  }`;

  return (
    <section className="panel upload-panel">
      <h2>1. 이미지/디자인 업로드</h2>
      <p className="panel-desc">레고로 만들고 싶은 이미지를 선택하세요.</p>

      <div className="upload-control">
        <label className="check-row">
          <input
            type="checkbox"
            checked={useSample}
            onChange={(e) => onToggleSample(e.target.checked)}
            disabled={isRunning}
          />
          <span>샘플 모드</span>
        </label>

        <div className="upload-row">
          <label className="upload-label">
            파일 선택
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isRunning}
            />
          </label>

          <span
            className="upload-filename"
            style={{ opacity: useSample ? 0.55 : 1 }}
          >
            {hasFile ? fileName : "선택된 파일 없음"}
          </span>
        </div>

        <div className="option-row">
          <button
            type="button"
            className="option-toggle"
            onClick={onToggleOptions}
            disabled={isRunning}
            aria-expanded={isOptionsOpen}
          >
            <span className="option-toggle__title">분석 옵션</span>
            <span className="option-toggle__summary">{optionSummary}</span>
            <span className="option-toggle__chev">
              {isOptionsOpen ? "▲" : "▼"}
            </span>
          </button>

          <span className="option-hint">
            옵션 변경 시 결과가 초기화되고 재분석이 필요합니다.
          </span>
        </div>

        {isOptionsOpen && (
          <div className="option-panel">
            <div className="option-field">
              <label className="option-label">그리드 크기</label>
              <select
                className="form-select"
                value={gridSize}
                onChange={(e) => onChangeGridSize(e.target.value)}
                disabled={isRunning}
              >
                <option value="16x16">16 x 16</option>
                <option value="32x32">32 x 32</option>
                <option value="48x48">48 x 48</option>
              </select>
              <div className="option-sub">
                커스텀 크기는 다음 업데이트에서 지원됩니다.
              </div>
            </div>

            <div className="option-field">
              <label className="option-label">색상 개수 제한</label>
              <select
                className="form-select"
                value={String(colorLimit)}
                onChange={(e) => onChangeColorLimit(e.target.value)}
                disabled={isRunning}
              >
                <option value="0">제한 없음</option>
                <option value="8">8 색</option>
                <option value="16">16 색</option>
                <option value="24">24 색</option>
              </select>

              <div className="option-sub">
                색상 제한이 낮을수록 단순화되고, 높을수록 원본에 가까워집니다.
              </div>
            </div>

            <BrickSizeSelector
              mode={brickMode}
              allowed={brickAllowed}
              onChangeMode={onChangeBrickMode}
              onChangeAllowed={onChangeBrickAllowed}
            />
          </div>
        )}

        {!useSample && !hasFile && (
          <p className="upload-actions-hint">
            실데이터 모드에서는 이미지를 업로드해야 분석할 수 있어요.
          </p>
        )}

        {analysisStatus === "error" && analysisError && (
          <div className="error-box" style={{ marginTop: 12 }}>
            {analysisError}
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="upload-preview">
          <img src={previewUrl} alt="preview" className="upload-preview-image" />
        </div>
      )}

      <div className="upload-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={onAnalyze}
          disabled={isRunning || !canAnalyze}
        >
          {isRunning ? "분석중..." : "분석하기"}
        </button>

        <button
          type="button"
          className="btn-reset"
          onClick={handleResetClick}
          disabled={isRunning}
          aria-label="분석 상태 초기화"
        >
          초기화
        </button>
      </div>
    </section>
  );
}
