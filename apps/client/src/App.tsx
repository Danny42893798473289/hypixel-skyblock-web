import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ZONES,
  dungeonPhase,
  dungeonScoreGrade,
  currentRoomType,
  currentMayor,
  SKILLS,
  TILES,
  islandMap,
  skyblockLevelFromXp,
  skyblockXp,
  formatSkyblockSidebar,
  bossPhasesForFloor,
  dungeonFloor,
  type BazaarOrder,
  type BazaarMeta,
  type ChatMessage,
  type MenuId,
  type MenuView,
  type OrderBookSnapshot,
  type PlayerPublic,
  type PlayerState,
  type ServerEvent,
} from '@aether/shared';
import { AuthScreen } from './ui/AuthScreen';
import { SettingsMenu } from './ui/SettingsMenu';
import { soundManager } from './audio/SoundManager';
import { ChestMenu } from './ui/chest/ChestMenu';
import { PlayerInventoryPanel } from './ui/inventory/PlayerInventoryPanel';
import { BazaarProductPanel } from './ui/bazaar/BazaarProductPanel';
import { BazaarManageOrdersPanel } from './ui/bazaar/BazaarManageOrdersPanel';
import { AuctionBrowsePanel } from './ui/auction/AuctionBrowsePanel';
import { HotbarHud } from './ui/hotbar/HotbarHud';
import { gameSocket } from './api/socket';
import { WorldCanvas } from './world/WorldCanvas';

