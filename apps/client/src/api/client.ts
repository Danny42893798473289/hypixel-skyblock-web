const API = '';

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.ok
        ? 'Empty response from server'
        : 'Cannot reach the game server. Wait a few seconds after npm run dev, then try again.',
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Server returned an invalid response. Is the game server running on port 3001?');
  }
}

export async function apiRegister(username: string, password: string) {
  const res = await fetch(`${API}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = (await readJson(res)) as { error?: string; token?: string; player?: import('@aether/shared').PlayerState };
  if (!res.ok) throw new Error(data.error ?? 'Register failed');
  return data as { token: string; player: import('@aether/shared').PlayerState };
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = (await readJson(res)) as { error?: string; token?: string; player?: import('@aether/shared').PlayerState };
  if (!res.ok) throw new Error(data.error ?? 'Login failed');
  return data as { token: string; player: import('@aether/shared').PlayerState };
}

export async function apiCatalog() {
  const res = await fetch(`${API}/api/catalog`);
  return readJson(res);
}
