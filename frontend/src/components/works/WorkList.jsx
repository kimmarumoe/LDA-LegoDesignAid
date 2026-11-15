import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWorks } from "../../api/workClient.js";

export default function WorkList() {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    listWorks().then((works) => { if (active) setResult({ works }); })
      .catch((error) => { if (active) setResult({ error: error.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : error.message }); });
    return () => { active = false; };
  }, [attempt]);

  return <div className="account-card"><h2>내 작품</h2>
    {!result ? <p role="status">작품을 불러오고 있습니다.</p> : result.error ? <>
      <p role="alert">{result.error}</p><button className="account-secondary" onClick={() => { setResult(null); setAttempt(attempt + 1); }}>다시 시도</button>
    </> : result.works.length ? <ul className="work-list">{result.works.map((work) => <li key={work.id}>
      <Link to={`/mypage/works/${work.id}`}>{work.title}</Link>
      <time dateTime={work.createdAt}>{new Date(work.createdAt).toLocaleString("ko-KR")}</time>
    </li>)}</ul> : <p className="account-muted">저장한 작품이 없습니다. 분석과 조립 가이드를 완성한 뒤 저장해 보세요.</p>}
    <Link to="/analyze">새 이미지 분석하기</Link>
  </div>;
}
