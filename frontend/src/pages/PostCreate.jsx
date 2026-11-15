import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { listWorks } from "../api/workClient.js";
import { createPost } from "../api/postClient.js";
import PostForm from "../components/board/PostForm.jsx";
import "./Account.css";
import "./Board.css";

function CreateContent() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    listWorks().then(works => { if (active) setResult({ works }); }).catch(error => { if (active) setResult({ error: error.message || "내 작품을 불러오지 못했습니다." }); });
    return () => { active = false; };
  }, [attempt]);
  if (!result) return <p role="status">내 작품을 불러오고 있습니다.</p>;
  if (result.error) return <><p role="alert">{result.error}</p><button onClick={() => { setResult(null); setAttempt(attempt + 1); }}>다시 시도</button></>;
  if (!result.works.length) return <p>먼저 완성한 작품을 저장해 주세요. <Link to="/analyze">이미지 분석하기</Link></p>;
  const selected = params.get("workId");
  return <PostForm works={result.works} initial={{ workId: result.works.some(work => work.id === selected) ? selected : "" }} onSubmit={async values => {
    const post = await createPost(values); navigate(`/board/${post.id}`, { replace: true });
  }} onCancel={() => navigate("/board")} />;
}

export default function PostCreate() {
  const { member, loading, error, refresh } = useAuth();
  return <section className="account-page account-dashboard"><Link to="/board">게시판으로 돌아가기</Link><div className="account-card"><h1>작품 공유하기</h1>
    {loading ? <p role="status">로그인 확인 중...</p> : error ? <><p role="alert">{error}</p><button onClick={refresh}>다시 확인</button></> : !member ? <p>글 작성은 로그인 후 이용할 수 있어요. <Link to="/login">로그인하기</Link></p> : <CreateContent key={member.id} />}
  </div></section>;
}
