// frontend/src/api/guideClient.ts
import type { GuideResponse } from "../types/legoGuide";

type NormalizedApiErrorKind =
  | "TIMEOUT"
  | "NETWORK"
  | "HTTP_4XX"
  | "HTTP_5XX"
  | "INVALID_RESPONSE"
  | "ABORTED";

export type NormalizedApiError = {
  kind: NormalizedApiErrorKind;
  message: string;
  status?: number;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => window.clearTimeout(id) };
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 30000,
  externalSignal?: AbortSignal
): Promise<T> {
  const { signal: tSignal, clear } = timeoutSignal(timeoutMs);

  const controller = new AbortController();

  // 외부 signal(Analyze.jsx AbortController) 연동
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // 타임아웃 signal 연동
  tSignal.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      if (isJson) {
        try {
          const data = await res.json();
          message =
            data?.detail ||
            data?.message ||
            data?.error ||
            message;
        } catch {
          // ignore
        }
      }
      const kind: NormalizedApiErrorKind =
        res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX";
      throw { kind, message, status: res.status } satisfies NormalizedApiError;
    }

    if (!isJson) {
      throw { kind: "INVALID_RESPONSE", message: "서버 응답이 JSON이 아닙니다." } satisfies NormalizedApiError;
    }

    const data = (await res.json()) as T;
    return data;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // 타임아웃/사용자취소 모두 AbortError라서 메시지로 구분
      // 여기서는 간단히 ABORTED로 통일
      throw { kind: "ABORTED", message: "요청이 취소되었습니다." } satisfies NormalizedApiError;
    }

    if (err && typeof err === "object" && typeof err.kind === "string") {
      throw err;
    }

    throw { kind: "NETWORK", message: "네트워크 오류가 발생했습니다." } satisfies NormalizedApiError;
  } finally {
    clear();
  }
}

/**
 * 이미지 파일로 가이드 분석: /api/guide/analyze
 * options는 서버 스키마에 맞게 JSON 문자열로 전달
 */
export async function analyzeGuide(
  imageFile: File,
  options?: unknown,
  signal?: AbortSignal
): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile);

  if (options) {
    form.append("options", JSON.stringify(options));
  }

  return requestJson<GuideResponse>(
    `${API_BASE_URL}/api/guide/analyze`,
    { method: "POST", body: form },
    30000,
    signal
  );
}
