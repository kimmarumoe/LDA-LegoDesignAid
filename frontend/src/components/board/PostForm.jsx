import { useRef, useState } from "react";

export default function PostForm({ initial = {}, works, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [workId, setWorkId] = useState(initial.workId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    if (!title.trim() || !description.trim() || (works && !workId)) {
      setError("작품과 제목, 설명을 모두 입력해 주세요."); return;
    }
    lock.current = true; setBusy(true); setError("");
    try { await onSubmit({ title: title.trim(), description: description.trim(), ...(works ? { workId } : {}) }); }
    catch (failure) { setError(failure.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : failure.message || "게시글을 저장하지 못했습니다."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="post-form"><fieldset disabled={busy}>
    {works && <><label htmlFor="post-work">공유할 내 작품</label><select id="post-work" value={workId} onChange={event => setWorkId(event.target.value)} required>
      <option value="">작품을 선택하세요</option>{works.map(work => <option key={work.id} value={work.id}>{work.title}</option>)}
    </select><small>게시하면 작품과 조립 가이드가 공개됩니다. 개인 작품의 복사본을 게시합니다.</small></>}
    <label htmlFor="post-title">제목</label><input id="post-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={100} />
    <label htmlFor="post-description">작품 설명</label><textarea id="post-description" rows={8} value={description} onChange={event => setDescription(event.target.value)} required maxLength={5000} />
    {error && <p className="account-error" role="alert">{error}</p>}
    <div className="board-actions"><button type="submit" className="account-primary">{busy ? "저장 중..." : works ? "작품 게시하기" : "수정 저장"}</button>
      {onCancel && <button type="button" className="account-secondary" onClick={onCancel}>취소</button>}</div>
  </fieldset></form>;
}
