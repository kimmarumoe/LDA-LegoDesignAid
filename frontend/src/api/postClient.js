import { http } from "./http.ts";
import { authUrl } from "./authClient.js";

const request = (path, init = {}) => http(authUrl(`/posts${path}`), { credentials: "include", ...init });
const mutation = (path, method, body) => request(path, {
  method, headers: { "Content-Type": "application/json", "X-LDA-Request": "auth" },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
export const listPosts = (page = 0) => request(`?offset=${page * 12}&limit=12`);
export const getPost = (id) => request(`/${encodeURIComponent(id)}`);
export const createPost = (body) => mutation("", "POST", body);
export const editPost = (id, body) => mutation(`/${encodeURIComponent(id)}`, "PATCH", body);
export const deletePost = (id) => mutation(`/${encodeURIComponent(id)}`, "DELETE");
