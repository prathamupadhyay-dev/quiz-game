import React, { useState, useRef, useEffect } from 'react';
import { Check, Flame, Filter, ChevronDown, ChevronRight } from 'lucide-react';

/* -------------------------------------------------------------
   DYNAMIC MINIMALIST CHARACTER GALLERY (CONNECTED TO MONGODB)
------------------------------------------------------------- */
export default function WardrobeDrawer({
  config = {},
  onChange,
  categories = [],
  characters = []
}) {
  // Filter States: both selected 'all' by default
  const [selectedAnime, setSelectedAnime] = useState('all'); // 'all' | category slug
  const [selectedGender, setSelectedGender] = useState('all'); // 'all' | 'male' | 'female'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAnimeSubmenuOpen, setIsAnimeSubmenuOpen] = useState(false);

  const filterRef = useRef(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
        setIsAnimeSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-dimensional filter
  const filteredChars = characters.filter(char => {
    const matchesAnime =
      selectedAnime === 'all' ||
      char.animeId === selectedAnime ||
      (char.categoryId && (char.categoryId === selectedAnime || char.categoryId._id === selectedAnime));
    const matchesGender = selectedGender === 'all' || char.gender === selectedGender;
    return matchesAnime && matchesGender;
  });

  const handleSelectCharacter = charId => {
    onChange({
      ...config,
      presetOutfit: charId
    });
  };

  const activeAnimeObj = categories.find(c => c.slug === selectedAnime || c._id === selectedAnime);

  return (
    <div className="w-full flex flex-col gap-3 min-w-0 select-none">
      
      {/* Top Filter Bar (NO "Catalog" label, NO anime name in header) */}
      <div className="flex items-center justify-between px-1 pb-1 relative">
        <span className="text-xs text-white/40 font-mono">
          {filteredChars.length} characters
        </span>

        {/* Interactive Multi-Option Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => {
              setIsFilterOpen(prev => !prev);
              setIsAnimeSubmenuOpen(false);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer backdrop-blur-xl ${
              selectedAnime !== 'all' || selectedGender !== 'all'
                ? 'bg-white/15 border-white/30 text-white shadow-lg'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white/80'
            }`}
          >
            <Filter size={12} className="text-cyan-400" />
            <span>Filter</span>
            {(selectedAnime !== 'all' || selectedGender !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 text-white/40 ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Filter Dropdown Menu */}
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#161618] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-2 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-100">
              
              {/* 1. First Option: Anime Series (Opens flyout submenu on the right) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAnimeSubmenuOpen(prev => !prev)}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between hover:bg-white/10 text-white group"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 font-medium">Anime Series</span>
                    <span className="text-white font-extrabold truncate max-w-[110px]">
                      {selectedAnime === 'all' ? 'All Anime' : activeAnimeObj?.name || selectedAnime}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-white/40 group-hover:text-white transition-colors" />
                </button>

                {/* Right Flyout Submenu with List of All Anime Categories from MongoDB */}
                {isAnimeSubmenuOpen && (
                  <div className="absolute left-full top-0 ml-2 w-48 bg-[#18181B] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnime('all');
                        setIsAnimeSubmenuOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedAnime === 'all' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>All Anime</span>
                      {selectedAnime === 'all' && <Check size={12} className="text-white" />}
                    </button>

                    {categories.map(cat => {
                      const isCatActive = selectedAnime === cat.slug || selectedAnime === cat._id;
                      return (
                        <button
                          key={cat._id || cat.slug}
                          type="button"
                          onClick={() => {
                            setSelectedAnime(cat.slug || cat._id);
                            setIsAnimeSubmenuOpen(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                            isCatActive ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color || '#F97316' }} />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          {isCatActive && <Check size={12} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Second Option: Gender Filter (Default: All) */}
              <div className="pt-1.5 border-t border-white/5 flex flex-col gap-1.5">
                <span className="text-[10px] text-white/40 font-medium px-2">Gender</span>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/40 rounded-xl border border-white/5">
                  {['all', 'male', 'female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGender(g)}
                      className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer text-center ${
                        selectedGender === g
                          ? g === 'male'
                            ? 'bg-blue-600/35 text-blue-300 border border-blue-400/50 shadow-md shadow-blue-500/25 ring-1 ring-blue-500/30'
                            : g === 'female'
                            ? 'bg-pink-600/35 text-pink-300 border border-pink-400/50 shadow-md shadow-pink-500/25 ring-1 ring-pink-500/30'
                            : 'bg-white/20 text-white shadow'
                          : g === 'male'
                          ? 'text-blue-300/60 hover:text-blue-300 hover:bg-blue-500/10'
                          : g === 'female'
                          ? 'text-pink-300/60 hover:text-pink-300 hover:bg-pink-500/10'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {g === 'all' ? 'All' : g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Filters Shortcut */}
              {(selectedAnime !== 'all' || selectedGender !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnime('all');
                    setSelectedGender('all');
                    setIsAnimeSubmenuOpen(false);
                  }}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold text-center py-1 cursor-pointer transition-colors border-t border-white/5 pt-1.5"
                >
                  Reset Filters
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Spacious Floating Character Cards Grid (Zero Ugly Scrollbar!) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 overflow-y-auto max-h-[360px] p-1 pr-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredChars.map(char => {
          const charKey = char.characterId || char.id;
          const isEquipped = (config.presetOutfit || 'naruto') === charKey;
          return (
            <button
              key={charKey}
              type="button"
              onClick={() => handleSelectCharacter(charKey)}
              className={`p-3.5 rounded-2xl text-left flex flex-col items-center gap-3 transition-all cursor-pointer relative group backdrop-blur-xl ${
                isEquipped
                  ? 'bg-white/[0.12] border-2 border-emerald-400 shadow-xl shadow-emerald-500/10 scale-[1.02]'
                  : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Character SVG Thumbnail */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-black/40 p-1 flex items-center justify-center overflow-hidden">
                {char.svg ? (
                  <div
                    className="w-full h-full flex items-center justify-center select-none pointer-events-none filter drop-shadow group-hover:scale-105 transition-transform [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                    dangerouslySetInnerHTML={{ __html: char.svg }}
                  />
                ) : (
                  <img
                    src={char.image || `/avatars/${charKey}.png`}
                    alt={char.name}
                    className="w-full h-full object-contain filter drop-shadow select-none group-hover:scale-105 transition-transform"
                  />
                )}
              </div>

              {/* Character Name Only */}
              <div className="w-full text-center truncate">
                <span className="text-xs sm:text-sm font-bold text-white truncate block">
                  {char.name}
                </span>
              </div>

              {/* Equipped Checkmark Badge */}
              {isEquipped && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#30D158] flex items-center justify-center shadow">
                  <Check size={10} className="text-black stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
