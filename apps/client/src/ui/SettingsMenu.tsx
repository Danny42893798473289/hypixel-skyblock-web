import { soundManager } from '../audio/SoundManager';
import { useState, useEffect } from 'react';

interface SettingsMenuProps {
  onClose: () => void;
}

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const [volume, setVolume] = useState(soundManager.volume);
  const [muted, setMuted] = useState(soundManager.muted);
  const [showHud, setShowHud] = useState(() => {
    try { return localStorage.getItem('aether_hide_hud') !== 'true'; } catch { return true; }
  });

  useEffect(() => {
    soundManager.volume = volume;
  }, [volume]);

  useEffect(() => {
    soundManager.muted = muted;
  }, [muted]);

  useEffect(() => {
    try { localStorage.setItem('aether_hide_hud', showHud ? 'false' : 'true'); } catch { /* ignore */ }
  }, [showHud]);

  return (
    <div className="settings-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a2e', border: '2px solid #555', borderRadius: 8, padding: 24,
        minWidth: 320, maxWidth: 420, color: '#eee', fontFamily: 'monospace',
      }}>
        <h2 style={{ margin: '0 0 16px', color: '#ffaa00', fontSize: 18 }}>Settings</h2>

        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <span>Sound</span>
          <input type="checkbox" checked={!muted} onChange={(e) => setMuted(!e.target.checked)} />
        </label>

        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <span>Volume</span>
          <input type="range" min="0" max="100" value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            style={{ width: 120 }} />
        </label>

        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <span>Show HUD</span>
          <input type="checkbox" checked={showHud} onChange={(e) => setShowHud(e.target.checked)} />
        </label>

        <button onClick={onClose} style={{
          marginTop: 8, padding: '8px 24px', background: '#aa0000', color: '#fff',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace',
          fontSize: 14,
        }}>Close</button>
      </div>
    </div>
  );
}
