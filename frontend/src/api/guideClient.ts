// src/api/guideClient.ts
import type { GuideResponse, Brick, GuideRequest } from "../types/legoGuide";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

/** 이미지 파일로 가이드 분석: /api/guide/analyze */
export async function analyzeGuide(imageFile: File): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile); // FastAPI에서 body.image로 받는 그 필드명

  const res = await fetch(`${API_BASE_URL}/api/guide/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Guide API error (${res.status}): ${text}`);
  }

  return (await res.json()) as GuideResponse;
}

/** (선택) 브릭 JSON으로 가이드 생성: /api/guide */
export async function createGuide(
  bricks: Brick[],
  meta?: GuideRequest["meta"],
): Promise<GuideResponse> {
  const payload: GuideRequest = { bricks, meta };

  const res = await fetch(`${API_BASE_URL}/api/guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Guide API error (${res.status}): ${text}`);
  }

  return (await res.json()) as GuideResponse;
}
