import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { saveWork } from "../../api/workClient.js";
import { clearPendingAnalysis, savePendingAnalysis } from "../../utils/pendingAnalysis.js";
import "../../pages/Account.css";

export default function SaveWorkForm(props) {
  const { member, loading, refresh } = useAuth();
  return <SaveWorkContent key={member?.id ?? "guest"} {...props} member={member} loading={loading} refresh={refresh} />;
}

function SaveWorkContent({ analysis, steps, options, useSample, sampleId, initialTitle = "", pendingId, onSaved, member, loading, refresh }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const lock = useRef(false);
  const needsLogin = !member || requiresLogin;

  async function continueLogin() {
    lock.current = true; setBusy(true);
    try {
      savePendingAnalysis({ analysis, steps, options, title, useSample, sampleId, ownerId: member?.id ?? null });
      // 만료된 Context를 갱신하지 않으면 로그인 화면이 이전 회원으로 즉시 되돌아간다.
      if (requiresLogin) await refresh();
      navigate("/login?resume=1");
    } catch (failure) { setError(failure.message); }
    finally { lock.current = false; setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    if (needsLogin) { await continueLogin(); return; }
    if (!title.trim()) { setError("작품 이름을 입력해 주세요."); return; }
    lock.current = true; setBusy(true);
    try {
      const result = await saveWork({ title: title.trim(), analysis, steps, options });
      setSaved(result);
      if (pendingId && !clearPendingAnalysis(pendingId)) {
        setError("작품은 저장했지만 임시 데이터를 지우지 못했습니다. 공용 기기라면 이 탭을 닫아 주세요.");
      }
      onSaved?.();
    } catch (failure) {
      setRequiresLogin(failure.status === 401);
      setError(failure.status === 401 ? "로그인 시간이 만료되었습니다. 아래 로그인 후 저장하기를 누르면 결과를 보관하고 다시 로그인할 수 있습니다." : failure.message || "작품을 저장하지 못했습니다.");
    } finally { lock.current = false; setBusy(false); }
  }

  return <section className="account-page" aria-label="작품 저장"><div className="account-card"><h2>내 작품으로 저장</h2>
    {loading ? <p role="status">로그인 확인 중...</p> : saved ? <p role="status">작품을 저장했습니다. <Link to={`/mypage/works/${saved.id}`}>저장한 작품 열기</Link></p> :
      <form onSubmit={submit}><fieldset disabled={busy}>
        <label htmlFor="work-title">작품 이름</label><input id="work-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={80} required={!needsLogin} />
        {needsLogin && <p className="account-muted">완성한 결과와 이름을 같은 탭에 30분간 임시 보관하고, 로그인 후 돌아옵니다. 원본 파일은 보관하지 않습니다.</p>}
        <button className="account-primary" type="submit">{busy ? "저장 중..." : needsLogin ? "로그인 후 저장하기" : "내 작품으로 저장"}</button>
      </fieldset></form>}
    {error && <p className="account-error" role="alert">{error}</p>}
  </div></section>;
}
