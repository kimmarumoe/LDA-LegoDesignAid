import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPosts } from "../api/postClient.js";
import "./Account.css";
import "./Board.css";

export function PostThumbnail({ thumbnail }) {
  return <svg className="post-thumbnail" viewBox={`0 0 ${thumbnail.width} ${thumbnail.height}`} role="img" aria-label="작품 미리보기" preserveAspectRatio="xMidYMid meet">
    {thumbnail.cells.map(cell => <rect key={`${cell.x}:${cell.y}`} x={cell.x} y={cell.y} width={1} height={1} fill={cell.hex} />)}
  </svg>;
}

function BoardPage({ page, onPage }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    listPosts(page).then(data => { if (active) setResult({ data }); }).catch(error => { if (active) setResult({ error: error.message || "게시글을 불러오지 못했습니다." }); });
    return () => { active = false; };
  }, [page, attempt]);
  if (!result) return <p role="status">공유 작품을 불러오고 있습니다.</p>;
  if (result.error) return <><p role="alert">{result.error}</p><button className="account-secondary" onClick={() => { setResult(null); setAttempt(attempt + 1); }}>다시 시도</button></>;
  return <>
    {result.data.items.length ? <div className="board-grid">{result.data.items.map(post => <Link className="account-card post-card" to={`/board/${post.id}`} key={post.id}>
      <PostThumbnail thumbnail={post.thumbnail} /><h2>{post.title}</h2><p className="post-excerpt">{post.description}</p>
      <p className="account-muted">{post.nickname} · <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</time></p>
    </Link>)}</div> : <p className="account-muted">아직 공유된 작품이 없습니다. 첫 작품을 공유해 보세요.</p>}
    <nav className="board-actions" aria-label="게시판 페이지"><button className="account-secondary" disabled={page === 0} onClick={() => onPage(page - 1)}>이전 페이지</button><span>{page + 1}페이지</span><button className="account-secondary" disabled={!result.data.hasMore} onClick={() => onPage(page + 1)}>다음 페이지</button></nav>
  </>;
}

export default function Board() {
  const [page, setPage] = useState(0);
  return <section className="account-page account-dashboard"><div className="board-heading"><div><span className="section-eyebrow">LDA 커뮤니티</span><h1>작품 공유 게시판</h1><p className="account-muted">완성한 작품과 조립 가이드를 함께 나눠 보세요.</p></div><Link className="account-primary" to="/board/new">작품 공유하기</Link></div>
    <BoardPage key={page} page={page} onPage={setPage} />
  </section>;
}
