// frontend/src/api/guideClient.ts
import type { GuideResponse } from "../types/legoGuide";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:9000";

export async function analyzeGuide(imageFile: File): Promise<GuideResponse> {
  const form = new FormData();
  form.append("image", imageFile);

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
