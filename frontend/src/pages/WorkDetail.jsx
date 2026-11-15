import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getWork } from "../api/workClient.js";
import { useAuth } from "../auth/useAuth.js";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import "./Account.css";
import "./Analyze.css";

function WorkContent({ workId }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getWork(workId).then((work) => { if (active) setResult({ work }); })
      .catch((error) => { if (active) setResult({ error: error.status === 404 ? "작품을 찾을 수 없거나 접근할 수 없습니다." : error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : error.message }); });
    return () => { active = false; };
  }, [workId, attempt]);
  if (!result) return <p role="status">작품을 불러오고 있습니다.</p>;
  if (result.error) return <><p role="alert">{result.error}</p><button className="account-secondary" onClick={() => { setResult(null); setAttempt(attempt + 1); }}>다시 시도</button><p><Link to="/login">로그인하기</Link></p></>;
  const { work } = result;
  return <><h1>{work.title}</h1><Link className="account-primary" to={`/board/new?workId=${encodeURIComponent(work.id)}`}>이 작품 공유하기</Link><p className="account-muted">저장 시각: <time dateTime={work.createdAt}>{new Date(work.createdAt).toLocaleString("ko-KR")}</time></p>
    <BrickGuidePanel analysisStatus="done" analysisResult={work.analysis} guideStatus="done" guideSteps={work.steps} />
  </>;
}

export default function WorkDetail() {
  const { workId } = useParams();
  const { member, loading, error, refresh } = useAuth();
  return <section className="analyze-page account-page account-dashboard"><Link to="/mypage">마이페이지로 돌아가기</Link>
    {loading ? <p role="status">로그인 확인 중...</p> : error ? <><p role="alert">{error}</p><button onClick={refresh}>다시 확인</button></> : !member ? <p>로그인이 필요합니다. <Link to="/login">로그인하기</Link></p> : <WorkContent key={`${member.id}:${workId}`} workId={workId} />}
  </section>;
}
