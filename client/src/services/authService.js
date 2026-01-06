const API_BASE = "http://localhost:5000";

export async function loginApi(userId, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, password }),
  });

  return res.json();
}
