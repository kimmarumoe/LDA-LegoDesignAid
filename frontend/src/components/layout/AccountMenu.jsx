import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, UserRound, LogOut } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu.jsx";

export default function AccountMenu({ onNavigate, onError }) {
  const { member, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    onError("");
    try {
      await logout();
      onNavigate();
      navigate("/");
    } catch (failure) { onError(failure.message || "로그아웃을 처리하지 못했습니다."); }
    finally { setBusy(false); }
  }

  if (loading) return <span className="header-account-loading" role="status" aria-label="로그인 상태 확인 중" />;
  if (!member) return <Link to="/login" className="header-login" onClick={onNavigate}>로그인</Link>;

  return <DropdownMenu>
    <DropdownMenuTrigger className="profile-trigger" aria-label="프로필 메뉴" title={member.nickname} disabled={busy}>
      <UserRound size={20} aria-hidden="true" />
      <span className="profile-trigger-label">{member.nickname}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem render={<Link to="/mypage" />} onClick={onNavigate}><UserRound size={16} aria-hidden="true" />마이페이지</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} disabled={busy}><LogOut size={16} aria-hidden="true" />{busy ? "로그아웃 중…" : "로그아웃"}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
