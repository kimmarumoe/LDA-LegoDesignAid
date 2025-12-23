// frontend/src/api/http.ts
export type ApiErrorKind =
  | "NETWORK"
  | "TIMEOUT"
  | "HTTP_4XX"
  | "HTTP_5XX"
  | "INVALID_RESPONSE"
  | "UNKNOWN";

export type NormalizedApiError = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  detail?: unknown;
};

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function http<T>(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const timeoutMs = init.timeoutMs ?? 15000;

  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      signal: init.signal ?? timeoutSignal(timeoutMs),
    });
  } catch (e: any) {
    // fetch 자체 실패(네트워크/차단/CORS/abort)
    if (e?.name === "AbortError") {
      throw <NormalizedApiError>{
        kind: "TIMEOUT",
        message: "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        detail: e,
      };
    }
    throw <NormalizedApiError>{
      kind: "NETWORK",
      message:
        "네트워크 오류가 발생했습니다. 인터넷 연결 또는 서버 상태를 확인해주세요.",
      detail: e,
    };
  }

  // 응답 바디를 먼저 텍스트로 받아두면 JSON 파싱 실패도 잡기 쉬움
  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // JSON이 아닌 응답(HTML 에러 페이지 등)
      if (!res.ok) {
        throw <NormalizedApiError>{
          kind: res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX",
          status: res.status,
          message:
            res.status >= 500
              ? "서버 오류가 발생했습니다."
              : "요청이 올바르지 않습니다.",
          detail: text,
        };
      }
      throw <NormalizedApiError>{
        kind: "INVALID_RESPONSE",
        status: res.status,
        message: "서버 응답 형식이 올바르지 않습니다(JSON 파싱 실패).",
        detail: text,
      };
    }
  }

  if (!res.ok) {
    // 백엔드 표준 에러 포맷을 기대: { error: { code, message, detail } }
    const serverMessage =
      data?.error?.message ??
      data?.detail ??
      "요청 처리 중 오류가 발생했습니다.";

    throw <NormalizedApiError>{
      kind: res.status >= 500 ? "HTTP_5XX" : "HTTP_4XX",
      status: res.status,
      message: serverMessage,
      detail: data,
    };
  }

  return data as T;
}
