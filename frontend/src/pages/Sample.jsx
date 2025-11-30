// frontend/src/pages/Sample.jsx
import { useNavigate } from "react-router-dom";
import "./Sample.css";
import SampleCard from "../components/SampleCard.jsx";
import { SAMPLE_MOSAICS } from "../sample/sampleMosaics.js";

/**
 * Sample 페이지
 * - 미리 준비된 모자이크 샘플 목록을 보여주는 화면
 */
export default function Sample() {
  const navigate = useNavigate();

  // 샘플 카드를 클릭했을 때 Analyze 페이지로 이동
  const handleOpenAnalyze = (mosaic) => {
    navigate("/analyze", { state: { sampleId: mosaic.id } });
  };

  return (
    <div className="sample-page">
      <header className="sample-header">
        <p className="section-eyebrow">LDA 샘플 갤러리</p>
        <h1 className="section-title">
          준비된 모자이크 샘플로 먼저 체험해보세요
        </h1>
        <p className="section-desc">
          LDA가 어떤 방식으로 레고 모자이크를 설계하는지, 미리 준비된 샘플들을
          통해 가볍게 확인해볼 수 있습니다. 입문용부터 중급 난이도까지 몇 가지
          예시를 제공하며, 추후에는 직접 만든 샘플도 추가할 예정입니다.
        </p>
      </header>

      <section className="sample-layout">
        <div className="sample-grid">
          {SAMPLE_MOSAICS.map((mosaic) => (
            <SampleCard
              key={mosaic.id}
              mosaic={mosaic}
              onOpenAnalyze={handleOpenAnalyze}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
