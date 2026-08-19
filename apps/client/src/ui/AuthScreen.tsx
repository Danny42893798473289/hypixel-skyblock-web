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
  const [remember, setRemember] = useState(true);
  const [accent, setAccent] = useState('#55ffff');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('aether_user');
    if (savedUser) {
      setUsername(savedUser);
    }
    const savedRemember = localStorage.getItem('aether_remember') !== 'false';
    setRemember(savedRemember);
    const savedAccent = localStorage.getItem('aether_ui_accent');
    if (savedAccent) setAccent(savedAccent);
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
      localStorage.setItem('aether_remember', remember ? 'true' : 'false');
      localStorage.setItem('aether_ui_accent', accent);
      if (remember) localStorage.setItem('aether_user', username);
      else localStorage.removeItem('aether_user');
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
        <h1 className="pixel-title auth-logo">Aether Isles</h1>
        <p>SkyBlock-style MMORPG — gather, craft, warp islands, and build your profile.</p>
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
        {mode === 'register' ? (
          <label className="auth-checkbox-row">
            <span>Name accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          </label>
        ) : null}
        <label className="auth-checkbox-row">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Remember me</span>
        </label>
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
