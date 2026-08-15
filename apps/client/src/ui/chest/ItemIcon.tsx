import { useEffect, useState } from 'react';
import type { ItemId } from '@aether/shared';
import { iconTextureSources } from './itemTextures';
import { PixelIcon } from './PixelIcon';

interface Props {
  icon: string;
  itemId?: ItemId;
  rarity?: string;
}

export function ItemIcon({ icon, itemId, rarity }: Props) {
  const sources = iconTextureSources(icon, itemId);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [icon, itemId]);

  const src = sourceIndex < sources.length ? sources[sourceIndex] : null;
  if (!src) {
    return <PixelIcon icon={icon} itemId={itemId} rarity={rarity} />;
  }

  return (
    <img
      className="item-icon"
      src={src}
      alt=""
      draggable={false}
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}
