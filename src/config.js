// Backend base URL.
// Leave VITE_API_URL empty to use the same origin: in development Vite proxies
// /api to the Python backend, in production FastAPI serves this app itself.
export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function apiFetch(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(
      "Cannot reach the SpaceSage backend. Start it with `npm run backend` (or `npm run dev:all`).",
    );
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON response */
  }
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string" ? detail : `Request failed (${response.status})`,
    );
  }
  return data;
}
