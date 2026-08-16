import { useEffect, useMemo, useState } from 'react';
import {
  ITEMS,
  RECIPE_CATEGORIES,
  isRecipeUnlocked,
  recipesInCategory,
  buildRecipeBookLore,
  countItem,
  type EquipmentSlot,
  type PlayerState,
  type Recipe,
  type RecipeCategory,
} from '@aether/shared';
import {
  ClickButton,
  HeldCursorGhost,
  IconSlotButton,
  ItemSlotButton,
  MenuOverlay,
} from '../chest/slotUtils';
import { ItemIcon } from '../chest/ItemIcon';

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
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const cursor = player.inventoryCursor ?? null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const storage = player.inventory.slice(0, 27);
  const hotbar = player.inventory.slice(27, 36);

  const craftRecipes = useMemo(() => recipesInCategory(craftCategory), [craftCategory]);
  const craftPages = Math.max(1, Math.ceil(craftRecipes.length / CRAFT_GRID_SIZE));
  const craftVisible = craftRecipes.slice(craftPage * CRAFT_GRID_SIZE, (craftPage + 1) * CRAFT_GRID_SIZE);
  const selectedRecipe = selectedRecipeId
    ? craftVisible.find((recipe) => recipe.id === selectedRecipeId) ?? null
    : null;

  useEffect(() => {
    setSelectedRecipeId(null);
  }, [craftCategory, craftPage]);

  function handleInventoryClick(index: number, button: ClickButton) {
    if (button.startsWith('shift')) {
      onMenuClick(index, button, `inventory:${index}`);
      return;
    }
    onMenuClick(index, button, `inventoryClick:${index}`);
  }

  return (
    <MenuOverlay title="Inventory & Crafting" onClose={onClose} onBack={onBack} className="inventory-panel-window">
      <HeldCursorGhost stack={cursor} />
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
                icon="chest"
                name="Storage"
                lore={[
                  { text: '10 double chests of extra inventory.', color: 'gray' },
                  { text: 'Click to open!', color: 'yellow' },
                ]}
                onClick={(button) => onMenuClick(0, button, 'open:backpack')}
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
            <div className="inventory-craft-row">
            <div className="inventory-craft-grid">
              {craftVisible.map((recipe) => {
                const unlocked = isRecipeUnlocked(recipe.unlockCollection, recipe.unlockAmount, player.collections);
                const resultDef = ITEMS[recipe.result.itemId];
                const canCraft = unlocked && recipe.ingredients.every(
                  (ingredient) => countItem(player.inventory, ingredient.itemId) >= ingredient.qty,
                );
                const selected = selectedRecipe?.id === recipe.id;
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
                    className={selected ? 'inventory-craft-selected' : ''}
                    lore={buildRecipeBookLore(recipe, player.collections, (itemId) => countItem(player.inventory, itemId))}
                    onClick={() => {
                      setSelectedRecipeId(recipe.id);
                      if (unlocked && canCraft) onMenuClick(0, 'left', `craft:${recipe.id}`);
                    }}
                  />
                );
              })}
              {Array.from({ length: Math.max(0, CRAFT_GRID_SIZE - craftVisible.length) }).map((_, index) => (
                <div key={`craft-empty-${index}`} className="mc-slot empty" />
              ))}
            </div>
            {selectedRecipe ? (
              <CraftRecipeDetail recipe={selectedRecipe} player={player} />
            ) : null}
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
          ? 'Tap to pick up/place · Hold a slot for item info · Double-tap to shift-click'
          : 'Hover for item info · Left-click pick up/place · Shift-click armor to equip · Shift-click weapons to hotbar'}
      </div>
    </MenuOverlay>
  );
}

function CraftRecipeDetail({ recipe, player }: { recipe: Recipe; player: PlayerState }) {
  const resultDef = ITEMS[recipe.result.itemId];
  const lore = buildRecipeBookLore(recipe, player.collections, (itemId) => countItem(player.inventory, itemId));
  const pattern = Array.from({ length: 9 }, (_, index) => recipe.ingredients[index] ?? null);

  return (
    <div className="inventory-craft-detail">
      <div className={`lore-line rarity-text-${(resultDef?.rarity ?? 'common').toLowerCase()} bold`}>{recipe.name}</div>
      {lore.map((entry, index) => (
        <div
          key={`${index}-${entry.text}`}
          className={`lore-line mc-${entry.color ?? 'white'} ${entry.bold ? 'bold' : ''} ${entry.italic ? 'italic' : ''}`}
        >
          {entry.text || '\u00a0'}
        </div>
      ))}
      <div className="inventory-label">Pattern</div>
      <div className="inventory-craft-pattern">
        {pattern.map((ingredient, index) => {
          if (!ingredient) return <div key={`empty-${index}`} className="mc-slot empty" />;
          const def = ITEMS[ingredient.itemId];
          return (
            <div key={`${ingredient.itemId}-${index}`} className="mc-slot" title={def?.name ?? ingredient.itemId}>
              <ItemIcon icon={def?.sprite ?? ''} itemId={ingredient.itemId} rarity={def?.rarity} />
              {ingredient.qty > 1 ? <span className="stack-count">{ingredient.qty}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
