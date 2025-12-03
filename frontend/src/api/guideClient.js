// frontend/src/api/guideClient.js

const API_BASE_URL =
  import.meta.env.VITE_LDA_AI_BASE_URL ?? "http://localhost:8000";

/**
 * 이미지 파일을 넘기면 FastAPI 서버에 분석을 요청하고
 * 레고 조립 가이드(JSON)를 반환하는 함수.
 */
export async function createGuide(imageFile) {
  if (!imageFile) {
    throw new Error("이미지 파일이 없습니다.");
  }

  const formData = new FormData();
  formData.append("image", imageFile); // FastAPI 파라미터 이름과 동일해야 함

  const response = await fetch(`${API_BASE_URL}/api/guide/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "";
    try {
      message = await response.text();
    } catch (_) {
      // 응답 본문이 없거나 파싱 실패해도 무시
    }
    throw new Error(
      `가이드 생성 요청 실패 (${response.status})` +
        (message ? ` - ${message}` : "")
    );
  }

  const data = await response.json();
  return data; // { summary: {...}, groups: [...] } 형태
}
