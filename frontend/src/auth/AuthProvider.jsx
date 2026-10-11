import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { getCurrentMember, loginMember, logoutMember, updateMemberNickname, changeMemberPassword } from "../api/authClient.js";

export default function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMember(await getCurrentMember());
    } catch (failure) {
      setMember(null);
      if (failure.status !== 401) setError(failure.message || "로그인 상태를 확인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentMember().then((result) => {
      if (active) setMember(result);
    }).catch((failure) => {
      if (active && failure.status !== 401) setError(failure.message || "로그인 상태를 확인하지 못했습니다.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function login(values) {
    const result = await loginMember(values);
    setMember(result);
    setError("");
  }

  async function logout() {
    await logoutMember();
    setMember(null);
    setError("");
  }

  async function updateNickname(nickname) {
    try {
      setMember(await updateMemberNickname(nickname));
    } catch (failure) {
      if (failure.status === 401) setMember(null);
      throw failure;
    }
  }

  async function changePassword(values) {
    try {
      await changeMemberPassword(values);
      setMember(null);
    } catch (failure) {
      if (failure.status === 401) setMember(null);
      throw failure;
    }
  }

  return <AuthContext.Provider value={{ member, loading, error, login, logout, refresh, updateNickname, changePassword }}>{children}</AuthContext.Provider>;
}
