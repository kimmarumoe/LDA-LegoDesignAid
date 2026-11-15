import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../../auth/useAuth.js";
import { setPostLike } from "../../api/postClient.js";

export default function LikeButton({ postId, liked, count, onChange }) {
  const { member, refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const lock = useRef(false);
  async function toggle() {
    if (!member || lock.current) return;
    lock.current = true; setBusy(true); setError(""); setExpired(false);
    try { onChange(await setPostLike(postId, !liked)); }
    catch (failure) {
      setExpired(failure.status === 401);
      setError(failure.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : failure.message || "좋아요를 변경하지 못했습니다. 다시 시도해 주세요.");
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="post-like-area">
    <button type="button" className="post-like" aria-pressed={liked} aria-busy={busy} disabled={!member || busy} onClick={toggle}><Heart size={19} aria-hidden="true" />좋아요 {count}</button>
    {!member && <p className="account-muted"><Link to="/login">로그인</Link>하면 좋아요를 누를 수 있어요.</p>}
    {error && <p role="alert">{error}</p>}
    {expired && <button type="button" className="account-secondary" onClick={async () => { await refresh(); navigate("/login"); }}>다시 로그인</button>}
  </div>;
}
