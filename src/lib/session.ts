// Persistent per-device session id used to identify a player without auth.
const KEY = "mokhabi_session_id";

export const getSessionId = (): string => {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
};
