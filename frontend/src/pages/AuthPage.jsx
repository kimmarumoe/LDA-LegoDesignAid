import { useState } from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { registerMember } from "../api/authClient.js";
import "./Account.css";

export default function AuthPage({ register = false }) {
  const { member, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loginRejected, setLoginRejected] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setLoginRejected(false);
    const data = new FormData(event.currentTarget);
    const username = String(data.get("username")).trim();
    const password = String(data.get("password"));
    const nickname = String(data.get("nickname") ?? "").trim();
    if (register && password !== data.get("confirmation")) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (register && !nickname) {
      setError("닉네임을 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      if (register) {
        await registerMember({ username, password, nickname });
        navigate("/login", { replace: true, state: { registered: true } });
      } else {
        await login({ username, password });
        navigate("/mypage", { replace: true });
      }
    } catch (failure) {
      setLoginRejected(!register && failure.status === 401);
      setError(failure.message || "요청을 처리하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="account-page" role="status">로그인 상태를 확인하고 있습니다.</div>;
  if (member) return <Navigate to="/mypage" replace />;

  return (
    <section className="account-page">
      <div className="account-card account-form-card">
        <span className="section-eyebrow">LDA 계정</span>
        <h1>{register ? "회원가입" : "로그인"}</h1>
        <p className="account-muted">{register ? "아이디와 닉네임으로 LDA 테스트 계정을 만들어 보세요." : "내 계정으로 로그인하고 마이페이지를 확인하세요."}</p>
        {!register && location.state?.registered && <p className="account-notice" role="status">회원가입이 완료되었습니다. 가입한 계정으로 로그인해 주세요.</p>}
        {!register && location.state?.passwordChanged && <p className="account-notice" role="status">비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.</p>}
        <form onSubmit={handleSubmit}>
          <fieldset disabled={busy}>
            <label htmlFor="username">아이디</label>
            <input id="username" name="username" required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" autoComplete="username" autoCapitalize="none" spellCheck={false} aria-invalid={loginRejected || undefined} aria-describedby={loginRejected ? "username-hint auth-error" : "username-hint"} />
            <small id="username-hint">영문·숫자·밑줄(_) 3~24자, 대소문자는 구분하지 않습니다.</small>
            {register && <><label htmlFor="nickname">닉네임</label><input id="nickname" name="nickname" required maxLength={30} autoComplete="nickname" /></>}
            <label htmlFor="password">비밀번호</label>
            <div className="account-password-field">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={register ? 20 : 128} autoComplete={register ? "new-password" : "current-password"} aria-invalid={loginRejected || undefined} aria-describedby={loginRejected ? "password-hint auth-error" : "password-hint"} />
              <button className="account-password-toggle" type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={showPassword} aria-controls="password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
            <small id="password-hint">{register ? "8~20자로 입력해 주세요." : "가입할 때 설정한 비밀번호를 입력해 주세요."}</small>
            {register && <>
              <label htmlFor="confirmation">비밀번호 확인</label>
              <div className="account-password-field">
                <input id="confirmation" name="confirmation" type={showConfirmation ? "text" : "password"} required minLength={8} maxLength={20} autoComplete="new-password" />
                <button className="account-password-toggle" type="button" aria-label={showConfirmation ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"} title={showConfirmation ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"} aria-pressed={showConfirmation} aria-controls="confirmation" onClick={() => setShowConfirmation(!showConfirmation)}>
                  {showConfirmation ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
            </>}
            {error && <p id="auth-error" className="account-error" role="alert"><CircleAlert size={20} aria-hidden="true" /><span>{error}</span></p>}
            <button className="account-primary" type="submit">{busy ? "처리 중…" : register ? "회원가입" : "로그인"}</button>
          </fieldset>
        </form>
        <p className="account-switch">{register ? "이미 계정이 있나요? " : "처음 방문하셨나요? "}<Link to={register ? "/login" : "/signup"}>{register ? "로그인" : "회원가입"}</Link></p>
        <p className="account-muted account-footnote">현재는 테스트용 아이디 로그인입니다. 카카오·Google 로그인은 배포 전 추가할 예정입니다.</p>
      </div>
    </section>
  );
}
