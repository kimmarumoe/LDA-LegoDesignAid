import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "../auth/useAuth.js";
import "./Account.css";
import ProfileEditor from "../components/account/ProfileEditor.jsx";

export default function MyPage() {
  const { member, loading, error, refresh } = useAuth();
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [profileNotice, setProfileNotice] = useState("");
  const editButtonRef = useRef(null);

  function closeEditor() {
    setEditingMemberId(null);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  useEffect(() => {
    // 페이지 방문 시 서버에 확인하여 만료된 로그인 정보를 계속 표시하지 않는다.
    refresh();
  }, [refresh]);

  if (loading) return <div className="account-page" role="status">회원 정보를 확인하고 있습니다.</div>;
  if (error) return <section className="account-page"><div className="account-card"><h1>마이페이지</h1><p role="alert">{error}</p><button className="account-primary" onClick={refresh}>다시 확인</button></div></section>;
  if (!member) return <section className="account-page"><div className="account-card"><h1>로그인이 필요합니다</h1><p className="account-muted">계정 정보는 로그인 후 확인할 수 있습니다.</p><Link className="account-primary" to="/login">로그인하기</Link><p className="account-switch"><Link to="/signup">새 계정 만들기</Link></p></div></section>;

  return (
    <section className="account-page account-dashboard">
      <div><span className="section-eyebrow">나의 LDA</span><h1>마이페이지</h1><p className="account-muted">{member.nickname}님, 반가워요.</p></div>
      <div className="account-card">
        <div className="profile-card-heading">
          <h2>내 프로필</h2>
          {editingMemberId !== member.id && (
            <button ref={editButtonRef} type="button" className="profile-edit-trigger" aria-label="프로필 수정" onClick={() => {
              setProfileNotice("");
              setEditingMemberId(member.id);
            }}><Pencil size={15} aria-hidden="true" />수정</button>
          )}
        </div>
        <dl className="account-profile"><dt>아이디</dt><dd>{member.username}</dd><dt>닉네임</dt><dd>{member.nickname}</dd></dl>
        {profileNotice && <p className="account-notice" role="status">{profileNotice}</p>}
        {editingMemberId === member.id && (
          <ProfileEditor key={member.id} onClose={closeEditor} onSaved={() => {
            setProfileNotice("닉네임을 저장했습니다.");
            closeEditor();
          }} />
        )}
      </div>
      <div className="account-grid">
        <div className="account-card"><h2>내 작품</h2><span className="account-badge">준비 중</span><p className="account-muted">완성한 작품을 계정에 저장하는 기능은 아직 연결되지 않았습니다.</p><Link to="/sample">샘플 작품 둘러보기</Link></div>
        <div className="account-card"><h2>분석 기록</h2><span className="account-badge">준비 중</span><p className="account-muted">분석 결과를 계정별로 저장하는 기능은 다음 단계에서 추가할 예정입니다.</p><Link to="/analyze">새 이미지 분석하기</Link></div>
      </div>
    </section>
  );
}
