import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteWork, getWork, renameWork } from "../api/workClient.js";
import { useAuth } from "../auth/useAuth.js";
import BrickGuidePanel from "../components/analyze/guide/BrickGuidePanel.jsx";
import "./Account.css";
import "./Analyze.css";

function WorkActions({ work, onRenamed }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [title, setTitle] = useState(work.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const lock = useRef(false);
  const renameButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);
  const titleRef = useRef(null);

  function close() {
    const trigger = mode === "rename" ? renameButtonRef : deleteButtonRef;
    setMode(null);
    setError(""); setRequiresLogin(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  function open(nextMode) {
    setError(""); setRequiresLogin(false); setNotice(""); setTitle(work.title); setMode(nextMode);
    if (nextMode === "rename") requestAnimationFrame(() => titleRef.current?.focus());
  }

  async function mutate(operation) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      if (operation === "rename") {
        if (!title.trim()) { setError("작품 이름을 입력해 주세요."); return; }
        const updated = await renameWork(work.id, title.trim());
        onRenamed(updated);
        setNotice("작품 이름을 변경했습니다.");
        close();
      } else {
        await deleteWork(work.id);
        navigate("/mypage", { replace: true });
      }
    } catch (failure) {
      setRequiresLogin(failure.status === 401);
      setError(failure.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." :
        failure.status === 404 ? "작품을 찾을 수 없거나 접근할 수 없습니다." :
        failure.message || "요청을 처리하지 못했습니다. 다시 시도해 주세요.");
    } finally { lock.current = false; setBusy(false); }
  }

  return <div className="work-management" aria-label="내 작품 관리" aria-busy={busy}>
    <div className="work-action-row">
      <button ref={renameButtonRef} type="button" className="profile-edit-trigger" disabled={busy} aria-expanded={mode === "rename"} aria-controls="work-rename-form" onClick={() => open("rename")}>이름 수정</button>
      <button ref={deleteButtonRef} type="button" className="profile-edit-trigger" disabled={busy} aria-expanded={mode === "delete"} aria-controls="work-delete-confirm" onClick={() => open("delete")}>작품 삭제</button>
    </div>
    {mode === "rename" && <form id="work-rename-form" className="work-rename-form" onSubmit={event => { event.preventDefault(); mutate("rename"); }}>
      <fieldset disabled={busy}><label htmlFor="work-new-title">새 작품 이름</label><input ref={titleRef} id="work-new-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={80} />
        <div className="work-action-row"><button type="submit" className="account-primary">{busy ? "저장 중..." : "이름 저장"}</button><button type="button" className="account-secondary" onClick={close}>취소</button></div>
      </fieldset>
    </form>}
    {mode === "delete" && <div id="work-delete-confirm" className="work-delete-confirm" role="group" aria-label="작품 삭제 확인">
      <p><strong>{work.title}</strong> 작품을 삭제할까요? 삭제한 개인 작품은 복구할 수 없습니다.</p>
      <p className="account-muted">이미 공유한 게시글과 조립 가이드는 유지됩니다.</p>
      <div className="work-action-row"><button type="button" className="account-secondary" disabled={busy} onClick={() => mutate("delete")}>{busy ? "삭제 중..." : "삭제 확정"}</button><button type="button" className="account-secondary" disabled={busy} onClick={close}>취소</button></div>
    </div>}
    {error && <p className="account-error" role="alert">{error}</p>}
    {requiresLogin && <p><Link to="/login">로그인하기</Link></p>}
    {notice && <p className="account-notice" role="status">{notice}</p>}
  </div>;
}

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
  return <><h1>{work.title}</h1>
    <WorkActions work={work} onRenamed={updated => setResult(previous => ({ work: { ...previous.work, ...updated } }))} />
    <Link className="account-primary" to={`/board/new?workId=${encodeURIComponent(work.id)}`}>이 작품 공유하기</Link><p className="account-muted">저장 시각: <time dateTime={work.createdAt}>{new Date(work.createdAt).toLocaleString("ko-KR")}</time></p>
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
