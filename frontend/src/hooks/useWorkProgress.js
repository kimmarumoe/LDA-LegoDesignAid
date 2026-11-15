import { useState, useSyncExternalStore } from "react";
import { saveWorkProgress } from "../api/workClient.js";
import { createProgressSaver } from "../utils/progressSaver.js";

export function useWorkProgress(workId, initialProgress) {
  const [saver] = useState(() => createProgressSaver(stepIndex => saveWorkProgress(workId, stepIndex), initialProgress));
  const state = useSyncExternalStore(saver.subscribe, saver.getSnapshot);
  // 구독만 해제한다. 화면 이동 후에도 이미 요청한 최신 위치는 계속 저장한다.
  return { state, selectStep: saver.select, retry: saver.retry };
}
