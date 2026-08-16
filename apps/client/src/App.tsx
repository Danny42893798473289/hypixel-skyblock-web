import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ZONES,
  dungeonPhase,
  currentMayor,
  skyblockLevelFromXp,
  skyblockXp,
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [zonePlayers, setZonePlayers] = useState<PlayerPublic[]>([]);
  const [bazaarBook, setBazaarBook] = useState<OrderBookSnapshot | null>(null);
  const [bazaarOrders, setBazaarOrders] = useState<BazaarOrder[]>([]);
  const [bazaarMeta, setBazaarMeta] = useState<BazaarMeta | null>(null);
  const [chatText, setChatText] = useState('');
  const [chatFocused, setChatFocused] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const toastId = useRef(0);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const sync = () => setTouchMode(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const addToast = useCallback((message: string, kind?: string) => {
    const id = ++toastId.current;
    setToasts((current) => [...current.slice(-5), { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  useEffect(() => {
    if (!token) return;
    gameSocket.connect(token);
    const off = gameSocket.on((event: ServerEvent) => {
      switch (event.type) {
        case 'welcome':
        case 'state':
          setPlayer(event.player);
          break;
        case 'menu':
          setMenu(event.menu);
          setMenuVisible(true);
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
        case 'players':
          setZonePlayers(event.players);
          break;
        case 'zonePlayers':
          setZonePlayers(event.players);
          break;
        case 'toast':
          addToast(event.message, event.kind);
          break;
        case 'chat':
          setChats((current) => [...current.slice(-60), event.message]);
          break;
      }
    });
    return () => {
      off();
      gameSocket.disconnect();
    };
  }, [addToast, token]);

  const openMenu = useCallback((id: MenuId, context?: Record<string, string | number | boolean>) => {
    gameSocket.send({ type: 'openMenu', menu: id, context });
    setMenuVisible(true);
  }, []);

  const openInventory = useCallback(() => {
    gameSocket.send({ type: 'openMenu', menu: 'inventory' });
    setMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
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
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (menuVisible) closeMenu();
        else openMenu('skyblock');
      }
      if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        if (menuVisible && menu?.id === 'inventory') closeMenu();
        else openInventory();
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
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [closeMenu, exitChat, menu?.id, menuVisible, openInventory, openMenu]);

  if (!token || !player) {
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

  const zone = player.dungeonRun && player.zoneId === 'dungeon_room'
    ? { name: 'The Catacombs', description: 'Kill starred mobs, then open the Wither Door.' }
    : ZONES[player.zoneId];
  const parent = menu?.parent ?? 'skyblock';

  return (
    <main className={`game-screen${touchMode ? ' touch-mode' : ''}`}>
      <WorldCanvas
        player={player}
        zonePlayers={zonePlayers}
        inputDisabled={menuVisible || chatFocused}
        touchMode={touchMode}
        onOpenMenu={() => openMenu('skyblock')}
        onOpenInventory={openInventory}
      />

      <header className="hud-top">
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
      </header>

      <aside className="scoreboard">
        <h2>SKYBLOCK</h2>
        <div><span>Profile</span><strong>{player.username}</strong></div>
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
      </aside>

      <div className="actionbar">
        <span className="health">{Math.ceil(player.hp)}/{Math.round(player.maxHp)} ❤</span>
        <span className="defense">{Math.round(player.stats.defense)} ❈</span>
        <span className="mana">{Math.floor(player.mana)}/{Math.round(player.maxMana)} ✎ Mana</span>
      </div>

      <HotbarHud
        player={player}
        disabled={menuVisible || chatFocused}
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
          <span>{player.dragonFight.hp.toLocaleString()} ❤ — press E in the Dragon Nest</span>
        </div>
      ) : null}
      {player.kuudraFight ? (
        <div className="dungeon-hud slayer-hud">
          <strong className="mc-red">Kuudra T{player.kuudraFight.tier}</strong>
          <span>{player.kuudraFight.hp.toLocaleString()} / {player.kuudraFight.maxHp.toLocaleString()} ❤</span>
        </div>
      ) : null}

      {player.activeSlayer ? (
        <div className="dungeon-hud slayer-hud">
          <strong className="mc-red">Slayer · {player.activeSlayer.slayerId} T{player.activeSlayer.tier}</strong>
          <span>
            {player.activeSlayer.bossHp
              ? `Boss spawned — ${player.activeSlayer.bossHp.toLocaleString()} ❤  (walk up, press E)`
              : `Kill target mobs  ${player.activeSlayer.progressXp}/${player.activeSlayer.requiredXp} XP`}
          </span>
        </div>
      ) : null}

      {player.dungeonRun ? (
        <div className="dungeon-hud">
          <strong className="mc-gold">Catacombs {player.dungeonRun.floorId.toUpperCase()}</strong>
          <span>
            {dungeonPhase(player.dungeonRun) === 'starter' && 'Starter Room — open the Wither Door (E)'}
            {dungeonPhase(player.dungeonRun) === 'rooms' && (
              <>Room {player.dungeonRun.room}/{player.dungeonRun.rooms}
                {player.dungeonRun.roomCleared ? ' ✓ Door unlocked' : ' — kill ☠ mobs'}
              </>
            )}
            {dungeonPhase(player.dungeonRun) === 'boss' && `Boss — ${player.dungeonRun.bossHp?.toLocaleString() ?? '?'} ❤`}
          </span>
          <span className="mc-yellow">Score: {player.dungeonRun.score} · Secrets: {player.dungeonRun.secretsFound ?? 0}</span>
        </div>
      ) : null}

      <section className={`chat-box${touchMode && !chatOpen ? ' chat-collapsed' : ''}`}>
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
          if (touchMode) exitChat();
        }}>
          <input
            ref={chatInputRef}
            value={chatText}
            onChange={(event) => setChatText(event.target.value)}
            onFocus={() => { setChatFocused(true); setChatOpen(true); }}
            onBlur={() => setChatFocused(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                exitChat();
              }
            }}
            placeholder={touchMode ? 'Tap to chat...' : 'Press T to chat, Esc to exit...'}
            maxLength={120}
          />
          {chatFocused ? <button type="button" className="chat-exit" onClick={exitChat}>Esc</button> : null}
        </form>
      </section>

      {menu && menuVisible ? (
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
        )
      ) : null}

      <div className="toast-stack">
        {toasts.map((toast) => <div key={toast.id} className={`toast ${toast.kind ?? ''}`}>{toast.message}</div>)}
      </div>
    </main>
  );
}
