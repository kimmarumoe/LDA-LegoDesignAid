// frontend/src/api/guideClient.ts
import type { GuideResponse } from "../types/legoGuide";

// .env.development 에서 설정한 API 서버 주소 사용
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:9000").replace(
  /\/+$/,
  "",
);

type RequestOptions = {
  signal?: AbortSignal;
};

/**
 * 이미지 파일로 가이드 분석 요청
 * - 왜: 백엔드 실제 엔드포인트(/api/guide/analyze)는 multipart/form-data(image) 기반
 * - 주의: FormData 사용 시 Content-Type을 직접 지정하지 않는다(브라우저가 boundary 포함해서 자동 설정)
 */
export async function analyzeGuide(
  imageFile: File,
  options: RequestOptions = {},
): Promise<GuideResponse> {
  if (!imageFile) throw new Error("이미지 파일이 없습니다.");

  const form = new FormData();
  form.append("image", imageFile); // Swagger와 동일한 필드명

  const res = await fetch(`${API_BASE_URL}/api/guide/analyze`, {
    method: "POST",
    body: form,
    signal: options.signal,
  });

  if (!res.ok) {
    // FastAPI는 보통 {"detail": "..."} 형태로 내려옴
    const text = await res.text().catch(() => "");
    throw new Error(`Guide API error (${res.status}): ${text}`);
  }

  return (await res.json()) as GuideResponse;
}
