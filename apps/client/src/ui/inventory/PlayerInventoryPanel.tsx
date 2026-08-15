import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ITEMS,
  RECIPE_CATEGORIES,
  isRecipeUnlocked,
  recipesInCategory,
  type EquipmentSlot,
  type ItemStack,
  type PlayerState,
  type LoreLine,
  type RecipeCategory,
} from '@aether/shared';
import {
  ClickButton,
  IconSlotButton,
  ItemSlotButton,
  MenuOverlay,
} from '../chest/slotUtils';

/** Armor-only 3×3 equipment grid (no weapon slot — weapons live in the hotbar). */
const EQUIP_GRID: Array<{ key: EquipmentSlot; label: string; icon: string; previewItemId?: string } | null> = [
  null, { key: 'helmet', label: 'Helmet', icon: 'helmet', previewItemId: 'diamond_helmet' }, null,
  null, { key: 'chestplate', label: 'Chestplate', icon: 'chestplate', previewItemId: 'diamond_chestplate' }, null,
  { key: 'leggings', label: 'Leggings', icon: 'leggings', previewItemId: 'diamond_leggings' }, null,
  { key: 'boots', label: 'Boots', icon: 'boots', previewItemId: 'diamond_boots' },
];

const CRAFT_GRID_SIZE = 9;

interface Props {
  player: PlayerState;
  touchMode?: boolean;
  onMenuClick: (slot: number, button: ClickButton, action?: string) => void;
  onClose: () => void;
  onBack: () => void;
}

