import { useEffect, useRef } from "react";

/**
 * UploadPanel
 * - 파일 선택 / 샘플 토글 / 분석 실행 버튼 UI만 담당 (SRP)
 * - 실제 상태/흐름은 Analyze.jsx가 담당
 */
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
}) {
  // ObjectURL 누수 방지용 (새 파일 선택/리셋 시 이전 URL revoke)
  const lastObjectUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ previewUrl이 null로 내려오면(부모에서 리셋), 마지막 objectURL도 정리
  useEffect(() => {
    if (!previewUrl && lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
  }, [previewUrl]);

  // ✅ 언마운트 시 마지막 objectURL 정리
  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  // ✅ 샘플 모드 ON이면 파일 입력값도 비워서(재선택 onChange 보장) UX 혼선 방지
  useEffect(() => {
    if (useSample && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [useSample]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    // ✅ 파일을 고르는 순간 “내 이미지 분석” 의도라고 보고 샘플 모드 자동 해제
    if (useSample) onToggleSample(false);

    // 이전 URL 정리
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;

    onImageSelect(file, url);
  };

  const isRunning = analysisStatus === "running";
  const canAnalyze = useSample || hasFile;

  return (
    <section className="panel upload-panel">
      <h2>1. 이미지/디자인 업로드</h2>
      <p className="panel-desc">
        레고로 만들고 싶은 그림/로고/캐릭터 이미지를 선택하세요.
      </p>

      <div className="upload-control">
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={useSample}
            onChange={(e) => onToggleSample(e.target.checked)}
            disabled={isRunning}
          />
          샘플 모드
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
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

          <span className="upload-filename" style={{ opacity: useSample ? 0.5 : 1 }}>
            {hasFile ? fileName : "선택된 파일 없음"}
          </span>
        </div>

        {!useSample && !hasFile && (
          <p className="upload-actions-hint" style={{ marginTop: 8 }}>
            실데이터 모드에서는 이미지를 업로드해야 분석할 수 있어요.
          </p>
        )}

        {analysisStatus === "error" && analysisError && (
          <div className="error-box" style={{ marginTop: 12 }}>
            {analysisError}
          </div>
        )}
      </div>

      {/* ✅ 원본 이미지는 UploadPanel에서만 */}
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
      </div>
    </section>
  );
}
