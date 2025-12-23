// frontend/src/config/env.ts
const isDev = import.meta.env.MODE === "development";

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;

  // ✅ 개발 환경은 편의상 기본값 허용
  if (isDev && (!raw || raw.trim() === "")) {
    return "http://localhost:9000";
  }

  // ✅ 배포/프리뷰는 반드시 명시 (조용히 망가지는 것 방지)
  if (!raw || raw.trim() === "") {
    throw new Error(
      "VITE_API_BASE_URL 이 설정되어 있지 않습니다. (Vercel 환경변수/로컬 .env 확인)"
    );
  }

  // ✅ URL 형식 검증
  try {
    const url = new URL(raw);
    // 끝 슬래시 제거 통일
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      `VITE_API_BASE_URL 형식이 올바르지 않습니다: "${raw}"`
    );
  }
}