export function PlayerInventoryPanel({ player, touchMode = false, onMenuClick, onClose, onBack }: Props) {
  const [craftCategory, setCraftCategory] = useState<RecipeCategory>('tools');
  const [craftPage, setCraftPage] = useState(0);
  const lastTap = useRef<{ index: number; time: number } | null>(null);
  const cursor = player.inventoryCursor ?? null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Backspace') {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, onClose]);

  const storage = player.inventory.slice(0, 27);
  const hotbar = player.inventory.slice(27, 36);

  const craftRecipes = useMemo(() => recipesInCategory(craftCategory), [craftCategory]);
  const craftPages = Math.max(1, Math.ceil(craftRecipes.length / CRAFT_GRID_SIZE));
  const craftVisible = craftRecipes.slice(craftPage * CRAFT_GRID_SIZE, (craftPage + 1) * CRAFT_GRID_SIZE);

  function handleInventoryClick(index: number, button: ClickButton) {
    if (button.startsWith('shift')) {
      onMenuClick(index, button, `inventory:${index}`);
      return;
    }
    if (touchMode && button === 'left') {
      const now = Date.now();
      if (lastTap.current?.index === index && now - lastTap.current.time < 400) {
        onMenuClick(index, 'shift_left', `inventory:${index}`);
        lastTap.current = null;
        return;
      }
      lastTap.current = { index, time: now };
    }
    onMenuClick(index, button, `inventoryClick:${index}`);
  }

  function handleCursorClick(button: ClickButton) {
    if (button === 'right' || button === 'shift_right') {
      onMenuClick(0, button, 'inventoryUseCursor');
    }
  }

  return (
    <MenuOverlay title="Inventory & Crafting" onClose={onClose} onBack={onBack} className="inventory-panel-window">
      <div className="inventory-panel-body">
        <div className="inventory-panel-top">
          <section className="inventory-equipment-section">
            <div className="inventory-label">Equipment</div>
            <div className="inventory-equipment-grid">
              {EQUIP_GRID.map((entry, index) => {
                if (!entry) return <div key={`empty-${index}`} className="mc-slot empty" />;
                const stack = player.equipment[entry.key];
                if (stack) {
                  return (
                    <ItemSlotButton
                      key={entry.key}
                      stack={stack}
                      extraLore={[{ text: 'Click to unequip!', color: 'yellow' }]}
                      onClick={(button) => onMenuClick(0, button, `unequip:${entry.key}`)}
                    />
                  );
                }
                return (
                  <IconSlotButton
                    key={entry.key}
                    icon={entry.icon}
                    itemId={entry.previewItemId}
                    name={`${entry.label} Slot`}
                    lore={[{ text: 'Shift-click armor to equip.', color: 'gray' }]}
                    className="equipment-preview-slot"
                  />
                );
              })}
            </div>
            <div className="inventory-utility-row">
              <IconSlotButton
                icon="talisman"
                name="Accessory Bag"
                lore={[
                  { text: `${player.accessories.length} accessories`, color: 'white' },
                  { text: `Magical Power: ${player.magicalPower}`, color: 'light_purple' },
                  { text: 'Click to open!', color: 'yellow' },
                ]}
                onClick={(button) => onMenuClick(0, button, 'open:accessories')}
              />
              <IconSlotButton
                icon="anvil"
                name="Reforge Anvil"
                lore={[{ text: 'Click to open!', color: 'yellow' }]}
                onClick={(button) => onMenuClick(0, button, 'open:reforge')}
              />
              <IconSlotButton
                icon="enchanting_table"
                name="Enchanting Table"
                lore={[{ text: 'Click to open!', color: 'yellow' }]}
                onClick={(button) => onMenuClick(0, button, 'open:enchanting')}
              />
            </div>
          </section>

          <section className="inventory-crafting-section">
            <div className="inventory-label">Crafting Table</div>
            <div className="inventory-craft-tabs">
              {RECIPE_CATEGORIES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`inventory-craft-tab${craftCategory === entry.id ? ' active' : ''}`}
                  onClick={() => {
                    setCraftCategory(entry.id);
                    setCraftPage(0);
                  }}
                  aria-label={entry.name}
                >
                  {entry.name}
                </button>
              ))}
            </div>
            <div className="inventory-craft-grid">
              {craftVisible.map((recipe) => {
                const unlocked = isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, player.collections);
                const resultDef = ITEMS[recipe.result.itemId];
                const canCraft = unlocked && recipe.ingredients.every(
                  (ingredient) => player.inventory.reduce(
                    (total, stack) => (stack?.itemId === ingredient.itemId ? total + stack.qty : total),
                    0,
                  ) >= ingredient.qty,
                );
                return (
                  <IconSlotButton
                    key={recipe.id}
                    icon={resultDef?.sprite ?? 'crafting_table'}
                    itemId={recipe.result.itemId}
                    name={recipe.name}
                    rarity={resultDef?.rarity}
                    count={recipe.result.qty > 1 ? recipe.result.qty : undefined}
                    disabled={!unlocked}
                    glint={canCraft}
                    lore={[
                      { text: 'Ingredients:', color: 'yellow' },
                      ...recipe.ingredients.map((ingredient): LoreLine => {
                        const have = player.inventory.reduce(
                          (total, stack) => (stack?.itemId === ingredient.itemId ? total + stack.qty : total),
                          0,
                        );
                        return {
                          text: `${have >= ingredient.qty ? '✔' : '✖'} ${ingredient.qty}x ${ITEMS[ingredient.itemId]?.name ?? ingredient.itemId}`,
                          color: have >= ingredient.qty ? 'green' : 'red',
                        };
                      }),
                      { text: '', color: 'white' },
                      unlocked
                        ? { text: canCraft ? 'Click to craft!' : 'Missing ingredients', color: canCraft ? 'yellow' : 'red' }
                        : { text: `Requires ${recipe.unlockAmount?.toLocaleString()} ${ITEMS[recipe.unlockCollection!]?.name ?? 'collection'}`, color: 'red' },
                    ]}
                    onClick={unlocked && canCraft
                      ? (button) => onMenuClick(0, button, `craft:${recipe.id}`)
                      : undefined}
                  />
                );
              })}
              {Array.from({ length: Math.max(0, CRAFT_GRID_SIZE - craftVisible.length) }).map((_, index) => (
                <div key={`craft-empty-${index}`} className="mc-slot empty" />
              ))}
            </div>
            {craftPages > 1 ? (
              <div className="inventory-craft-pages">
                <button
                  type="button"
                  className="inventory-craft-page-btn"
                  disabled={craftPage <= 0}
                  onClick={() => setCraftPage((page) => Math.max(0, page - 1))}
                >
                  ◀
                </button>
                <span>{craftPage + 1} / {craftPages}</span>
                <button
                  type="button"
                  className="inventory-craft-page-btn"
                  disabled={craftPage >= craftPages - 1}
                  onClick={() => setCraftPage((page) => Math.min(craftPages - 1, page + 1))}
                >
                  ▶
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <section className="inventory-storage-section">
          <div className="inventory-held-row">
            <div className="inventory-label">Held Item</div>
            <HeldItemSlot cursor={cursor} onClick={handleCursorClick} />
          </div>
          <div className="inventory-label">Inventory</div>
          <div className="chest-grid inventory-storage-grid">
            {storage.map((stack, index) => (
              <ItemSlotButton
                key={index}
                stack={stack}
                onClick={(button) => handleInventoryClick(index, button)}
              />
            ))}
          </div>
          <div className="inventory-label hotbar-label">Hotbar</div>
          <div className="chest-grid inventory-hotbar-grid">
            {hotbar.map((stack, index) => {
              const slotIndex = index + 27;
              const active = player.hotbarSlot === index;
              return (
                <div
                  key={slotIndex}
                  className={`inventory-hotbar-slot${active ? ' active-hotbar' : ''}`.trim()}
                >
                  <ItemSlotButton
                    stack={stack}
                    onClick={(button) => handleInventoryClick(slotIndex, button)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <div className="menu-hint inventory-menu-hint">
        {touchMode
          ? 'Tap slots to pick up/place · Double-tap hotbar slot to use · Long-press to use'
          : 'Left-click pick up/place · Shift-click armor to equip · Shift-click weapons to hotbar · 1–9 select hotbar'}
      </div>
    </MenuOverlay>
  );
}

function HeldItemSlot({ cursor, onClick }: { cursor: ItemStack | null; onClick: (button: ClickButton) => void }) {
  const def = cursor ? ITEMS[cursor.itemId] : undefined;
  const lore: LoreLine[] = cursor && def
    ? [
      { text: 'Item on your cursor.', color: 'gray' },
      def.heal
        ? { text: 'Right-click to eat!', color: 'yellow' }
        : { text: 'Right-click to equip/use!', color: 'yellow' },
    ]
    : [{ text: 'Pick up an item from your inventory.', color: 'gray' }];

  return (
    <ItemSlotButton
      stack={cursor}
      emptyLabel="Held item slot"
      extraLore={lore}
      onClick={onClick}
      className="inventory-held-slot"
    />
  );
}
