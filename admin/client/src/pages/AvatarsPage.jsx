import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  Code,
  FolderPlus,
  Eye,
  Filter,
  Check,
  RefreshCw,
  Layers,
  Search,
  Globe,
  X,
  Wand2,
  Key,
  Loader2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { api } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Sheet from '../components/Sheet';
import Modal from '../components/Modal';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function AvatarsPage() {
  const [characters, setCharacters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Character Sheet (Insert / Edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    gender: 'male',
    svg: '',
    color: '#F97316'
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Verse / Category Modal (Create Anime Category)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#F97316',
    description: ''
  });
  const [categoryModalError, setCategoryModalError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete Character Confirmation Modal
  const [deleteCharId, setDeleteCharId] = useState(null);
  const [deletingChar, setDeletingChar] = useState(false);

  // Delete Category Confirmation Modal
  const [deleteCatId, setDeleteCatId] = useState(null);
  const [deletingCat, setDeletingCat] = useState(false);

  // Manage Categories Modal
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const CANONICAL_VECTOR_PROMPT = `You are a master vector character artist and senior frontend SVG engineer.

I need a 100% authentic, canonical, full-body vector SVG character design for:
- Anime Universe: [ANIME_NAME]
- Character Name: [CHARACTER_NAME]
- Form / Variation: [DEFAULT / CLASSIC ICONIC FORM]

CRITICAL PROPORTION & ANATOMY RULES (DO NOT USE A GENERIC MANNEQUIN):
1. ANATOMY & SILHOUETTE ACCURACY:
   - Do NOT use standard humanoid proportions if the character has unique proportions!
   - Capture the true canonical silhouette and head-to-body ratio of this specific character (e.g., squat 2-head chibi toddler for Shinchan with his signature potato-shaped head and chubby cheeks; round spherical 2-head ratio with no neck and stubby legs for Doraemon; pear-shaped electric rodent body for Pikachu; muscular anime hero 6-head athletic anatomy for Goku; etc.).
   - Include all iconic anatomical quirks: exact eye style, nose shape (or lack thereof), mouth, ears, brows, hairstyle, and body posture.

2. OFFICIAL COLOR PALETTE:
   - Use the exact official hexadecimal color codes for skin, hair, clothes, pupils, highlights, and signature accessories.
   - Use proper flat vector cel-shading (base color, shadow tones, highlight tints) to give high-end modern cinematic depth.

3. CODE FORMAT & VIEWPORT:
   - Output ONLY valid, clean SVG / React JSX vector code wrapped inside a single <g id="[CHARACTER_NAME_LOWERCASE]"> tag.
   - Target ViewBox coordinate space: 0 0 200 280 (Center X = 100, Base ground Y ≈ 255).
   - Use native SVG elements only: <path>, <polygon>, <circle>, <ellipse>, <rect>.
   - Ensure the character stands centered, facing forward, in an iconic idle stance.
   - Do NOT include any background rectangle or wrapper <svg> tag—just the inner <g> group containing the complete layered character (Shadow -> Base Body / Limbs -> Outfit -> Face / Head -> Accessories -> Highlights).

Generate the complete, ready-to-use vector code for [CHARACTER_NAME] now.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CANONICAL_VECTOR_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [cats, chars] = await Promise.all([
        api.getAnimeCategories(),
        api.getCharacters()
      ]);
      setCategories(cats || []);
      setCharacters(chars || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load characters and categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // OPEN INSERT CHARACTER FORM (GENERAL OR FOR A SPECIFIC VERSE)
  // -------------------------------------------------------------
  const openCreateSheet = (targetCategory = null) => {
    setEditingCharacter(null);
    const cat = targetCategory || (categories.length > 0 ? categories[0] : null);
    setFormData({
      name: '',
      categoryId: cat ? cat._id : '',
      gender: 'male',
      svg: '',
      color: cat?.color || '#F97316'
    });
    setFormError('');
    setSheetOpen(true);
  };

  // -------------------------------------------------------------
  // OPEN EDIT CHARACTER FORM
  // -------------------------------------------------------------
  const openEditSheet = (character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      categoryId: character.categoryId ? (character.categoryId._id || character.categoryId) : '',
      gender: character.gender || 'male',
      svg: character.svg || '',
      color: character.color || '#F97316'
    });
    setFormError('');
    setSheetOpen(true);
  };

  // -------------------------------------------------------------
  // HANDLE FILE UPLOAD (ACCEPTS .SVG AND .PNG FILES)
  // -------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isSvg = lowerName.endsWith('.svg') || file.type === 'image/svg+xml';
    const isPng = lowerName.endsWith('.png') || file.type === 'image/png';

    if (!isSvg && !isPng) {
      setFormError('Please select a valid .svg or .png file');
      return;
    }

    if (isPng) {
      // Auto-wrap transparent PNG into a 100% self-contained SVG
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const generatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 280" width="100%" height="100%"><image href="${dataUrl}" xlink:href="${dataUrl}" x="0" y="0" width="200" height="280" preserveAspectRatio="xMidYMid meet" /></svg>`;
        setFormData((prev) => ({ ...prev, svg: generatedSvg }));
        setFormError('');
      };
      reader.readAsDataURL(file);
    } else {
      // Read SVG text
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (typeof content === 'string' && content.includes('<svg')) {
          setFormData((prev) => ({ ...prev, svg: content }));
          setFormError('');
        } else {
          setFormError('Invalid SVG file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // -------------------------------------------------------------
  // SAVE CHARACTER (INSERT / UPDATE)
  // -------------------------------------------------------------
  const handleSaveCharacter = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Character name is required');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select an Anime Universe / Verse. Create one first if none exist.');
      return;
    }
    if (!formData.svg.trim() || !formData.svg.includes('<svg')) {
      setFormError('Valid SVG code is required. Paste SVG code or upload an .svg / .png file.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (editingCharacter) {
        await api.updateCharacter(editingCharacter._id, formData);
      } else {
        await api.createCharacter(formData);
      }

      await fetchData();
      setSheetOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // TOGGLE ACTIVE STATUS
  // -------------------------------------------------------------
  const handleToggleActive = async (character) => {
    try {
      await api.toggleCharacter(character._id);
      setCharacters((prev) =>
        prev.map((c) => (c._id === character._id ? { ...c, active: !c.active } : c))
      );
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  // -------------------------------------------------------------
  // DELETE CHARACTER
  // -------------------------------------------------------------
  const handleDeleteCharacter = async () => {
    if (!deleteCharId) return;
    try {
      setDeletingChar(true);
      await api.deleteCharacter(deleteCharId);
      setCharacters((prev) => prev.filter((c) => c._id !== deleteCharId));
      setDeleteCharId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete character');
    } finally {
      setDeletingChar(false);
    }
  };

  // -------------------------------------------------------------
  // CREATE ANIME VERSE / CATEGORY
  // -------------------------------------------------------------
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      setCategoryModalError('Verse name is required');
      return;
    }

    try {
      setSavingCategory(true);
      setCategoryModalError('');
      const newCat = await api.createAnimeCategory(categoryFormData);
      await fetchData();
      // Auto-select this newly created category in the character form if open
      setFormData((prev) => ({
        ...prev,
        categoryId: newCat._id,
        color: newCat.color || prev.color
      }));
      setCategoryModalOpen(false);
      setCategoryFormData({ name: '', color: '#F97316', description: '' });
    } catch (err) {
      setCategoryModalError(err.message || 'Failed to create anime verse');
    } finally {
      setSavingCategory(false);
    }
  };

  // -------------------------------------------------------------
  // DELETE ANIME VERSE / CATEGORY
  // -------------------------------------------------------------
  const handleDeleteCategory = async (catId) => {
    try {
      setDeletingCat(true);
      await api.deleteAnimeCategory(catId);
      if (filterCategory === catId) {
        setFilterCategory('all');
      }
      await fetchData();
      setDeleteCatId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete verse');
    } finally {
      setDeletingCat(false);
    }
  };

  // -------------------------------------------------------------
  // SEED DEFAULT CHARACTERS
  // -------------------------------------------------------------
  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await api.seedCharacters();
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to seed characters');
      setLoading(false);
    }
  };

  // Filtered Characters
  const filteredCharacters = characters.filter((c) => {
    const matchesCat =
      filterCategory === 'all' ||
      c.animeId === filterCategory ||
      (c.categoryId && (c.categoryId._id === filterCategory || c.categoryId.slug === filterCategory));

    const matchesGender = filterGender === 'all' || c.gender === filterGender;

    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.characterId?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesGender && matchesSearch;
  });

  // Active Category Object (if a specific verse is selected)
  const activeCategoryObj = categories.find(
    (cat) => cat.slug === filterCategory || cat._id === filterCategory
  );

  return (
    <div className="space-y-7">
      {/* =========================================================
          1. TOP HEADER & STUDIO ACTIONS
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-large-title font-bold text-label flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-accent" />
            <span>Anime Verses & Characters</span>
          </h1>
          <p className="text-subheadline text-label-2 mt-1">
            Design and organize anime universes, avatars, and character designs stored in MongoDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* + Add Verse Button */}
          <Button
            variant="secondary"
            onClick={() => {
              setCategoryFormData({ name: '', color: '#F97316', description: '' });
              setCategoryModalError('');
              setCategoryModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <FolderPlus size={16} className="text-accent" />
            <span>+ Add Verse</span>
          </Button>

          {/* + Add Character Button */}
          <Button
            variant="primary"
            onClick={() => openCreateSheet()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>+ Add Character</span>
          </Button>
        </div>
      </div>

      {/* =========================================================
          PROMPT CARD: MASTER VECTOR CHARACTER ARTIST PROMPT
      ========================================================= */}
      <div className="content-card p-5 border border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-black to-[#121214] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Master Vector Character Artist Prompt</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  Stitch / External LLM
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Copy this prompt and paste it into Stitch, Claude, ChatGPT, or Gemini to generate authentic canonical 200x280 vector character graphics. Then upload the .svg or .png file below!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-purple-600/30 shrink-0"
          >
            {copiedPrompt ? (
              <>
                <Check size={14} className="stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-black/60 rounded-xl p-3 border border-white/10 font-mono text-[11px] text-neutral-300 max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
          {CANONICAL_VECTOR_PROMPT}
        </div>
      </div>

      {/* =========================================================
          2. THE "VERSES" EXPLORER HUB
          Displays all anime universes with character counts & 
          a direct "+" button on each card to add a character to that verse!
      ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-accent" />
            <h2 className="text-footnote font-extrabold tracking-wider text-label-2 uppercase">
              Anime Verses ({categories.length})
            </h2>
          </div>

          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setManageCategoriesOpen(true)}
              className="text-footnote text-accent hover:underline font-semibold cursor-pointer"
            >
              Manage Verses
            </button>
          )}
        </div>

        {/* Verses Cards Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* "All Verses" Master Card */}
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between group backdrop-blur-md border ${
              filterCategory === 'all'
                ? 'bg-accent/15 border-accent shadow-lg shadow-accent/10 ring-1 ring-accent'
                : 'glass-panel hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-label">
                <Globe size={15} />
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-label-2">
                {characters.length} total
              </span>
            </div>

            <div>
              <h3 className="text-subheadline font-bold text-label truncate">All Verses</h3>
              <p className="text-[11px] text-label-3 mt-0.5 truncate">
                Full Character Catalog
              </p>
            </div>
          </button>

          {/* Individual Anime Verse Cards */}
          {categories.map((cat) => {
            const count = characters.filter(
              (c) => c.animeId === cat.slug || c.categoryId?._id === cat._id
            ).length;
            const isSelected = filterCategory === cat.slug || filterCategory === cat._id;
            const verseColor = cat.color || '#F97316';

            return (
              <div
                key={cat._id}
                onClick={() => setFilterCategory(cat.slug || cat._id)}
                className={`p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between group backdrop-blur-md border ${
                  isSelected
                    ? 'border-2 shadow-lg ring-1'
                    : 'glass-panel hover:border-white/20 hover:bg-white/[0.04]'
                }`}
                style={{
                  borderColor: isSelected ? verseColor : undefined,
                  boxShadow: isSelected ? `0 10px 25px -5px ${verseColor}25` : undefined
                }}
              >
                {/* Verse Top Accent Indicator */}
                <div
                  className="absolute top-0 left-4 right-4 h-[2.5px] rounded-b-full opacity-80"
                  style={{ backgroundColor: verseColor }}
                />

                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20"
                    style={{ backgroundColor: verseColor }}
                  />

                  {/* Character Count Badge */}
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${verseColor}20`,
                      color: verseColor
                    }}
                  >
                    {count} {count === 1 ? 'char' : 'chars'}
                  </span>
                </div>

                <div className="mt-1">
                  <h3 className="text-subheadline font-bold text-label truncate" title={cat.name}>
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-label-3 font-mono mt-0.5 truncate">
                    /{cat.slug || 'verse'}
                  </p>
                </div>

                {/* Direct Action Bar on Verse Card */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-separator/30">
                  <span className="text-[10px] text-label-3 font-medium uppercase tracking-wider">
                    {isSelected ? 'Viewing' : 'Filter'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* ✨ AI Generator Shortcut for this Verse */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAiStudio(cat);
                      }}
                      className="w-6 h-6 rounded-lg bg-purple-500/15 hover:bg-purple-600 hover:text-white text-purple-400 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                      title={`Generate AI character for ${cat.name}`}
                    >
                      <Sparkles size={12} />
                    </button>

                    {/* "+" ICON: 1-Click Shortcut to Add Character directly to this Verse! */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateSheet(cat);
                      }}
                      className="w-6 h-6 rounded-lg bg-surface-2 hover:bg-accent hover:text-white text-label-2 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                      title={`Add character directly to ${cat.name}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          3. CHARACTER ROSTER TOOLBAR
          Search & Filters (Gender, Active Universe indicator)
      ========================================================= */}
      <div className="glass-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Verse Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-2 rounded-xl text-subheadline text-label font-medium border border-separator/40">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: activeCategoryObj?.color || '#F97316'
              }}
            />
            <span className="font-bold">
              {activeCategoryObj ? activeCategoryObj.name : 'All Verses'}
            </span>
            <span className="text-footnote text-label-3">
              ({filteredCharacters.length} visible)
            </span>
          </div>

          {/* Search Character Name / ID */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-3" />
            <input
              type="text"
              placeholder="Search character name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-7 bg-surface-2 text-label rounded-xl border border-separator/50 text-footnote font-medium focus:outline-none focus:ring-2 focus:ring-accent w-56 sm:w-64"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-3 hover:text-label"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Gender Filter Segmented Control */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-footnote text-label-3 font-semibold mr-1">
            <Filter size={13} className="text-accent" />
            <span>Gender:</span>
          </div>
          <div className="flex items-center bg-surface-2 p-0.5 rounded-xl border border-separator/40">
            {['all', 'male', 'female'].map((g) => {
              const genderCount = characters.filter((c) => {
                const matchesCat =
                  filterCategory === 'all' ||
                  c.animeId === filterCategory ||
                  (c.categoryId && (c.categoryId._id === filterCategory || c.categoryId.slug === filterCategory));
                return matchesCat && (g === 'all' || c.gender === g);
              }).length;

              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGender(g)}
                  className={`px-3 py-1 rounded-lg text-footnote font-semibold capitalize transition-all cursor-pointer ${
                    filterGender === g
                      ? g === 'male'
                        ? 'bg-blue-600/35 text-blue-300 border border-blue-400/50 shadow-sm shadow-blue-500/20'
                        : g === 'female'
                        ? 'bg-pink-600/35 text-pink-300 border border-pink-400/50 shadow-sm shadow-pink-500/20'
                        : 'bg-accent text-label shadow-sm'
                      : g === 'male'
                      ? 'text-blue-300/60 hover:text-blue-300 hover:bg-blue-500/10'
                      : g === 'female'
                      ? 'text-pink-300/60 hover:text-pink-300 hover:bg-pink-500/10'
                      : 'text-label-2 hover:text-label hover:bg-white/5'
                  }`}
                >
                  {g} ({genderCount})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          4. MAIN CONTENT AREA: CHARACTER CARDS GRID
      ========================================================= */}
      {loading ? (
        <LoadingState message="Loading anime characters from MongoDB..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : characters.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Characters Found"
          description="Create your first anime verse and upload SVG characters to MongoDB."
          action={
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Button onClick={() => setCategoryModalOpen(true)} variant="secondary">
                <FolderPlus size={16} className="mr-1.5" /> + Add Verse
              </Button>
              <Button onClick={handleSeedDefaults} variant="primary">
                <RefreshCw size={16} className="mr-1.5" /> Seed Naruto Presets
              </Button>
            </div>
          }
        />
      ) : filteredCharacters.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-subheadline text-label-2">No characters match your current filters or search query.</p>
          <Button
            variant="ghost"
            onClick={() => {
              setFilterCategory('all');
              setFilterGender('all');
              setSearchQuery('');
            }}
            className="mt-3"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Character Cards Grid: Perfectly framed with ZERO clipping */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCharacters.map((char) => {
            const animeColor = char.categoryId?.color || char.color || '#F97316';
            return (
              <div
                key={char._id}
                className="glass-panel rounded-2xl p-4 flex flex-col justify-between group hover:border-white/20 transition-all shadow-md relative overflow-hidden"
              >
                {/* Status Indicator & Gender Pill */}
                <div className="flex items-center justify-between mb-3 z-10">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                    style={{
                      backgroundColor: `${animeColor}20`,
                      color: animeColor,
                      border: `1px solid ${animeColor}40`
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: animeColor }} />
                    <span className="truncate max-w-[110px]">{char.animeName}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      char.gender === 'female'
                        ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {char.gender}
                  </span>
                </div>

                {/* SVG Visual Stage: Generous framing so Sakura, Obito, Naruto etc are 100% visible */}
                <div className="w-full h-52 bg-gradient-to-b from-black/50 via-surface-2/20 to-black/70 rounded-xl p-3 flex items-center justify-center relative overflow-hidden mb-3 border border-white/5">
                  {/* Thematic Pedestal Glow */}
                  <div
                    className="absolute bottom-2 w-32 h-6 rounded-[100%] blur-md pointer-events-none opacity-50"
                    style={{ backgroundColor: animeColor }}
                  />

                  {/* Rendered SVG Character with object-contain */}
                  <div
                    className="w-full h-full flex items-center justify-center select-none pointer-events-none [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-full [&>svg]:object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                    dangerouslySetInnerHTML={{ __html: char.svg }}
                  />
                </div>

                {/* Character Name & Details */}
                <div className="mb-3 text-center">
                  <h3 className="text-headline font-bold text-label truncate" title={char.name}>
                    {char.name}
                  </h3>
                  <p className="text-footnote text-label-3 font-mono mt-0.5 truncate">
                    ID: {char.characterId}
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-separator/40">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(char)}
                    className="flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                    title={char.active ? 'Active in Student App' : 'Hidden from Student App'}
                  >
                    {char.active ? (
                      <span className="text-green flex items-center gap-1">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <span className="text-label-3 flex items-center gap-1">
                        <XCircle size={13} /> Hidden
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditSheet(char)}
                      className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 text-label-2 hover:text-label flex items-center justify-center transition-all cursor-pointer"
                      title="Edit Character"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCharId(char._id)}
                      className="w-8 h-8 rounded-lg bg-red/10 hover:bg-red/20 text-red flex items-center justify-center transition-all cursor-pointer"
                      title="Delete Character"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          5. CHARACTER INSERT / EDIT SHEET
      ========================================================= */}
      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingCharacter ? 'Edit Anime Character' : 'Add Character to Verse'}
        description="Insert an SVG or PNG design, character name, anime universe, and gender to save to MongoDB."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveCharacter}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold px-6"
            >
              {saving ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCharacter} className="space-y-5">
          {formError && (
            <div className="p-3 bg-red/15 border border-red/30 rounded-xl text-red text-subheadline">
              {formError}
            </div>
          )}

          {/* 1. Character Name */}
          <Input
            label="Character Name"
            placeholder="e.g. Naruto Uzumaki, Sakura Haruno, Obito"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          {/* 2. Anime Category (Universe Selector) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-subheadline text-label-2 font-medium">
                Anime Verse (Universe Selector)
              </label>
              <button
                type="button"
                onClick={() => {
                  setCategoryModalError('');
                  setCategoryModalOpen(true);
                }}
                className="text-footnote text-accent hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus size={13} /> + New Verse
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="p-3 bg-surface-2 rounded-xl border border-separator/50 text-footnote text-label-2 flex items-center justify-between">
                <span>No anime verses yet. Create one first!</span>
                <Button
                  size="sm"
                  variant="primary"
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                >
                  Create Verse
                </Button>
              </div>
            ) : (
              <Select
                value={formData.categoryId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const cat = categories.find((c) => c._id === selectedId);
                  setFormData({
                    ...formData,
                    categoryId: selectedId,
                    color: cat?.color || formData.color
                  });
                }}
                options={categories.map((cat) => ({
                  label: cat.name,
                  value: cat._id
                }))}
                required
              />
            )}
          </div>

          {/* 3. Gender Selector */}
          <div className="space-y-1.5">
            <label className="text-subheadline text-label-2 font-medium">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' }
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g.value })}
                  className={`py-2 rounded-xl text-subheadline font-semibold transition-all cursor-pointer border ${
                    formData.gender === g.value
                      ? 'bg-accent text-label border-accent shadow-sm'
                      : 'bg-surface-2 text-label-2 border-separator/40 hover:bg-surface-3'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Upload Graphic (.svg / .png only) & Live Preview */}
          <div className="space-y-2 pt-2 border-t border-separator/40">
            <div className="flex items-center justify-between">
              <label className="text-subheadline text-label-2 font-medium flex items-center gap-1.5">
                <Code size={15} className="text-accent" />
                <span>Upload Vector / Graphic (.svg or .png only)</span>
              </label>

              {/* Upload File Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".svg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-accent text-white"
                >
                  <Upload size={13} />
                  <span>Choose .svg or .png</span>
                </Button>
              </div>
            </div>

            {/* SVG Input Textarea (Can also paste raw SVG) */}
            <textarea
              value={formData.svg}
              onChange={(e) => setFormData({ ...formData, svg: e.target.value })}
              placeholder='Upload a .svg/.png file or paste SVG code here: <svg viewBox="0 0 200 280">...</svg>'
              rows={4}
              className="w-full bg-surface-2 text-label font-mono text-xs rounded-xl border border-separator/50 p-3 focus:outline-none focus:ring-2 focus:ring-accent resize-y"
              required
            />

            {/* Live Real-Time Graphic Preview Box */}
            <div className="mt-3 p-3 bg-surface-2/60 rounded-xl border border-separator/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-footnote text-label-2 font-semibold flex items-center gap-1">
                  <Eye size={13} /> Graphic Preview
                </span>
                <span className="text-[11px] text-label-3">
                  {formData.svg.includes('<svg') || formData.svg.includes('<image')
                    ? 'Uploaded graphic loaded'
                    : 'Awaiting .svg or .png upload'}
                </span>
              </div>

              <div className="w-full h-56 bg-black/80 rounded-xl flex items-center justify-center relative overflow-hidden border border-white/10 shadow-inner">
                {/* Automatic Thematic Pedestal Glow derived from Verse/Character */}
                <div
                  className="absolute bottom-2 w-36 h-7 rounded-[100%] blur-md pointer-events-none opacity-60"
                  style={{ backgroundColor: formData.color || '#5E5CE6' }}
                />
                {formData.svg.includes('<svg') || formData.svg.includes('<image') ? (
                  <div
                    className="w-full h-full flex items-center justify-center select-none [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-full [&>svg]:object-contain mx-auto p-2"
                    dangerouslySetInnerHTML={{ __html: formData.svg }}
                  />
                ) : (
                  <div className="text-label-3 text-footnote text-center px-4 flex flex-col items-center gap-2">
                    <Upload size={24} className="text-label-3 opacity-40" />
                    <span>Upload a .svg or .png character to preview instantly on the pedestal</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </Sheet>

      {/* =========================================================
          6. CREATE ANIME VERSE / CATEGORY MODAL
      ========================================================= */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Create Anime Universe / Verse"
        description="Add a new anime universe to organize character rosters and wardrobe catalogs."
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {categoryModalError && (
            <div className="p-3 bg-red/15 border border-red/30 rounded-xl text-red text-subheadline">
              {categoryModalError}
            </div>
          )}

          <Input
            label="Verse Name"
            placeholder="e.g. Naruto Shippuden, Dragon Ball Z, One Piece"
            value={categoryFormData.name}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="text-subheadline text-label-2 font-medium flex items-center justify-between">
              <span>Theme / Brand Color</span>
              <span className="font-mono text-footnote text-label-3">{categoryFormData.color}</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={categoryFormData.color}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer p-0"
              />
              <div className="flex flex-wrap gap-1.5">
                {['#F97316', '#3B82F6', '#EC4899', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: c })}
                      className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <Input
            label="Description (Optional)"
            placeholder="e.g. Hidden Leaf Village shinobi universe..."
            value={categoryFormData.description}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-separator/40">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCategoryModalOpen(false)}
              disabled={savingCategory}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingCategory || !categoryFormData.name.trim()}
            >
              {savingCategory ? 'Creating...' : 'Create Verse'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          7. MANAGE ANIME VERSES MODAL
      ========================================================= */}
      <Modal
        isOpen={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        title="Manage Anime Verses"
        description="All anime universes stored in MongoDB."
      >
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const charCount = characters.filter((c) => c.animeId === cat.slug || c.categoryId?._id === cat._id).length;
            return (
              <div
                key={cat._id}
                className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-separator/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: cat.color || '#F97316' }}
                  />
                  <div>
                    <h4 className="text-subheadline font-bold text-label">{cat.name}</h4>
                    <p className="text-[11px] text-label-3 font-mono">
                      Slug: {cat.slug} • {charCount} characters
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (charCount > 0) {
                        alert(`Cannot delete ${cat.name}: it currently has ${charCount} character(s). Delete or reassign them first.`);
                        return;
                      }
                      if (window.confirm(`Delete anime universe "${cat.name}"?`)) {
                        handleDeleteCategory(cat._id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-red hover:bg-red/10 transition-colors cursor-pointer"
                    title="Delete Verse"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-separator/40 mt-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setManageCategoriesOpen(false);
              setCategoryModalOpen(true);
            }}
          >
            <FolderPlus size={14} className="mr-1.5" /> + New Verse
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setManageCategoriesOpen(false)}
          >
            Done
          </Button>
        </div>
      </Modal>

      {/* =========================================================
          8. DELETE CHARACTER CONFIRMATION MODAL
      ========================================================= */}
      <Modal
        isOpen={Boolean(deleteCharId)}
        onClose={() => setDeleteCharId(null)}
        title="Delete Character"
        description="Are you sure you want to permanently delete this character from MongoDB? Students will no longer be able to select this character."
      >
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteCharId(null)}
            disabled={deletingChar}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteCharacter}
            disabled={deletingChar}
          >
            {deletingChar ? 'Deleting...' : 'Delete Character'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