interface Toast {
  id: number;
  message: string;
  kind?: string;
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aether_token'));
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [menu, setMenu] = useState<MenuView | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPending, setMenuPending] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [zonePlayers, setZonePlayers] = useState<PlayerPublic[]>([]);
  const [bazaarBook, setBazaarBook] = useState<OrderBookSnapshot | null>(null);
  const [bazaarOrders, setBazaarOrders] = useState<BazaarOrder[]>([]);
  const [bazaarMeta, setBazaarMeta] = useState<BazaarMeta | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: number; x: number; y: number; amount: number; critical?: boolean }>>([]);
  const [seaCreatureAlert, setSeaCreatureAlert] = useState<string | null>(null);
  const [chatText, setChatText] = useState('');
  const [chatFocused, setChatFocused] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHud, setShowHud] = useState(() => localStorage.getItem('aether_hide_hud') !== 'true');
  const [tutorialStep, setTutorialStep] = useState(() => (localStorage.getItem('aether_tutorial_complete') === 'true' ? -1 : 0));
  const [menuTrail, setMenuTrail] = useState<string[]>([]);
  const [actionBar, setActionBar] = useState('');
  const [tabListOpen, setTabListOpen] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const toastId = useRef(0);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const actionBarTimer = useRef(0);
  const playerRef = useRef<PlayerState | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const sync = () => setTouchMode(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const addToast = useCallback((message: string, kind?: string) => {
    const id = ++toastId.current;
    setToasts((current) => [...current.slice(-5), { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const syncHud = () => setShowHud(localStorage.getItem('aether_hide_hud') !== 'true');
    window.addEventListener('storage', syncHud);
    const timer = window.setInterval(syncHud, 500);
    return () => {
      window.removeEventListener('storage', syncHud);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    gameSocket.connect(token);
    const off = gameSocket.on((event: ServerEvent) => {
      switch (event.type) {
        case 'welcome':
          setPlayer(event.player);
          break;
        case 'state':
          setPlayer((prev) => mergeLivePlayer(prev, event.player));
          break;
        case 'menu':
          setMenu(event.menu);
          setMenuPending(false);
          setMenuVisible(true);
          setMenuTrail((prev) => {
            if (!event.menu.parent || event.menu.parent === event.menu.id) return [event.menu.title];
            const root = event.menu.parent === 'skyblock' ? ['SkyBlock'] : [labelForMenu(event.menu.parent)];
            return [...root, event.menu.title];
          });
          soundManager.play('menu_open');
          if (event.menu.id === 'bazaar_item' && event.menu.context?.itemId) {
            gameSocket.send({ type: 'bazaarSubscribe', itemId: String(event.menu.context.itemId) });
          } else if (event.menu.id !== 'bazaar_orders' && event.menu.id !== 'bazaar') {
            gameSocket.send({ type: 'bazaarSubscribe', itemId: null });
          }
          break;
        case 'bazaarBook':
          setBazaarBook(event.book);
          break;
        case 'bazaarOrders':
          setBazaarOrders(event.orders);
          break;
        case 'bazaarMeta':
          setBazaarMeta(event.meta);
          break;
        case 'damageNumber':
          setDamageNumbers((current) => [...current.slice(-8), { id: Date.now(), x: event.x, y: event.y, amount: event.amount, critical: event.critical }]);
          break;
        case 'seaCreatureSpawn':
          setSeaCreatureAlert(event.name);
          window.setTimeout(() => setSeaCreatureAlert(null), 5000);
          break;
        case 'players':
          setZonePlayers(event.players);
          break;
        case 'zonePlayers':
          setZonePlayers(event.players);
          break;
        case 'toast':
          addToast(event.message, event.kind);
          soundManager.play(event.kind === 'error' ? 'error' : 'level_up');
          break;
        case 'actionBar':
          setActionBar(event.text);
          window.clearTimeout(actionBarTimer.current);
          actionBarTimer.current = window.setTimeout(() => setActionBar(''), 2500);
          break;
        case 'chat':
          setChats((current) => [...current.slice(-60), event.message]);
          soundManager.play('chat_message');
          break;
        case 'tradeOpen':
          break;
        case 'tradeClose':
          setMenu((current) => {
            if (current?.id !== 'trade') return current;
            setMenuVisible(false);
            setMenuPending(false);
            return null;
          });
          break;
      }
    });
    return () => {
      off();
      gameSocket.disconnect();
      window.clearTimeout(actionBarTimer.current);
    };
  }, [addToast, token]);

  const openMenu = useCallback((id: MenuId, context?: Record<string, string | number | boolean>) => {
    gameSocket.send({ type: 'openMenu', menu: id, context });
    setMenu(null);
    setMenuPending(true);
    setMenuVisible(true);
    setMenuTrail((prev) => (id === 'skyblock' ? ['SkyBlock'] : prev));
  }, []);

  const openInventory = useCallback(() => {
    gameSocket.send({ type: 'openMenu', menu: 'inventory' });
    setMenu(null);
    setMenuPending(true);
    setMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setMenuPending(false);
    soundManager.play('menu_close');
    gameSocket.send({ type: 'closeMenu' });
    gameSocket.send({ type: 'bazaarSubscribe', itemId: null });
    setBazaarBook(null);
  }, []);

  const exitChat = useCallback(() => {
    chatInputRef.current?.blur();
    setChatFocused(false);
    setChatOpen(false);
  }, []);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (!touchMode || !chatFocused) {
      document.documentElement.style.setProperty('--chat-keyboard-inset', '0px');
      return;
    }
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty('--chat-keyboard-inset', `${Math.round(inset)}px`);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.setProperty('--chat-keyboard-inset', '0px');
    };
  }, [chatFocused, touchMode]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (menuVisible || chatFocused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, .chest-overlay, .lore-tooltip')) return;
      const current = playerRef.current;
      if (!current) return;
      event.preventDefault();
      const dir = event.deltaY > 0 ? 1 : -1;
      const next = (current.hotbarSlot + dir + 9) % 9;
      gameSocket.send({ type: 'setHotbar', slot: next });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [chatFocused, menuVisible]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target?.matches('input, textarea, [contenteditable="true"]'));
      if (event.key === 'Escape' && typing) {
        event.preventDefault();
        event.stopPropagation();
        exitChat();
        return;
      }
      if (typing) return;
      if (event.key === '/' && !menuVisible) {
        event.preventDefault();
        setChatOpen(true);
        setChatFocused(true);
        setChatText((text) => (text.startsWith('/') ? text : `/${text}`));
        window.setTimeout(() => {
          const input = chatInputRef.current;
          if (!input) return;
          input.focus();
          const end = input.value.length;
          input.setSelectionRange(end, end);
        }, 0);
        return;
      }
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (menuVisible) closeMenu();
        else openMenu('skyblock');
      }
      if (event.key.toLowerCase() === 'b' && !menuVisible) {
        event.preventDefault();
        openMenu('bazaar');
      }
      if (event.key.toLowerCase() === 'h' && !menuVisible) {
        event.preventDefault();
        gameSocket.send({ type: 'chat', text: '/warp hub' });
        addToast('Warping to Hub...', 'success');
      }
      if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        if (menuVisible && menu?.id === 'inventory') closeMenu();
        else openInventory();
      }
      if (event.key.toLowerCase() === 'e' && menuVisible) {
        event.preventDefault();
        closeMenu();
      }
      if (event.key.toLowerCase() === 'q') {
        event.preventDefault();
        gameSocket.send({ type: 'dropHotbar', all: event.ctrlKey || event.metaKey });
      }
      if (!menuVisible && !event.key.startsWith('F')) {
        const num = Number(event.key);
        if (num >= 1 && num <= 9) {
          event.preventDefault();
          gameSocket.send({ type: 'setHotbar', slot: num - 1 });
        }
      }
      if (event.key.toLowerCase() === 't' && !menuVisible) {
        event.preventDefault();
        setChatOpen(true);
        chatInputRef.current?.focus();
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        setTabListOpen(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') setTabListOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [closeMenu, exitChat, menu?.id, menuVisible, openInventory, openMenu]);

  if (!token) {
    return (
      <AuthScreen
        onAuth={(nextToken, nextPlayer) => {
          localStorage.setItem('aether_token', nextToken);
          setToken(nextToken);
          setPlayer(nextPlayer);
        }}
      />
    );
  }

  if (!player) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0a1a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#ffaa00', fontFamily: 'monospace',
      }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Aether Isles</h1>
        <div style={{ fontSize: 14, color: '#aaa' }}>Connecting to server...</div>
        <div style={{
          marginTop: 24, width: 200, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: '#ffaa00', borderRadius: 2,
            animation: 'loadingBar 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    );
  }

  const zone = player.dungeonRun && player.zoneId === 'dungeon_room'
    ? { name: 'The Catacombs', description: 'Kill starred mobs, then open the Wither Door.' }
    : ZONES[player.zoneId];
  const parent = menu?.parent ?? 'skyblock';
  const bossHud = currentBossHud(player, seaCreatureAlert);

  return (
    <main className={`game-screen${touchMode ? ' touch-mode' : ''}`}>
      <WorldCanvas
        player={player}
        zonePlayers={zonePlayers}
        inputDisabled={menuVisible}
        chatFocused={chatFocused}
        touchMode={touchMode}
        onOpenMenu={() => openMenu('skyblock')}
        onOpenInventory={openInventory}
        onTabList={() => setTabListOpen((open) => !open)}
      />

      <button onClick={() => setShowSettings(true)} style={{
        position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)',
        border: '1px solid #555', borderRadius: 4, color: '#aaa', cursor: 'pointer',
        padding: '4px 8px', fontFamily: 'monospace', fontSize: 12, zIndex: 100,
      }}>⚙</button>
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}

      {bossHud ? (
        <div className="global-bossbar">
          <div className="global-bossbar-label">{bossHud.label}</div>
          <div className="global-bossbar-track">
            <div className="global-bossbar-fill" style={{ width: `${Math.max(0, Math.min(100, bossHud.pct))}%` }} />
          </div>
        </div>
      ) : null}

      {showHud ? <header className="hud-top">
        <div className="hud-brand">SKYBLOCK</div>
        <div className="hud-location">
          <strong>{zone?.name ?? player.zoneId}</strong>
          <span>{zone?.description}</span>
        </div>
        <div className="hud-actions">
          <button className="mc-button" onClick={() => openMenu('skyblock')}>SkyBlock Menu</button>
          {touchMode ? (
            <button type="button" className="mc-button hud-inventory-button" onClick={openInventory}>Inventory</button>
          ) : null}
          <button
            type="button"
            className="logout-button"
            onClick={() => {
              localStorage.removeItem('aether_token');
              setToken(null);
              setPlayer(null);
              setMenu(null);
            }}
          >
            Log out
          </button>
        </div>
      </header> : null}

      {showHud ? <aside className="scoreboard">
        <h2>SKYBLOCK</h2>
        <div className="score-divider" />
        <div><span>{formatSkyblockSidebar(clock).date}</span></div>
        <div><span>{formatSkyblockSidebar(clock).time}</span><strong className="mc-aqua">{player.serverId ?? 'm1'}</strong></div>
        <div><span>Profile</span><strong>{player.profileName ?? player.username}</strong></div>
        <div><span>Purse</span><strong className="mc-gold">{Math.floor(player.coins).toLocaleString()} ⛃</strong></div>
        <div><span>Bank</span><strong className="mc-gold">{Math.floor(player.bank.balance).toLocaleString()} ⛃</strong></div>
        <div><span>Location</span><strong className="mc-aqua">{zone?.name ?? player.zoneId}</strong></div>
        <div><span>Players</span><strong>{zonePlayers.length}</strong></div>
        <div><span>SB Lvl</span><strong className="mc-gold">{skyblockLevelFromXp(skyblockXp({
          skills: player.skills,
          collections: player.collections,
          slayerXp: player.slayerXp,
          fairySouls: player.fairySouls,
          museumDonated: player.museum?.donated.length ?? 0,
          bestiaryKills: Object.values(player.bestiary?.kills ?? {}).reduce((sum, n) => sum + n, 0),
        })).level}</strong></div>
        <div><span>Mayor</span><strong>{currentMayor().name}</strong></div>
        <div className="score-divider" />
        {player.hotm && (player.hotm.tokens > 0 || player.hotm.mithrilPowder > 0 || player.hotm.commissions.length > 0) && (
          <>
            <div><span>HotM</span><strong className="mc-aqua">{player.hotm.tokens} token{player.hotm.tokens === 1 ? '' : 's'} · {player.hotm.mithrilPowder.toLocaleString()} mithril{(player.hotm.gemstonePowder ?? 0) > 0 ? ` · ${player.hotm.gemstonePowder.toLocaleString()} gem` : ''}</strong></div>
            {player.hotm.commissions.slice(0, 2).map((job) => (
              <div key={job.id}><span>{job.label}</span><strong className={job.have >= job.need ? 'mc-green' : 'mc-yellow'}>{job.have}/{job.need}</strong></div>
            ))}
          </>
        )}
        {(player.bits > 0 || (player.dailies?.tasks.length ?? 0) > 0) && (
          <>
            <div><span>Bits</span><strong className="mc-green">{(player.bits ?? 0).toLocaleString()}</strong></div>
            {(player.dailies?.tasks ?? []).slice(0, 2).map((task) => (
              <div key={task.id}><span>{task.label}</span><strong className={task.claimed || task.have >= task.need ? 'mc-green' : 'mc-yellow'}>{task.claimed ? 'done' : `${task.have}/${task.need}`}</strong></div>
            ))}
          </>
        )}
      </aside> : null}

      {showHud ? <MiniMap player={player} zonePlayers={zonePlayers} /> : null}

      {showHud ? <div className="actionbar">
        {actionBar ? <div className="xp-actionbar">{actionBar}</div> : <div className="xp-actionbar xp-actionbar-spacer" />}
        <div className="skyblock-actionbar">
          <span className="mc-red">{Math.ceil(player.hp).toLocaleString()}/{Math.round(player.maxHp).toLocaleString()}❤</span>
          <span className="mc-green">{Math.round(player.stats.defense).toLocaleString()}❈ Defense</span>
          <span className="mc-aqua">{Math.floor(player.mana).toLocaleString()}/{Math.round(player.maxMana).toLocaleString()}✎ Mana</span>
        </div>
        <div className="mobile-ticker">
          <span>{formatSkyblockSidebar(clock).date} · {formatSkyblockSidebar(clock).time}</span>
          <span className="mc-aqua">{player.serverId ?? 'm1'}</span>
        </div>
        <div className="stat-bars">
          <div className="stat-bar health-bar">
            <div className="stat-bar-fill" style={{ width: `${Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100))}%` }} />
            <span className="health">{Math.ceil(player.hp)}/{Math.round(player.maxHp)} ❤</span>
          </div>
          <div className="stat-bar defense-bar">
            <div className="stat-bar-fill" style={{ width: `${Math.max(0, Math.min(100, player.stats.defense / 4))}%` }} />
            <span className="defense">{Math.round(player.stats.defense)} ❈ Defense</span>
          </div>
          <div className="stat-bar mana-bar">
            <div className="stat-bar-fill" style={{ width: `${Math.max(0, Math.min(100, (player.mana / Math.max(1, player.maxMana)) * 100))}%` }} />
            <span className="mana">{Math.floor(player.mana)}/{Math.round(player.maxMana)} ✎</span>
          </div>
          {player.lastSkillGain ? (
            <div className="stat-bar skill-bar">
              <div className="stat-bar-fill" style={{ width: `${Math.max(0, Math.min(100, (player.lastSkillGain.intoLevel / Math.max(1, player.lastSkillGain.need)) * 100))}%` }} />
              <span className="skill-xp">{SKILLS[player.lastSkillGain.skillId]?.name ?? player.lastSkillGain.skillId} {player.lastSkillGain.level} · {Math.floor(player.lastSkillGain.intoLevel)}/{player.lastSkillGain.need}</span>
            </div>
          ) : null}
        </div>
      </div> : null}

      <HotbarHud
        player={player}
        disabled={menuVisible || (chatFocused && !touchMode)}
        touchMode={touchMode}
        onSelectSlot={(slot) => gameSocket.send({ type: 'setHotbar', slot })}
        onUseSlot={(inventoryIndex) => gameSocket.send({ type: 'useItem', slot: inventoryIndex })}
      />

      {player.islandId === 'garden' ? (
        <div className="dungeon-hud slayer-hud">
          <strong className="mc-green">Jacob's Contest</strong>
          <span>{player.garden?.jacobCrop ?? 'wheat'} · score {player.garden?.jacobScore ?? 0}</span>
        </div>
      ) : null}

      {player.dragonFight && player.dragonFight.hp > 0 ? (
        <div className="dungeon-hud slayer-hud">
          <strong className="mc-light-purple">{player.dragonFight.type}</strong>
          <span>{player.dragonFight.hp.toLocaleString()} ❤ — click to attack in the Dragon Nest</span>
        </div>
      ) : null}
      {player.kuudraFight ? (
        <div className="dungeon-hud slayer-hud">
          <strong className="mc-red">Kuudra T{player.kuudraFight.tier}</strong>
          <span>{player.kuudraFight.hp.toLocaleString()} / {player.kuudraFight.maxHp.toLocaleString()} ❤</span>
          <span className="mc-gray">Type /leave to abandon</span>
        </div>
      ) : null}

      {player.activeSlayer ? (
        <div className="dungeon-hud slayer-hud">
          <strong className="mc-red">Slayer · {player.activeSlayer.slayerId} T{player.activeSlayer.tier}</strong>
          <span>
            {player.activeSlayer.bossHp
              ? `Boss · phase ${(player.activeSlayer.bossPhase ?? 0) + 1}/3 — ${player.activeSlayer.bossHp.toLocaleString()} ❤  (face it, click to attack)`
              : `Kill target mobs  ${player.activeSlayer.progressXp}/${player.activeSlayer.requiredXp} XP`}
          </span>
        </div>
      ) : null}

      {player.dungeonRun ? (
        <div className="dungeon-hud">
          {dungeonPhase(player.dungeonRun) === 'boss' && player.dungeonRun.bossHp != null ? (
            <div className="boss-bar">
              <div className="boss-bar-label">{player.dungeonRun.bossPhaseName ?? 'Boss'}</div>
              <div className="boss-bar-track">
                {bossPhasesForFloor(player.dungeonRun.floorId).map((phase, i) => {
                  const idx = player.dungeonRun?.bossPhaseIndex ?? 0;
                  const total = dungeonFloor(player.dungeonRun?.floorId ?? '')?.boss.health ?? 1;
                  const phaseMax = Math.max(1, Math.round(total * phase.hpShare));
                  const hp = player.dungeonRun?.bossHp ?? 0;
                  const fill = i < idx ? 0 : i > idx ? 100 : Math.max(0, Math.min(100, (hp / phaseMax) * 100));
                  return (
                    <div key={phase.name} className="boss-bar-segment">
                      <div className="boss-bar-fill" style={{ width: `${fill}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <strong className="mc-gold">Catacombs {player.dungeonRun.floorId.toUpperCase()}</strong>
          <span>
            {dungeonPhase(player.dungeonRun) === 'starter' && 'Starter Room — open the Wither Door (E)'}
            {dungeonPhase(player.dungeonRun) === 'rooms' && (
              <>
                {currentRoomType(player.dungeonRun) === 'puzzle' && `Puzzle ${player.dungeonRun.room}/${player.dungeonRun.rooms}${player.dungeonRun.roomCleared ? ' ✓ Door unlocked' : ' — activate pads (E)'}`}
                {currentRoomType(player.dungeonRun) === 'trap' && `Trap ${player.dungeonRun.room}/${player.dungeonRun.rooms}${player.dungeonRun.roomCleared ? ' ✓ Door unlocked' : ' — keep moving, then kill'}`}
                {currentRoomType(player.dungeonRun) === 'fairy' && `Fairy ${player.dungeonRun.room}/${player.dungeonRun.rooms}${player.dungeonRun.roomCleared ? ' — optional secret, door open' : ''}`}
                {currentRoomType(player.dungeonRun) === 'combat' && (
                  <>Room {player.dungeonRun.room}/{player.dungeonRun.rooms}
                    {player.dungeonRun.roomCleared ? ' ✓ Door unlocked' : ' — kill ☠ packs'}
                  </>
                )}
              </>
            )}
            {dungeonPhase(player.dungeonRun) === 'boss' && `${player.dungeonRun.bossPhaseName ?? 'Boss'} — ${player.dungeonRun.bossHp?.toLocaleString() ?? '?'} ❤`}
          </span>
          <span className="mc-yellow">Score: {player.dungeonRun.score} ({dungeonScoreGrade(player.dungeonRun.score)}) · Secrets: {player.dungeonRun.secretsFound ?? 0} · Deaths: {player.dungeonRun.deaths ?? 0}</span>
          <span className="mc-gray">Type /leave to abandon</span>
        </div>
      ) : null}

      {tabListOpen ? (
        <div className="tab-list" role="dialog" aria-label="Player list">
          <div className="tab-list-head">
            <strong>{player.serverId ?? 'm1'}</strong>
            <span>{zonePlayers.length} online</span>
          </div>
          <div className="tab-list-party">
            Party: {player.dungeonRun?.partyId ? 'dungeon party' : player.coopHostId ? 'co-op' : 'solo'}
          </div>
          <ul>
            {zonePlayers.map((entry) => (
              <li key={entry.id}>
                <span>{entry.username}</span>
                <span className="mc-red">{Math.ceil(entry.hp)}/{Math.round(entry.maxHp)}❤</span>
              </li>
            ))}
          </ul>
          <div className="tab-list-stats">
            <span className="mc-red">❤ {Math.round(player.stats.health)}</span>
            <span className="mc-green">❈ {Math.round(player.stats.defense)}</span>
            <span className="mc-red">❁ {Math.round(player.stats.strength)}</span>
            <span className="mc-aqua">✎ {Math.round(player.stats.intelligence)}</span>
            <span>✦ {Math.round(player.stats.speed)}</span>
          </div>
        </div>
      ) : null}

      <section className={`chat-box${chatFocused ? ' chat-focused' : ' chat-collapsed'}${touchMode && !chatOpen ? ' chat-collapsed' : ''}`}>
        <div className="chat-messages">
          {chats.slice(-8).map((message) => (
            <div key={message.id}><strong className="mc-yellow">{message.username}</strong><span>: {message.text}</span></div>
          ))}
        </div>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (!chatText.trim()) return;
          gameSocket.send({ type: 'chat', text: chatText });
          setChatText('');
          exitChat();
        }}>
          <input
            ref={chatInputRef}
            value={chatText}
            onChange={(event) => setChatText(event.target.value)}
            onFocus={() => { setChatFocused(true); setChatOpen(true); }}
            onBlur={() => {
              setChatFocused(false);
              if (touchMode) setChatOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                exitChat();
              }
            }}
            placeholder={touchMode ? 'Tap to chat...' : 'T chat · / command · /warp hub  /ah  /bz diamond'}
            maxLength={120}
          />
          {chatFocused ? <button type="button" className="chat-exit" onClick={exitChat}>Esc</button> : null}
        </form>
      </section>

      {menuVisible && menuPending && !menu ? (
        <div className="chest-overlay" role="dialog" aria-busy="true" aria-label="Loading menu">
          <div className="chest-window chest-window-loading">
            <div className="chest-title"><span>Loading…</span></div>
          </div>
        </div>
      ) : null}

      {menu && menuVisible && !menuPending ? (
        menu.id === 'inventory' ? (
          <PlayerInventoryPanel
            player={player}
            touchMode={touchMode}
            onMenuClick={(slot, button, action) => {
              if (action === 'close') {
                closeMenu();
                return;
              }
              gameSocket.send({ type: 'menuClick', menu: menu.id, slot, button, action });
            }}
            onClose={closeMenu}
            onBack={() => openMenu(parent)}
          />
        ) : menu.id === 'bazaar_item' && menu.context?.itemId ? (
          <BazaarProductPanel
            itemId={String(menu.context.itemId)}
            book={bazaarBook?.itemId === menu.context.itemId ? bazaarBook : null}
            orders={bazaarOrders}
            bazaarMeta={bazaarMeta}
            onMenuClick={(slot, button, action) => {
              if (action === 'close') {
                closeMenu();
                return;
              }
              gameSocket.send({ type: 'menuClick', menu: menu.id, slot, button, action });
            }}
            onClose={closeMenu}
            onBack={() => openMenu(parent)}
          />
        ) : menu.id === 'bazaar_orders' ? (
          <BazaarManageOrdersPanel
            orders={bazaarOrders}
            onMenuClick={(slot, button, action) => {
              if (action === 'close') {
                closeMenu();
                return;
              }
              gameSocket.send({ type: 'menuClick', menu: menu.id, slot, button, action });
            }}
            onClose={closeMenu}
            onBack={() => openMenu(parent, menu.context)}
          />
        ) : menu.id === 'auction' && (menu.context?.mode == null || menu.context?.mode === 'browse') ? (
          <AuctionBrowsePanel
            onMenuClick={(slot, button, action) => {
              if (action === 'close') {
                closeMenu();
                return;
              }
              gameSocket.send({ type: 'menuClick', menu: menu.id, slot, button, action });
            }}
            onClose={closeMenu}
            onBack={() => openMenu(parent)}
          />
        ) : (
          <ChestMenu
            menu={menu}
            player={player}
            breadcrumbs={menuTrail}
            onBreadcrumb={(index) => {
              if (index <= 0) {
                openMenu('skyblock');
                return;
              }
              if (index === menuTrail.length - 2) {
                openMenu(parent, menu.context);
              }
            }}
            onQuickOpen={(target) => {
              if (target === 'hub') {
                gameSocket.send({ type: 'chat', text: '/warp hub' });
                return;
              }
              openMenu(target as MenuId);
            }}
            onMenuClick={(slot, button, action) => {
              if (action === 'close') {
                closeMenu();
                return;
              }
              if (menu.id === 'trade' && action?.startsWith('inventory:')) {
                const itemSlot = Number(action.slice('inventory:'.length));
                const raw = menu.context?.selectedTradeSlot;
                const selected = raw === undefined || raw === '' ? Number.NaN : Number(raw);
                if (Number.isFinite(selected) && selected >= 0 && selected <= 3) {
                  gameSocket.send({ type: 'tradeOffer', coins: -1, slot: selected, itemSlot });
                  return;
                }
              }
              gameSocket.send({ type: 'menuClick', menu: menu.id, slot, button, action });
            }}
            onClose={closeMenu}
            onBack={() => {
              if (menu.id === 'trade') {
                gameSocket.send({ type: 'tradeCancel' });
                return;
              }
              openMenu(parent, menu.context);
            }}
            onSearch={(query) => openMenu('bazaar', query ? { query, page: 0 } : {})}
          />
        )
      ) : null}

          {seaCreatureAlert ? (
        <div className="sea-creature-alert">{seaCreatureAlert} — click to fight!</div>
      ) : null}

      {damageNumbers.map((hit) => (
        <div
          key={hit.id}
          className={`damage-number${hit.critical ? ' crit' : ''}`}
          style={{ left: `${40 + hit.x * 8}%`, top: `${30 + hit.y * 4}%` }}
        >
          {hit.amount.toLocaleString()}{hit.critical ? ' ✧' : ''}
        </div>
      ))}

      <div className="toast-stack">
        {toasts.map((toast) => <div key={toast.id} className={`toast ${toast.kind ?? ''}`}>{toast.message}</div>)}
      </div>

      {tutorialStep >= 0 ? (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <h3>{TUTORIAL_STEPS[tutorialStep]?.title}</h3>
            <p>{TUTORIAL_STEPS[tutorialStep]?.body}</p>
            <div className="tutorial-actions">
              <button
                type="button"
                className="mc-button"
                onClick={() => {
                  if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
                    localStorage.setItem('aether_tutorial_complete', 'true');
                    setTutorialStep(-1);
                    return;
                  }
                  setTutorialStep((step) => step + 1);
                }}
              >
                {tutorialStep >= TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
              </button>
              <button
                type="button"
                className="logout-button"
                onClick={() => {
                  localStorage.setItem('aether_tutorial_complete', 'true');
                  setTutorialStep(-1);
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

/** Keep predicted walk position; only apply server x/y on warps, death, and island changes. */
function mergeLivePlayer(prev: PlayerState | null, next: PlayerState): PlayerState {
  const { resetPosition: shouldReset, ...rest } = next;
  if (!prev || shouldReset || rest.islandId !== prev.islandId) {
    // Keep the flag so useMovement can snap the camera. Next state without it clears it.
    return shouldReset ? { ...rest, resetPosition: true } : rest;
  }
  return { ...rest, x: prev.x, y: prev.y, facing: prev.facing };
}

const TUTORIAL_STEPS = [
  { title: 'Movement', body: 'Use WASD to move around. Hold Shift to sprint and explore faster.' },
  { title: 'Interact', body: 'Press E near NPCs, portals, stations, and resources to interact.' },
  { title: 'Menus', body: 'Press M for SkyBlock menu and I for inventory. B opens Bazaar quickly.' },
  { title: 'Combat', body: 'Left click to attack mobs. Right click or R uses your held item ability.' },
  { title: 'Chat & Commands', body: 'Press T to chat. Useful shortcuts: H to warp Hub, / for commands.' },
];

function labelForMenu(menuId: string): string {
  return menuId.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function currentBossHud(player: PlayerState, seaCreatureAlert: string | null): { label: string; pct: number } | null {
  if (player.dungeonRun?.bossHp && player.dungeonRun?.bossPhaseName) {
    const total = dungeonFloor(player.dungeonRun.floorId)?.boss.health ?? player.dungeonRun.bossHp;
    return { label: player.dungeonRun.bossPhaseName, pct: (player.dungeonRun.bossHp / Math.max(1, total)) * 100 };
  }
  if (player.activeSlayer?.bossHp) {
    const maxHp = player.activeSlayer.tier * 250_000;
    return { label: `${player.activeSlayer.slayerId} Slayer`, pct: (player.activeSlayer.bossHp / Math.max(1, maxHp)) * 100 };
  }
  if (player.dragonFight?.hp) {
    return { label: player.dragonFight.type, pct: (player.dragonFight.hp / Math.max(1, player.dragonFight.maxHp)) * 100 };
  }
  if (player.kuudraFight?.hp) {
    return { label: `Kuudra T${player.kuudraFight.tier}`, pct: (player.kuudraFight.hp / Math.max(1, player.kuudraFight.maxHp)) * 100 };
  }
  if (seaCreatureAlert) {
    return { label: seaCreatureAlert, pct: 100 };
  }
  return null;
}

function MiniMap({ player, zonePlayers }: { player: PlayerState; zonePlayers: PlayerPublic[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const map = islandMap(player.islandId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 120;
    canvas.width = size;
    canvas.height = size;
    const scaleX = size / map.width;
    const scaleY = size / map.height;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        ctx.fillStyle = TILES[map.tiles[y][x]].color;
        ctx.fillRect(Math.floor(x * scaleX), Math.floor(y * scaleY), Math.ceil(scaleX), Math.ceil(scaleY));
      }
    }
    ctx.fillStyle = '#ffff55';
    ctx.fillRect(Math.floor(player.x * scaleX) - 1, Math.floor(player.y * scaleY) - 1, 3, 3);
    ctx.fillStyle = '#ffffff';
    for (const entry of zonePlayers) {
      if (entry.id === player.id || entry.islandId !== player.islandId) continue;
      ctx.fillRect(Math.floor(entry.x * scaleX), Math.floor(entry.y * scaleY), 2, 2);
    }
  }, [player.id, player.islandId, player.x, player.y, zonePlayers]);
  return <canvas ref={ref} className="mini-map" aria-label="Minimap" />;
}

