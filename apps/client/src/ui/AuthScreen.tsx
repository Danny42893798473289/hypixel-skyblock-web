import { useEffect, useState } from 'react';
import { apiLogin, apiRegister } from '../api/client';
import type { PlayerState } from '@aether/shared';

interface Props {
  onAuth: (token: string, player: PlayerState) => void;
}

export function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('aether_user');
    const savedPass = localStorage.getItem('aether_pass');
    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await apiLogin(username, password)
          : await apiRegister(username, password);
      localStorage.setItem('aether_token', result.token);
      localStorage.setItem('aether_user', username);
      localStorage.setItem('aether_pass', password);
      onAuth(result.token, result.player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card panel" onSubmit={submit}>
        <h1 className="pixel-title">Aether Isles</h1>
        <p>SkyBlock-style panel game — gather, craft, warp islands, trade on the bazaar.</p>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {error && <div className="error">{error}</div>}
        <button className="primary" disabled={loading} type="submit">
          {loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
