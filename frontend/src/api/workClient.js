import { http } from "./http.ts";
import { authUrl } from "./authClient.js";

export const listWorks = () => http(authUrl("/works"), { credentials: "include" });
export const getWork = (id) => http(authUrl(`/works/${encodeURIComponent(id)}`), { credentials: "include" });
export const saveWork = (body) => http(authUrl("/works"), {
  method: "POST", credentials: "include",
  headers: { "Content-Type": "application/json", "X-LDA-Request": "auth" },
  body: JSON.stringify(body),
});

export const renameWork = (id, title) => http(authUrl(`/works/${encodeURIComponent(id)}`), {
  method: "PATCH", credentials: "include",
  headers: { "Content-Type": "application/json", "X-LDA-Request": "auth" },
  body: JSON.stringify({ title }),
});
export const deleteWork = (id) => http(authUrl(`/works/${encodeURIComponent(id)}`), {
  method: "DELETE", credentials: "include",
  headers: { "X-LDA-Request": "auth" },
});
