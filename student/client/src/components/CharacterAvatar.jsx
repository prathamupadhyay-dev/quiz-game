import React from 'react';
import { motion } from 'framer-motion';

/**
 * ZYNC Dynamic Anime Character Avatar Engine
 * Renders characters dynamically retrieved from MongoDB via SVG or Stitch assets.
 */
export default function CharacterAvatar({
  config = {},
  mode = 'fullBody', // 'fullBody' | 'bust'
  size = 180,
  animate = 'idle', // 'idle' | 'celebrate' | 'none'
  className = '',
  characterRegistry = {}
}) {
  const { presetOutfit = 'naruto' } = config || {};

  // Framer Motion animation variants
  const motionVariants = {
    idle: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    celebrate: {
      y: [0, -16, 0],
      rotate: [-2, 2, -2],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    none: {
      y: 0,
      rotate: 0
    }
  };

  const isBust = mode === 'bust';
  const char = characterRegistry[presetOutfit] || characterRegistry[Object.keys(characterRegistry)[0]];

  // 1. RENDER SVG DYNAMICALLY FROM MONGODB IF AVAILABLE
  if (char && char.svg) {
    if (isBust) {
      return (
        <motion.div
          variants={motionVariants}
          animate={animate}
          className={`inline-flex items-center justify-center select-none overflow-hidden rounded-full bg-gradient-to-b ${char.themeGradient || 'from-orange-400/20 to-amber-600/30'} border ${char.borderColor || 'border-orange-500/30'} shadow-md ${className}`}
          style={{ width: size, height: size }}
        >
          <div
            className="w-[170%] h-[170%] max-w-none flex items-center justify-center select-none pointer-events-none drop-shadow [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: char.svg }}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={motionVariants}
        animate={animate}
        className={`inline-flex items-center justify-center select-none relative ${className}`}
        style={{ width: size, height: size * 1.35 }}
      >
        <div
          className="w-full h-full flex items-center justify-center filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] select-none pointer-events-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
          dangerouslySetInnerHTML={{ __html: char.svg }}
        />
      </motion.div>
    );
  }

  // 2. FALLBACK TO IMAGE IF AVAILABLE
  const imageSrc = char?.image || `/avatars/${presetOutfit}.png`;

  if (isBust) {
    return (
      <motion.div
        variants={motionVariants}
        animate={animate}
        className={`inline-flex items-center justify-center select-none overflow-hidden rounded-full bg-gradient-to-b from-orange-400/20 to-amber-600/30 border border-orange-500/30 shadow-md ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={imageSrc}
          alt={char?.name || presetOutfit}
          className="w-[170%] h-[170%] max-w-none object-contain select-none pointer-events-none drop-shadow"
          style={{ objectPosition: 'center 14%' }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={motionVariants}
      animate={animate}
      className={`inline-flex items-center justify-center select-none relative ${className}`}
      style={{ width: size, height: size * 1.35 }}
    >
      <img
        src={imageSrc}
        alt={char?.name || presetOutfit}
        className="w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)] select-none pointer-events-none"
      />
    </motion.div>
  );
}
