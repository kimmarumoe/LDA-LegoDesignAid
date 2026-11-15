// 같은 화면의 요청을 순서대로 보내고 대기 중에는 최신 선택만 남긴다.
export function createProgressSaver(send, initial = { stepIndex: 0, savedAt: null }) {
  let snapshot = { status: initial.savedAt ? "restored" : "idle", stepIndex: initial.stepIndex, savedAt: initial.savedAt, error: null };
  let pending = null;
  let running = false;
  const listeners = new Set();
  function publish(values) {
    snapshot = { ...snapshot, ...values };
    listeners.forEach(listener => listener());
  }
  async function drain() {
    if (running || !pending) return;
    running = true;
    while (pending) {
      const target = pending;
      pending = null;
      try {
        const result = await send(target.stepIndex);
        if (!pending) publish({ status: "saved", stepIndex: target.stepIndex, savedAt: result.savedAt, error: null });
      } catch (error) {
        // 실패한 요청보다 새 선택이 있으면 새 선택을 재시도 대상으로 보존한다.
        pending ??= target;
        publish({ status: "error", stepIndex: pending.stepIndex, error });
        break;
      }
    }
    running = false;
    if (pending && snapshot.status === "saving") void drain();
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot() { return snapshot; },
    select(stepIndex) {
      if (!Number.isInteger(stepIndex) || stepIndex < 0) return;
      pending = { stepIndex };
      publish({ status: "saving", stepIndex, error: null });
      void drain();
    },
    retry() {
      if (!pending || running) return;
      publish({ status: "saving", error: null });
      void drain();
    },
  };
}
