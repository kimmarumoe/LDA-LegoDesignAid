import { useMemo, useState } from "react";
import BrickMosaicPreview from "../mosaic/BrickMosaicPreview.jsx";
import { getAssemblyFrame } from "./assemblySteps.js";
import "./AssemblyGuidePreview.css";

export default function AssemblyGuidePreview({ steps, analysisResult }) {
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, steps.length - 1);
  const step = steps[index];
  const { current, placed } = useMemo(() => getAssemblyFrame(steps, index), [steps, index]);
  const guide = useMemo(() => ({
    meta: analysisResult?.meta,
    width: analysisResult?.width,
    height: analysisResult?.height,
    gridWidth: analysisResult?.gridWidth,
    gridHeight: analysisResult?.gridHeight,
    bricks: placed,
  }), [analysisResult, placed]);

  return (
    <section className="assembly-guide" aria-label="단계별 조립 미리보기">
      <div className="assembly-navigation">
        <button type="button" disabled={index === 0} onClick={() => setSelected(index - 1)}>이전 단계</button>
        <label>단계 선택
          <select value={index} onChange={(event) => setSelected(Number(event.target.value))}>
            {steps.map((item, i) => <option key={i} value={i}>{i + 1}. {item?.title ?? `STEP ${i + 1}`}</option>)}
          </select>
        </label>
        <button type="button" disabled={index === steps.length - 1} onClick={() => setSelected(index + 1)}>다음 단계</button>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <p>{index + 1} / {steps.length}단계 · 이번 단계 {current.length}개 · 누적 {placed.length}개</p>
        <progress aria-label="조립 단계 진행률" value={index + 1} max={steps.length} />
        <h4>{step?.title ?? `STEP ${index + 1}`}</h4>
        <p>{step?.description ?? step?.desc ?? ""}</p>
      </div>
      <p className="assembly-legend">테두리 표시: 이번 단계 브릭 · 흐린 표시: 이전 단계 브릭</p>
      <BrickMosaicPreview guide={guide} highlightedBricks={current} title="현재 단계의 조립 모습" />
      <details key={index}>
        <summary>이번 단계 사용 브릭 ({current.length}개)</summary>
        <ul>{current.map((brick, i) => <li key={i}>{typeof brick === "string" ? brick : `(${brick?.x ?? "?"}, ${brick?.y ?? "?"}) ${brick?.type ?? "1x1"} · ${brick?.color ?? brick?.colorHex ?? brick?.hex ?? "색상 정보 없음"}`}</li>)}</ul>
      </details>
      {index === steps.length - 1 && <p>마지막 단계입니다. 전체 조립 모습을 확인하세요.</p>}
    </section>
  );
}
