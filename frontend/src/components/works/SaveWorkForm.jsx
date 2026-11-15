import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { saveWork } from "../../api/workClient.js";
import "../../pages/Account.css";

export default function SaveWorkForm(props) {
  const { member, loading } = useAuth();
  // 계정이 바뀌면 이전 계정의 저장 상태와 입력도 함께 초기화한다.
  return <SaveWorkContent key={member?.id ?? "guest"} {...props} member={member} loading={loading} />;
}

function SaveWorkContent({ analysis, steps, options, member, loading }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);
  const lock = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    if (!title.trim()) { setError("작품 이름을 입력해 주세요."); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      setSaved(await saveWork({ title: title.trim(), analysis, steps, options }));
    } catch (failure) {
      setError(failure.status === 401 ? "로그인 시간이 만료되었습니다. 다시 로그인해 주세요." : failure.message || "작품을 저장하지 못했습니다.");
    } finally { lock.current = false; setBusy(false); }
  }

  return <section className="account-page" aria-label="작품 저장">
    <div className="account-card">
      <h2>내 작품으로 저장</h2>
      {loading ? <p role="status">로그인 확인 중...</p> : !member ? <p>작품 저장은 로그인 후 이용할 수 있어요. <Link to="/login">로그인하기</Link></p> :
        saved ? <p role="status">작품을 저장했습니다. <Link to={`/mypage/works/${saved.id}`}>저장한 작품 열기</Link></p> :
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label htmlFor="work-title">작품 이름</label>
            <input id="work-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required />
            <button className="account-primary" type="submit">{busy ? "저장 중..." : "내 작품으로 저장"}</button>
          </fieldset>
        </form>}
      {error && <p className="account-error" role="alert">{error}</p>}
    </div>
  </section>;
}
