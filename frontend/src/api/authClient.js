import { http } from "./http.ts";
import { getApiBaseUrl } from "../config/env.ts";

function authUrl(path) {
  const base = new URL(getApiBaseUrl());
  // localhost와 127.0.0.1을 섞으면 브라우저가 쿠키를 다른 사이트로 판단한다.
  const localHosts = ["localhost", "127.0.0.1"];
  if (import.meta.env.DEV && localHosts.includes(base.hostname) && localHosts.includes(window.location.hostname)) {
    base.hostname = window.location.hostname;
  }
  return `${base.toString().replace(/\/$/, "")}/api/auth${path}`;
}

export function getCurrentMember() {
  return http(authUrl("/me"), { credentials: "include" });
}

function post(path, body) {
  return http(authUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-LDA-Request": "auth" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const registerMember = (body) => post("/register", body);
export const loginMember = (body) => post("/login", body);
export const logoutMember = () => post("/logout");
export const updateMemberNickname = (nickname) => post("/nickname", { nickname });
export const changeMemberPassword = (body) => post("/password", body);
