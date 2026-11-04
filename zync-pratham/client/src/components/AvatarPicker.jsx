import React from 'react';

const AVATAR_STYLES = [
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'bottts', label: 'Robots' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'pixel-art', label: 'Pixel' },
  { id: 'avataaars', label: 'Avatars' }
];

export default function AvatarPicker({ style, seed, onStyleChange, onSeedChange }) {
  const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    onSeedChange(randomSeed);
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
      <div className="relative group">
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-indigo-500/80 shadow-xl shadow-indigo-500/20 bg-slate-800 flex items-center justify-center transition-transform hover:scale-105">
          <img
            src={avatarUrl}
            alt="Custom Avatar Preview"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition active:scale-95"
          title="Randomize Look"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Style selector chips */}
      <div className="w-full">
        <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider block mb-2 text-center">
          Avatar Style
        </label>
        <div className="flex flex-wrap justify-center gap-1.5">
          {AVATAR_STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onStyleChange(item.id)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                style === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleRandomize}
        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-2"
      >
        <span>🎲 Randomize Look</span>
      </button>
    </div>
  );
}
