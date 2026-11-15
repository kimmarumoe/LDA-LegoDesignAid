import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { createComment, deleteComment, editComment, listComments } from "../../api/postClient.js";

function CommentItem({ comment, busy, onMutate }) {
  const [mode, setMode] = useState(null);
  const [content, setContent] = useState(comment.content);
  return <article className="comment-item" aria-label={`${comment.nickname}님의 댓글`}>
    <p className="comment-meta"><strong>{comment.nickname}</strong> · <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString("ko-KR")}</time>{comment.edited && " · 수정됨"}</p>
    {mode === "edit" ? <form className="post-form" onSubmit={async event => {
      event.preventDefault();
      if (await onMutate("edit", comment.id, content)) setMode(null);
    }}><fieldset disabled={busy}><label htmlFor={`comment-edit-${comment.id}`}>댓글 수정 내용</label>
      <textarea id={`comment-edit-${comment.id}`} rows={3} value={content} onChange={event => setContent(event.target.value)} required maxLength={1000} />
      <div className="board-actions"><button type="submit" className="account-secondary">수정 저장</button><button type="button" className="account-secondary" onClick={() => setMode(null)}>취소</button></div>
    </fieldset></form> : <p className="comment-content">{comment.content}</p>}
    {comment.canEdit && !mode && <div className="comment-actions"><button type="button" className="profile-edit-trigger" disabled={busy} onClick={() => { setContent(comment.content); setMode("edit"); }}>댓글 수정</button><button type="button" className="profile-edit-trigger" disabled={busy} onClick={() => setMode("delete")}>댓글 삭제</button></div>}
    {mode === "delete" && <div className="delete-confirm" role="group" aria-label="댓글 삭제 확인"><p>댓글을 삭제할까요? 삭제한 댓글은 복구할 수 없습니다.</p><div className="board-actions"><button type="button" className="account-secondary" disabled={busy} onClick={() => onMutate("delete", comment.id)}>삭제 확정</button><button type="button" className="account-secondary" disabled={busy} onClick={() => setMode(null)}>취소</button></div></div>}
  </article>;
}

export default function CommentSection({ postId, count, onChange }) {
  const { member, refresh } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState({ page: 0, revision: 0 });
  const [result, setResult] = useState(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    listComments(postId, query.page).then(data => {
      if (active) { setResult({ data }); onChange({ commentCount: data.total }); }
    }).catch(failure => { if (active) setResult({ error: failure.message || "댓글을 불러오지 못했습니다." }); });
    return () => { active = false; };
  }, [postId, query.page, query.revision, onChange]);

  function loadPage(page) {
    setResult(null);
    setQuery(previous => ({ page, revision: previous.revision + 1 }));
  }

  async function mutate(operation, id, nextContent) {
    if (lock.current || !member) return false;
    if (operation !== "delete" && !nextContent.trim()) { setError("댓글 내용을 입력해 주세요."); return false; }
    lock.current = true; setBusy(true); setError(""); setExpired(false);
    try {
      const data = operation === "create" ? await createComment(postId, nextContent.trim()) :
        operation === "edit" ? await editComment(postId, id, nextContent.trim()) : await deleteComment(postId, id);
      onChange({ commentCount: data.commentCount });
      if (operation === "create") setContent("");
      const page = operation === "create" ? 0 : operation === "delete" && result?.data.items.length === 1 ? Math.max(0, query.page - 1) : query.page;
      loadPage(page);
      return true;
    } catch (failure) {
      setExpired(failure.status === 401);
      setError(failure.status === 401 ? "로그인이 만료되었습니다. 입력한 내용은 현재 화면에 유지됩니다." : failure.status === 404 ? "게시글 또는 댓글을 찾을 수 없거나 수정 권한이 없습니다." : failure.message || "댓글을 저장하지 못했습니다. 다시 시도해 주세요.");
      return false;
    } finally { lock.current = false; setBusy(false); }
  }

  return <section className="account-card comment-section" aria-label="게시글 댓글" aria-busy={busy}><h2>댓글 {count}</h2>
    {member ? <form className="post-form" onSubmit={event => { event.preventDefault(); mutate("create", null, content); }}><fieldset disabled={busy}>
      <label htmlFor="comment-content">댓글 내용</label><textarea id="comment-content" rows={3} value={content} onChange={event => setContent(event.target.value)} required maxLength={1000} />
      <small>최대 1,000자 · 최신 댓글부터 표시합니다.</small><button type="submit" className="account-primary">{busy ? "처리 중..." : "댓글 등록"}</button>
    </fieldset></form> : <p className="account-muted"><Link to="/login">로그인</Link>하면 댓글을 작성할 수 있어요.</p>}
    {error && <p className="account-error" role="alert">{error}</p>}
    {expired && <button type="button" className="account-secondary" onClick={async () => { await refresh(); navigate("/login"); }}>다시 로그인</button>}
    {!result ? <p role="status">댓글을 불러오고 있습니다.</p> : result.error ? <><p role="alert">{result.error}</p><button type="button" className="account-secondary" disabled={busy} onClick={() => loadPage(query.page)}>다시 시도</button></> : <>
      {result.data.items.length ? <div className="comment-list">{result.data.items.map(comment => <CommentItem key={comment.id} comment={comment} busy={busy} onMutate={mutate} />)}</div> : <p className="account-muted">아직 댓글이 없습니다.</p>}
      <nav className="board-actions" aria-label="댓글 페이지"><button type="button" className="account-secondary" disabled={busy || query.page === 0} onClick={() => loadPage(query.page - 1)}>이전 댓글</button><span>{query.page + 1}페이지</span><button type="button" className="account-secondary" disabled={busy || !result.data.hasMore} onClick={() => loadPage(query.page + 1)}>다음 댓글</button></nav>
    </>}
  </section>;
}
