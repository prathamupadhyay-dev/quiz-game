import React from 'react';

/**
 * ZYNC Character Avatar Component (Teacher Portal)
 * Renders full-body or bust dynamic SVG/PNG character avatars from MongoDB.
 */
export default function CharacterAvatar({
  config = {},
  mode = 'fullBody', // 'fullBody' | 'bust'
  size = 180,
  className = '',
  characterRegistry = {}
}) {
  const { presetOutfit = 'naruto' } = config || {};
  const isBust = mode === 'bust';
  const char = characterRegistry[presetOutfit] || characterRegistry[Object.keys(characterRegistry)[0]];

  if (char && char.svg) {
    if (isBust) {
      return (
        <div
          className={`inline-flex items-center justify-center select-none overflow-hidden rounded-full bg-gradient-to-b ${char.themeGradient || 'from-orange-400/20 to-amber-600/30'} border ${char.borderColor || 'border-orange-500/30'} shadow-md ${className}`}
          style={{ width: size, height: size }}
        >
          <div
            className="w-[170%] h-[170%] max-w-none flex items-center justify-center select-none pointer-events-none drop-shadow [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: char.svg }}
          />
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center justify-center select-none relative ${className}`}
        style={{ width: size, height: size * 1.35 }}
      >
        <div
          className="w-full h-full flex items-center justify-center filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] select-none pointer-events-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: char.svg }}
        />
      </div>
    );
  }

  // Fallback to image
  const imageSrc = char?.image || `/avatars/${presetOutfit}.png`;

  if (isBust) {
    return (
      <div
        className={`inline-flex items-center justify-center select-none overflow-hidden rounded-full bg-gradient-to-b from-orange-400/20 to-amber-600/30 border border-orange-500/30 shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={imageSrc}
          alt={char?.name || presetOutfit}
          className="w-[170%] h-[170%] max-w-none object-contain select-none pointer-events-none drop-shadow"
          style={{ objectPosition: 'center 14%' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center select-none relative ${className}`}
      style={{ width: size, height: size * 1.35 }}
    >
      <img
        src={imageSrc}
        alt={char?.name || presetOutfit}
        className="w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] select-none pointer-events-none"
      />
    </div>
  );
}
