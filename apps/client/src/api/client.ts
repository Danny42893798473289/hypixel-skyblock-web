const API = '';

export async function apiRegister(username: string, password: string) {
  const res = await fetch(`${API}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Register failed');
  return data as { token: string; player: import('@aether/shared').PlayerState };
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Login failed');
  return data as { token: string; player: import('@aether/shared').PlayerState };
}

export async function apiCatalog() {
  const res = await fetch(`${API}/api/catalog`);
  return res.json();
}
