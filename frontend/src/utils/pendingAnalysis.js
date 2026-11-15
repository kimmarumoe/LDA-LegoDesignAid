// 로그인 이동에 필요한 완성 결과만 같은 탭에 30분 동안 보관한다.
export const PENDING_ANALYSIS_KEY = "lda-pending-analysis-v1";
export const PENDING_ANALYSIS_TTL = 30 * 60 * 1000;
const MAX_JSON_SIZE = 12 * 1024 * 1024;
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

function validDraft(draft) {
  const meta = draft?.analysis?.meta;
  return isRecord(draft) && draft.version === 1 && typeof draft.id === "string" && draft.id.length > 0 &&
    Number.isFinite(draft.createdAt) && (draft.ownerId === null || (Number.isInteger(draft.ownerId) && draft.ownerId > 0)) &&
    typeof draft.title === "string" && draft.title.length <= 80 && typeof draft.useSample === "boolean" &&
    (draft.sampleId === null || typeof draft.sampleId === "string") && isRecord(draft.options) &&
    isRecord(draft.analysis?.summary) && isRecord(meta) &&
    Number.isInteger(meta.width) && meta.width > 0 && meta.width <= 128 &&
    Number.isInteger(meta.height) && meta.height > 0 && meta.height <= 128 &&
    Array.isArray(draft.analysis.bricks) && draft.analysis.bricks.length > 0 && draft.analysis.bricks.length <= 16384 &&
    Array.isArray(draft.steps) && draft.steps.length > 0 && draft.steps.length <= 16384 &&
    draft.steps.every(step => isRecord(step) && Array.isArray(step.bricks) && step.bricks.length > 0);
}

export function savePendingAnalysis(values, settings = {}) {
  const draft = {
    version: 1, id: crypto.randomUUID(), createdAt: settings.now ?? Date.now(),
    ownerId: values.ownerId ?? null, title: values.title ?? "", analysis: values.analysis,
    steps: values.steps, options: values.options ?? {}, useSample: values.useSample,
    sampleId: values.sampleId ?? null,
  };
  if (!validDraft(draft)) throw new Error("완성한 분석 결과와 조립 가이드만 임시 보관할 수 있습니다.");
  const serialized = JSON.stringify(draft);
  if (serialized.length > MAX_JSON_SIZE) throw new Error("임시 보관할 데이터가 너무 큽니다. 현재 화면에서 결과를 유지해 주세요.");
  try {
    (settings.storage ?? window.sessionStorage).setItem(PENDING_ANALYSIS_KEY, serialized);
  } catch {
    throw new Error("브라우저 임시 저장 공간이 부족하거나 차단되어 로그인 화면으로 이동하지 않았습니다. 현재 결과는 유지됩니다.");
  }
  return draft;
}

// 읽을 때 삭제하지 않아 React StrictMode의 반복 초기화에서도 같은 결과를 얻는다.
export function readPendingAnalysis(memberId, settings = {}) {
  try {
    const raw = (settings.storage ?? window.sessionStorage).getItem(PENDING_ANALYSIS_KEY);
    if (!raw) return { status: "missing" };
    if (raw.length > MAX_JSON_SIZE) return { status: "invalid" };
    let draft;
    try { draft = JSON.parse(raw); } catch { return { status: "invalid" }; }
    if (!validDraft(draft)) return { status: "invalid" };
    const age = (settings.now ?? Date.now()) - draft.createdAt;
    if (age < 0 || age >= PENDING_ANALYSIS_TTL) return { status: "expired" };
    if (!memberId) return { status: "login-required" };
    if (draft.ownerId !== null && draft.ownerId !== memberId) return { status: "different-member" };
    return { status: "ready", draft };
  } catch {
    // 잘못된 JSON과 저장소 접근 차단 모두 화면을 중단시키지 않는다.
    return { status: "unavailable" };
  }
}

export function clearPendingAnalysis(id, settings = {}) {
  try {
    const storage = settings.storage ?? window.sessionStorage;
    if (id) {
      const raw = storage.getItem(PENDING_ANALYSIS_KEY);
      if (!raw || JSON.parse(raw).id !== id) return true;
    }
    storage.removeItem(PENDING_ANALYSIS_KEY);
    return true;
  } catch { return false; }
}
