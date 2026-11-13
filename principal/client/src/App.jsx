import React, { useState, useEffect } from 'react';
import CharacterAvatar from './components/CharacterAvatar';
import StarBorder from './components/reactbits/StarBorder';
import ShinyText from './components/reactbits/ShinyText';
import Hyperspeed from './components/reactbits/Hyperspeed';
import PortalSwitcher from './components/PortalSwitcher';
import {
  Palette,
  Sparkles,
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  LogOut,
  Clock,
  Timer,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  UploadCloud,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';

const hyperspeedConfig = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidth: 0,
  brokenLinesWidth: 0.1,
  brokenLinesLength: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0x38bdf8, 0x0284c7, 0x0369a1],
    rightCars: [0x818cf8, 0x6366f1, 0x4f46e5],
    sticks: 0x38bdf8
  }
};

const MASTER_VECTOR_PROMPT = `You are a master vector character artist and senior frontend SVG engineer.

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

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('zync_token') || localStorage.getItem('zync_creator_token') || localStorage.getItem('zync_principal_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('zync_user') || localStorage.getItem('zync_creator_user') || localStorage.getItem('zync_principal_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [portalNotice, setPortalNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  // Active Tab: 'quizzes' | 'avatars'
  const [activeTab, setActiveTab] = useState('quizzes');

  // Creator Quizzes & Guardrails
  const [quizzes, setQuizzes] = useState([]);
  const [guardrails, setGuardrails] = useState({
    maxQuestionDuration: 120,
    maxQuestionsCount: 50,
    maxPlayersPerGame: 100
  });

  // Creator Characters
  const [characters, setCharacters] = useState([]);
  const [animeCategories, setAnimeCategories] = useState([]);

  // Create Quiz Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCategory, setQuizCategory] = useState('');
  const [quizLobbyCountdown, setQuizLobbyCountdown] = useState(5);
  const [questions, setQuestions] = useState([
    {
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      timeLimit: 30
    }
  ]);

  // Create Character Sheet State
  const [showCharModal, setShowCharModal] = useState(false);
  const [charName, setCharName] = useState('');
  const [charAnimeName, setCharAnimeName] = useState('');
  const [charGender, setCharGender] = useState('male');
  const [charSvgCode, setCharSvgCode] = useState('');
  const [charImagePreview, setCharImagePreview] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savingChar, setSavingChar] = useState(false);

  // Load guardrails, quizzes, characters
  useEffect(() => {
    if (!token) return;

    fetch('/api/creator/guardrails', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setGuardrails(data))
      .catch(() => {});

    loadQuizzes();
    loadCharacters();
  }, [token]);

  const loadQuizzes = () => {
    fetch('/api/creator/quizzes', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setQuizzes(data);
      })
      .catch(() => {});
  };

  const loadCharacters = () => {
    fetch('/api/creator/characters', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCharacters(data);
      })
      .catch(() => {});

    fetch('/api/creator/anime-categories', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAnimeCategories(data);
      })
      .catch(() => {});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setPortalNotice(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.portalUrl) {
          setPortalNotice(data);
          return;
        }
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('zync_creator_token', data.token);
      localStorage.setItem('zync_creator_user', JSON.stringify(data.user));
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zync_creator_token');
    localStorage.removeItem('zync_creator_user');
    localStorage.removeItem('zync_principal_token');
    localStorage.removeItem('zync_principal_user');
    setToken(null);
    setUser(null);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(MASTER_VECTOR_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Graphic Upload handler (restricted to .svg and .png only)
  const handleGraphicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    const isPng = file.type === 'image/png' || file.name.endsWith('.png');

    if (!isSvg && !isPng) {
      alert('Only .svg and .png graphics are supported!');
      return;
    }

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        setCharSvgCode(text);
        setCharImagePreview(null);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        setCharImagePreview(dataUrl);
        setCharSvgCode(dataUrl); // store base64 as graphic payload
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Character
  const handleSaveCharacter = async (e) => {
    e.preventDefault();
    if (!charName.trim() || !charSvgCode) {
      alert('Character name and graphic upload are required');
      return;
    }

    setSavingChar(true);
    try {
      const res = await fetch('/api/creator/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: charName.trim(),
          animeName: charAnimeName.trim() || 'Anime Universe',
          gender: charGender,
          svg: charSvgCode
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save character');
      }

      setShowCharModal(false);
      setCharName('');
      setCharAnimeName('');
      setCharSvgCode('');
      setCharImagePreview(null);
      loadCharacters();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingChar(false);
    }
  };

  const handleDeleteCharacter = async (id) => {
    if (!confirm('Delete this character avatar?')) return;
    try {
      const res = await fetch(`/api/creator/characters/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadCharacters();
    } catch (err) {}
  };

  // Quiz Builder Handlers
  const handleOpenCreateQuiz = () => {
    setEditingQuizId(null);
    setQuizTitle('');
    setQuizCategory('');
    setQuizLobbyCountdown(5);
    setQuestions([
      {
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: Math.min(30, guardrails.maxQuestionDuration || 120)
      }
    ]);
    setShowQuizModal(true);
  };

  const handleOpenEditQuiz = (q) => {
    setEditingQuizId(q._id);
    setQuizTitle(q.title);
    setQuizCategory(q.categoryId?._id || q.categoryId || '');
    setQuizLobbyCountdown(q.lobbyCountdown !== undefined ? q.lobbyCountdown : 5);
    setQuestions(
      q.questions && q.questions.length > 0
        ? q.questions.map((item) => ({
            text: item.text,
            options: item.options || ['', '', '', ''],
            correctIndex: item.correctIndex || 0,
            timeLimit: Math.min(item.timeLimit || 30, guardrails.maxQuestionDuration || 120)
          }))
        : [{ text: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30 }]
    );
    setShowQuizModal(true);
  };

  const handleAddQuestion = () => {
    if (questions.length >= (guardrails.maxQuestionsCount || 50)) {
      alert(`Cannot exceed Admin guardrail of ${guardrails.maxQuestionsCount} questions per quiz.`);
      return;
    }
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: Math.min(30, guardrails.maxQuestionDuration || 120)
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      alert('A quiz must contain at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Quiz title is required');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question #${i + 1} is missing question text.`);
        return;
      }
      const validOptions = q.options.filter((o) => o && o.trim().length > 0);
      if (validOptions.length < 2) {
        alert(`Question #${i + 1} must have at least 2 options.`);
        return;
      }
    }

    try {
      const url = editingQuizId ? `/api/creator/quizzes/${editingQuizId}` : '/api/creator/quizzes';
      const method = editingQuizId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quizTitle.trim(),
          categoryId: quizCategory || undefined,
          lobbyCountdown: Number(quizLobbyCountdown) || 5,
          questions
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save quiz');
      }

      setShowQuizModal(false);
      loadQuizzes();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await fetch(`/api/creator/quizzes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadQuizzes();
    } catch (err) {}
  };

  // 1. Redirect if unauthenticated
  if (!token) {
    window.location.href = '/?redirect=/creator';
    return null;
  }

  // 2. Main Creator Portal View
  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden select-none">
      {/* Universal Top Role-Based Portal Switcher */}
      <PortalSwitcher current="creator" currentUser={user} />
      {/* Hyperspeed Cosmic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Hyperspeed effectOptions={hyperspeedConfig} />
      </div>

      {/* Ambient Top Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-sky-500/10 rounded-full blur-[180px] pointer-events-none z-1" />

      {/* Top Navbar */}
      <header className="relative z-10 h-16 flex items-center justify-between px-6 sm:px-8 bg-[#121214]/85 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-black shadow-md shadow-sky-500/30">
              <Palette size={18} strokeWidth={2} />
            </div>
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <ShinyText text="ZYNC" speed={3} />
              <span className="text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Creator
              </span>
            </span>
          </div>

          {/* Module Switcher: Quizzes | Avatars */}
          <div className="flex bg-white/[0.05] p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'quizzes'
                  ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-black shadow-md font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <HelpCircle size={14} />
              <span>Quizzes</span>
            </button>
            <button
              onClick={() => setActiveTab('avatars')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'avatars'
                  ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-black shadow-md font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette size={14} />
              <span>Avatars</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5 bg-white/[0.05] px-4 py-2 rounded-2xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8]" />
              <span className="text-xs font-bold text-white">{user.name || user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="h-10 px-4 rounded-2xl bg-white/[0.05] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-neutral-300 hover:text-red-400 font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
            title="Sign Out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6 z-10 overflow-y-auto">
        {/* TAB 1: QUIZZES */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Quiz Studio</h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 flex items-center gap-2 font-mono">
                  <ShieldCheck size={14} className="text-sky-400" />
                  <span>
                    Admin Policy: Max {guardrails.maxQuestionDuration}s per question &bull; Max {guardrails.maxQuestionsCount} questions
                  </span>
                </p>
              </div>

              <StarBorder
                as="button"
                onClick={handleOpenCreateQuiz}
                color="#38BDF8"
                speed="3s"
                className="cursor-pointer active:scale-95 transition-transform shadow-xl shadow-sky-500/20"
              >
                <div className="px-6 py-3 font-black text-sm tracking-wide text-white flex items-center gap-2">
                  <Plus size={18} className="stroke-[3]" />
                  <span>Create</span>
                </div>
              </StarBorder>
            </div>

            {/* Quizzes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes && quizzes.length > 0 ? (
                quizzes.map((q) => (
                  <div
                    key={q._id}
                    className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 hover:border-sky-500/40 transition shadow-2xl flex flex-col justify-between group space-y-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {q.categoryId?.name || 'General'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditQuiz(q)}
                            className="p-1.5 text-neutral-500 hover:text-white transition rounded-lg hover:bg-white/10"
                            title="Edit Quiz"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(q._id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                            title="Delete Quiz"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                        {q.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{q.questions?.length || 0} questions</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer size={14} />
                          <span>{q.lobbyCountdown !== undefined ? q.lobbyCountdown : 5}s countdown</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span>Author: {q.ownerId?.name || 'Creator'}</span>
                      <button
                        onClick={() => handleOpenEditQuiz(q)}
                        className="text-sky-400 hover:text-sky-300 font-bold"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center text-neutral-500 space-y-3">
                  <HelpCircle size={36} className="mx-auto text-neutral-600" />
                  <p className="text-sm">No quizzes created yet. Click Create above to design a quiz.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AVATARS */}
        {activeTab === 'avatars' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Character Studio</h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Upload authentic .svg or .png vector characters with automated pedestals
                </p>
              </div>

              <StarBorder
                as="button"
                onClick={() => setShowCharModal(true)}
                color="#38BDF8"
                speed="3s"
                className="cursor-pointer active:scale-95 transition-transform shadow-xl shadow-sky-500/20"
              >
                <div className="px-6 py-3 font-black text-sm tracking-wide text-white flex items-center gap-2">
                  <Plus size={18} className="stroke-[3]" />
                  <span>Add Character</span>
                </div>
              </StarBorder>
            </div>

            {/* Master Vector Character Artist Prompt Card */}
            <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Master Vector Character Artist Prompt</h3>
                    <p className="text-xs text-neutral-400">Copy this prompt into Stitch or external LLM to generate authentic character vector designs</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="h-10 px-5 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
                >
                  {copiedPrompt ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{copiedPrompt ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-black/50 rounded-2xl p-4 border border-white/5 font-mono text-xs text-neutral-300 max-h-48 overflow-y-auto leading-relaxed select-all">
                {MASTER_VECTOR_PROMPT}
              </div>
            </div>

            {/* Characters Roster Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {characters && characters.length > 0 ? (
                characters.map((char) => {
                  const charMap = { [char.characterId]: char };
                  return (
                    <div
                      key={char._id}
                      className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-4 border border-white/10 hover:border-sky-500/40 transition shadow-2xl flex flex-col items-center justify-between text-center relative group"
                    >
                      <button
                        onClick={() => handleDeleteCharacter(char._id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-neutral-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                        title="Delete character"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="py-2">
                        <CharacterAvatar
                          config={{ presetOutfit: char.characterId }}
                          mode="bust"
                          size={72}
                          characterRegistry={charMap}
                        />
                      </div>

                      <div className="w-full mt-2">
                        <div className="text-sm font-bold text-white truncate">{char.name}</div>
                        <div className="text-[10px] text-sky-400 font-mono uppercase truncate mt-0.5">
                          {char.animeName || 'Anime Universe'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center text-neutral-500 text-sm">
                  No characters added yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create / Edit Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingQuizId ? 'Edit Quiz' : 'Create New Quiz'}
              </h2>
              <button
                onClick={() => setShowQuizModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Distributed Systems"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Lobby Countdown (s)</label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={quizLobbyCountdown}
                    onChange={(e) => setQuizLobbyCountdown(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Questions Count</label>
                  <div className="h-12 px-4 rounded-xl bg-white/[0.03] border border-white/5 text-neutral-300 font-mono text-sm flex items-center">
                    {questions.length} / {guardrails.maxQuestionsCount || 50} Max
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Questions ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-sky-400">Question #{qIdx + 1}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                            <span>Time Limit:</span>
                            <input
                              type="number"
                              min="5"
                              max={guardrails.maxQuestionDuration || 120}
                              value={q.timeLimit}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...questions];
                                updated[qIdx].timeLimit = Math.min(val, guardrails.maxQuestionDuration || 120);
                                setQuestions(updated);
                              }}
                              className="w-14 h-7 px-2 rounded bg-black/40 border border-white/10 text-white text-xs font-mono"
                            />
                            <span>s</span>
                          </div>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-neutral-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Enter question text..."
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].text = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                        required
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => {
                                const updated = [...questions];
                                updated[qIdx].correctIndex = optIdx;
                                setQuestions(updated);
                              }}
                              className="accent-sky-400 cursor-pointer"
                              title="Mark as correct answer"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setQuestions(updated);
                              }}
                              className="flex-1 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                              required={optIdx < 2}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-12 px-8 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-extrabold text-xs shadow-lg shadow-sky-400/20"
                >
                  Save Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Character Avatar */}
      {showCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Add Character Avatar</h2>
              <button
                onClick={() => setShowCharModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCharacter} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400">Character Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goku, Naruto, Pikachu"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400">Anime Universe</label>
                <input
                  type="text"
                  placeholder="e.g. Dragon Ball, Naruto Shippuden, Pokemon"
                  value={charAnimeName}
                  onChange={(e) => setCharAnimeName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              {/* Graphic Upload Section (.svg & .png only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400 flex items-center justify-between">
                  <span>Vector Graphic (.svg or .png only)</span>
                  <span className="text-[10px] text-sky-400">Automated pedestal</span>
                </label>

                <div className="border-2 border-dashed border-white/15 rounded-2xl p-6 text-center hover:border-sky-400/50 transition cursor-pointer relative bg-white/[0.02]">
                  <input
                    type="file"
                    accept=".svg,.png,image/svg+xml,image/png"
                    onChange={handleGraphicUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <UploadCloud size={32} className="text-sky-400" />
                    <p className="text-xs font-bold text-white">Click or drag .svg or .png file here</p>
                    <p className="text-[10px] text-neutral-400">Accepts pure SVG code or high-res transparent PNG</p>
                  </div>
                </div>
              </div>

              {/* Live Preview Area (Pedestal automated) */}
              {charSvgCode && (
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 mb-2">Graphic Preview</span>
                  {/* Automated Ground Pedestal Glow */}
                  <div className="w-32 h-6 bg-sky-500/20 rounded-full blur-md" />
                  {charImagePreview ? (
                    <img
                      src={charImagePreview}
                      alt="Preview"
                      className="w-24 h-28 object-contain drop-shadow-xl"
                    />
                  ) : (
                    <div
                      className="w-24 h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain drop-shadow-xl"
                      dangerouslySetInnerHTML={{ __html: charSvgCode }}
                    />
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCharModal(false)}
                  className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChar}
                  className="h-12 px-8 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-extrabold text-xs shadow-lg shadow-sky-400/20 transition cursor-pointer active:scale-95"
                >
                  {savingChar ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
