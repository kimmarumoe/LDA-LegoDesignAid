// frontend/src/api/guideClient.ts

import type {
  Brick,
  GuideRequest,
  GuideResponse,
} from "../types/legoGuide";

// .env.development 에서 설정한 API 서버 주소 사용
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

/**
 * 레고 조립 가이드 생성 API 호출 함수
 * - 입력: 브릭 배열 + 선택 meta 정보
 * - 출력: GuideResponse (단계별 가이드 + 요약 + 통계)
 */
export async function createGuide(
  bricks: Brick[],
  meta?: GuideRequest["meta"],
): Promise<GuideResponse> {
  // 타입을 GuideRequest로 명시해서, 필드 누락/오타를 컴파일 단계에서 잡도록 함
  const payload: GuideRequest = { bricks, meta };

  const res = await fetch(`${API_BASE_URL}/api/guide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // HTTP 에러(400, 500 등) 처리
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Guide API error (${res.status}): ${text}`);
  }

  // 응답 JSON을 GuideResponse 타입으로 파싱
  const data: GuideResponse = await res.json();
  return data;
}
