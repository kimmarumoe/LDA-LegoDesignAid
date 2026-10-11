import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";

function PasswordField({ id, label, maxLength, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return <>
    <label htmlFor={id}>{label}</label>
    <div className="account-password-field">
      <input id={id} name={id} type={visible ? "text" : "password"} required minLength={8} maxLength={maxLength} autoComplete={autoComplete} />
      <button className="account-password-toggle" type="button" aria-label={`${label} ${visible ? "숨기기" : "보기"}`} title={`${label} ${visible ? "숨기기" : "보기"}`} aria-controls={id} aria-pressed={visible} onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  </>;
}

export default function ProfileEditor({ onClose, onSaved }) {
  const { member, updateNickname, changePassword } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(member.nickname);
  const [busy, setBusy] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function saveNickname(event) {
    event.preventDefault();
    if (busy) return;
    setNicknameError("");
    if (!nickname.trim()) { setNicknameError("닉네임을 입력해 주세요."); return; }
    setBusy(true);
    try {
      await updateNickname(nickname.trim());
      onSaved();
    } catch (failure) { setNicknameError(failure.message || "닉네임을 저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (busy) return;
    setPasswordError("");
    const values = new FormData(event.currentTarget);
    const currentPassword = String(values.get("current-password"));
    const newPassword = String(values.get("new-password"));
    if (newPassword !== values.get("confirm-password")) {
      setPasswordError("새 비밀번호 확인이 일치하지 않습니다."); return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요."); return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (failure) { setPasswordError(failure.message || "비밀번호를 변경하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <div className="profile-editor">
    <div className="profile-editor-heading">
      <h3>프로필 수정</h3>
      <button type="button" className="account-secondary" disabled={busy} onClick={onClose}>수정 닫기</button>
    </div>
    <form onSubmit={saveNickname} aria-label="닉네임 수정">
      <fieldset disabled={busy}>
        <label htmlFor="profile-nickname">닉네임</label>
        <input id="profile-nickname" name="nickname" value={nickname} maxLength={30} required autoComplete="nickname" onChange={(event) => { setNickname(event.target.value); setNicknameError(""); }} />
        <small>최대 30자로 입력해 주세요. 아이디는 변경할 수 없습니다.</small>
        {nicknameError && <p className="account-error" role="alert">{nicknameError}</p>}
        <button className="account-primary" type="submit" disabled={busy || nickname.trim() === member.nickname}>닉네임 저장</button>
      </fieldset>
    </form>
    <details className="profile-password-section">
      <summary>비밀번호 변경</summary>
      <p className="account-muted">현재 비밀번호를 확인한 뒤 변경합니다. 변경하면 모든 기기에서 로그아웃됩니다.</p>
      <form onSubmit={savePassword} aria-label="비밀번호 변경">
        <fieldset disabled={busy}>
          <PasswordField id="current-password" label="현재 비밀번호" maxLength={128} autoComplete="current-password" />
          <PasswordField id="new-password" label="새 비밀번호" maxLength={20} autoComplete="new-password" />
          <small>새 비밀번호는 현재 비밀번호와 다른 8~20자로 입력해 주세요.</small>
          <PasswordField id="confirm-password" label="새 비밀번호 확인" maxLength={20} autoComplete="new-password" />
          {passwordError && <p className="account-error" role="alert">{passwordError}</p>}
          <button className="account-primary" type="submit">비밀번호 변경하기</button>
        </fieldset>
      </form>
    </details>
  </div>;
}
