import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { deletePost, editPost, getPost } from "../api/postClient.js";
import LikeButton from "../components/board/LikeButton.jsx";
import CommentSection from "../components/board/CommentSection.jsx";
import PostForm from "../components/board/PostForm.jsx";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import "./Account.css";
import "./Analyze.css";
import "./Board.css";

function DetailContent({ postId }) {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const updateSocial = useCallback(values => setResult(previous => previous?.post ? { post: { ...previous.post, ...values } } : previous), []);
  useEffect(() => {
    let active = true;
    getPost(postId).then(post => { if (active) setResult({ post }); }).catch(failure => { if (active) setResult({ error: failure.status === 404 ? "게시글을 찾을 수 없습니다." : failure.message }); });
    return () => { active = false; };
  }, [postId, attempt]);
  async function remove() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await deletePost(postId); navigate("/board", { replace: true }); }
    catch (failure) { setError(failure.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : failure.message || "삭제하지 못했습니다."); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!result) return <p role="status">게시글을 불러오고 있습니다.</p>;
  if (result.error) return <><p role="alert">{result.error}</p><button className="account-secondary" onClick={() => { setResult(null); setAttempt(attempt + 1); }}>다시 시도</button></>;
  const { post } = result;
  return <><article className="account-card"><h1>{post.title}</h1><p className="account-muted">작성자: {post.nickname} · <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString("ko-KR")}</time></p>
    {editing ? <PostForm initial={post} onCancel={() => setEditing(false)} onSubmit={async values => {
      const updated = await editPost(postId, values);
      // 글 수정 응답이 동시에 갱신된 댓글·좋아요 상태를 덮어쓰지 않도록 한다.
      setResult(previous => ({ post: { ...previous.post, title: updated.title, description: updated.description, updatedAt: updated.updatedAt } }));
      setEditing(false);
    }} /> : <p className="post-description">{post.description}</p>}
    <LikeButton postId={postId} liked={post.likedByMe} count={post.likeCount} onChange={updateSocial} />
    {post.canEdit && !editing && <div className="board-actions"><button className="account-secondary" disabled={busy} onClick={() => { setConfirming(false); setError(""); setEditing(true); }}>게시글 수정</button><button className="account-secondary" disabled={busy} onClick={() => setConfirming(true)}>게시글 삭제</button></div>}
    {confirming && <div className="delete-confirm" role="group" aria-label="게시글 삭제 확인"><p>이 게시글을 삭제할까요? 삭제한 글은 복구할 수 없습니다. 개인 작품은 유지됩니다.</p><div className="board-actions"><button className="account-secondary" disabled={busy} onClick={remove}>{busy ? "삭제 중..." : "삭제 확정"}</button><button className="account-secondary" disabled={busy} onClick={() => setConfirming(false)}>취소</button></div></div>}
    {error && <p className="account-error" role="alert">{error}</p>}
  </article><BrickGuidePanel analysisStatus="done" analysisResult={post.analysis} guideStatus="done" guideSteps={post.steps} />
    <CommentSection postId={postId} count={post.commentCount} onChange={updateSocial} /></>;
}

export default function PostDetail() {
  const { postId } = useParams();
  const { member, loading } = useAuth();
  return <section className="analyze-page account-page account-dashboard"><Link to="/board">게시판으로 돌아가기</Link>
    {loading ? <p role="status">게시글을 준비하고 있습니다.</p> : <DetailContent key={`${postId}:${member?.id ?? "guest"}`} postId={postId} />}
  </section>;
}
