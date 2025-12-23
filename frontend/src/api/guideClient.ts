// frontend/src/api/guideClient.ts
import type { GuideResponse } from "../types/legoGuide";

/**
 * ✅ P0 목적
 * - VITE_API_BASE_URL 누락/오타로 배포에서 조용히 망가지는 것 방지
 * - 응답이 JSON이 아닐 때(HTML 에러 페이지 등)도 잡기
 * - 네트워크/4xx/5xx/응답형식 오류를 메시지로 표준화
 */

// 1) API BASE URL 안전하게 정규화 (끝 슬래시 제거)
const API_BASE_URL = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

  try {
    const url = new URL(raw);
    return url.toString().replace(/\/$/, "");
  } catch {
    // 배포에서 env가 이상하면 바로 알게 하려고 throw 하는 것도 가능하지만,
    // "최소 변경" 버전이라 우선 fallback 처리
    return "http://localhost:9000";
  }
})();

// 2) 에러 표준 타입(최소)
export type ApiErrorKind = "NETWORK" | "TIMEOUT" | "HTTP_4XX" | "HTTP_5XX" | "INVALID_RESPONSE";

export type NormalizedApiError = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  detail?: unknown;
};

// 3) fetch 래퍼(최소)
// - timeout
// - JSON 파싱 실패(HTML 등) 대응
async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (e: any) {
    clearTimeout(timer);

    if (e?.name === "AbortError") {
      throw <NormalizedApiError>{
        kind: "TIMEOUT",
        message: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        detail: e,
      };
    }

    throw <NormalizedApiError>{
      kind: "NETWORK",
      message: "네트워크 오류가 발생했습니다. 인터넷 연결 또는 서버 상태를 확인해주세요.",
      detail: e,
    };
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();

  // JSON 파싱(실패하면 INVALID_RESPONSE)
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // 서버가 JSON이 아닌 응답을 준 경우(HTML 오류 페이지 등)
      throw <NormalizedApiError>{
        kind: "INVALID_RESPONSE",
        status: res.status,
        message: "서버 응답 형식이 올바르지 않습니다(JSON 파싱 실패).",
        detail: text,
      };
    }
  }

  if (!res.ok) {
    // 백엔드가 { detail } 또는 { error: { message } } 중 무엇을 주더라도 메시지 뽑아냄
    const msg =
      data?.error?.message ??
      data?.detail ??
      (res.status >= 500 ? "서버 오류가 발생했습니다." : "요청이 올바르지 않습니다.");

    throw <NormalizedApiError>{
      kind: res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX",
      status: res.status,
      message: msg,
      detail: data,
    };
  }

  return data as T;
}

/** ✅ 배포 검증용 헬스체크 */
export async function healthCheck(): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`${API_BASE_URL}/health`, {
    method: "GET",
  });
}

/** ✅ 이미지 파일로 가이드 분석: /api/guide/analyze */
export async function analyzeGuide(imageFile: File): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile);

  return requestJson<GuideResponse>(
    `${API_BASE_URL}/api/guide/analyze`,
    {
      method: "POST",
      body: form,
    },
    30000 // 업로드는 넉넉히
  );
}
