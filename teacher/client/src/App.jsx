import React, { useState, useEffect } from 'react';
import AvatarSvg from './components/AvatarSvg';
import CharacterAvatar from './components/CharacterAvatar';
import StarBorder from './components/reactbits/StarBorder';
import ShinyText from './components/reactbits/ShinyText';
import Hyperspeed from './components/reactbits/Hyperspeed';
import PortalSwitcher from './components/PortalSwitcher';
import {
  Triangle,
  Square,
  Circle,
  Diamond,
  Play,
  Plus,
  LogOut,
  Users,
  Award,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Sparkles,
  ExternalLink,
  Zap,
  Timer,
  Check,
  X,
  Trash2,
  Presentation,
  ShieldCheck,
  UserCheck,
  UserX,
  Pause,
  MessageSquare,
  Edit
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
    leftCars: [0x34d399, 0x10b981, 0x059669],
    rightCars: [0x5eead4, 0x14b8a6, 0x0d9488],
    sticks: 0x34d399
  }
};

export default function App() {
  const [token, setToken] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qToken = urlParams.get('token');
      const qUser = urlParams.get('user');
      if (qToken) {
        localStorage.setItem('zync_token', qToken);
        localStorage.setItem('zync_teacher_token', qToken);
        if (qUser) localStorage.setItem('zync_user', qUser);
        window.history.replaceState({}, document.title, window.location.pathname);
        return qToken;
      }
    } catch (e) {}
    return localStorage.getItem('zync_token') || localStorage.getItem('zync_teacher_token');
  });
  const [user, setUser] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qUser = urlParams.get('user');
      if (qUser) return JSON.parse(qUser);
    } catch (e) {}
    const saved = localStorage.getItem('zync_user') || localStorage.getItem('zync_teacher_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [portalNotice, setPortalNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifyingAuth, setVerifyingAuth] = useState(true);

  // Verify server session and Presentor role permissions
  useEffect(() => {
    async function verifyTeacherAccess() {
      const currentToken = token || localStorage.getItem('zync_token') || localStorage.getItem('zync_teacher_token');
      if (!currentToken) {
        setVerifyingAuth(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        const role = (data.user?.role || '').toLowerCase();
        const allowedRoles = ['presentor', 'teacher', 'admin'];
        if (allowedRoles.includes(role)) {
          setUser(data.user);
          localStorage.setItem('zync_user', JSON.stringify(data.user));
          setVerifyingAuth(false);
        } else {
          // Block unauthorized role and redirect to student pad
          if (window.location.port === '5173') {
            window.location.href = `http://${window.location.hostname}:5172`;
          } else {
            window.location.href = '/';
          }
        }
      } catch (err) {
        setVerifyingAuth(false);
      }
    }

    verifyTeacherAccess();
  }, [token]);

  // Presentor dashboard state
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Character registry & student selection for projector showcase
  const [characterRegistry, setCharacterRegistry] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Live podium comments
  const [danmakuComments, setDanmakuComments] = useState([]);

  // New Quiz form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLobbyCountdown, setNewLobbyCountdown] = useState(5);
  const [newQuestions, setNewQuestions] = useState([
    {
      text: 'What does REST stand for?',
      options: [
        'Representational State Transfer',
        'Real-time Encrypted Socket Transmission',
        'Relational Schema Table',
        'Routing Endpoint System Tools'
      ],
      correctIndex: 0,
      timeLimit: 20
    }
  ]);

  // Edit Quiz form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLobbyCountdown, setEditLobbyCountdown] = useState(5);

  // Load characters registry from MongoDB
  useEffect(() => {
    fetch('/api/characters')
      .then((res) => res.json())
      .then((data) => {
        if (data.characters) {
          const map = {};
          data.characters.forEach((c) => {
            map[c.characterId] = c;
          });
          setCharacterRegistry(map);
        }
      })
      .catch(() => {});
  }, []);

  // Load quizzes and categories when logged in
  useEffect(() => {
    if (!token) return;

    fetch('/api/quizzes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setQuizzes(data);
      })
      .catch(() => {});

    fetch('/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setNewCategory(data[0]._id);
        }
      })
      .catch(() => {});
  }, [token]);

  // Auto-select first player when players change if none selected or selected player left
  useEffect(() => {
    if (gameState?.players && gameState.players.length > 0) {
      if (!selectedStudentId || !gameState.players.find((p) => p._id === selectedStudentId)) {
        setSelectedStudentId(gameState.players[0]._id);
      }
    }
  }, [gameState?.players, selectedStudentId]);

  // Poll active game state every 1000ms
  useEffect(() => {
    if (!token || !activeGameId) return;

    let isMounted = true;
    const pollHostState = async () => {
      try {
        const res = await fetch(`/api/games/${activeGameId}/host-state`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setGameState(data);
        }
      } catch (err) {}
    };

    pollHostState();
    const interval = setInterval(pollHostState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, activeGameId]);

  // Poll live comments when quiz ends
  useEffect(() => {
    if (!activeGameId || gameState?.game?.status !== 'ended') return;

    let isMounted = true;
    const pollComments = async () => {
      try {
        const res = await fetch(`/api/comments?gameId=${activeGameId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setDanmakuComments(data);
          }
        }
      } catch (err) {}
    };

    pollComments();
    const interval = setInterval(pollComments, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeGameId, gameState?.game?.status]);

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
      localStorage.setItem('zync_teacher_token', data.token);
      localStorage.setItem('zync_teacher_user', JSON.stringify(data.user));
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zync_teacher_token');
    localStorage.removeItem('zync_teacher_user');
    setToken(null);
    setUser(null);
    setActiveGameId(null);
    setGameState(null);
  };

  // Launch Host Session
  const handleHostQuiz = async (quizId) => {
    try {
      const res = await fetch('/api/games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quizId })
      });

      const data = await res.json();
      if (res.ok && data.game) {
        setActiveGameId(data.game._id);
        setGameState({
          game: data.game,
          quiz: data.quiz,
          totalPlayers: 0,
          players: [],
          waitingPlayers: []
        });
      } else {
        alert(data.error || 'Failed to start game session');
      }
    } catch (err) {
      alert('Failed to launch game');
    }
  };

  // Game Control Handlers
  const handleAdmitPlayer = async (playerId, all = false) => {
    if (!activeGameId) return;
    try {
      await fetch(`/api/games/${activeGameId}/admit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ playerId, all })
      });
    } catch (err) {}
  };

  const handleDeclinePlayer = async (playerId) => {
    if (!activeGameId) return;
    try {
      await fetch(`/api/games/${activeGameId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ playerId })
      });
    } catch (err) {}
  };

  const handleStartGame = async (bypass = false) => {
    if (!activeGameId) return;
    await fetch(`/api/games/${activeGameId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bypass })
    });
  };

  const handleBypassGame = async () => {
    if (!activeGameId) return;
    await fetch(`/api/games/${activeGameId}/bypass`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleRevealResults = async () => {
    if (!activeGameId) return;
    await fetch(`/api/games/${activeGameId}/reveal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleNextQuestion = async () => {
    if (!activeGameId) return;
    await fetch(`/api/games/${activeGameId}/next`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleEndGame = async () => {
    if (!activeGameId) return;
    await fetch(`/api/games/${activeGameId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCategory) return;

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          categoryId: newCategory,
          questions: newQuestions,
          lobbyCountdown: Number(newLobbyCountdown) || 5
        })
      });

      if (res.ok) {
        const created = await res.json();
        setQuizzes([created, ...quizzes]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewLobbyCountdown(5);
      }
    } catch (err) {
      alert('Failed to save quiz');
    }
  };

  const handleOpenEditQuiz = (q) => {
    setEditingQuizId(q._id);
    setEditTitle(q.title);
    setEditCategory(q.categoryId?._id || q.categoryId || (categories[0]?._id || ''));
    setEditLobbyCountdown(q.lobbyCountdown !== undefined ? q.lobbyCountdown : 5);
    setShowEditModal(true);
  };

  const handleSaveEditQuiz = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editCategory || !editingQuizId) return;

    try {
      const res = await fetch(`/api/quizzes/${editingQuizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          categoryId: editCategory,
          lobbyCountdown: Number(editLobbyCountdown) || 5
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setQuizzes(quizzes.map((q) => (q._id === updated._id ? updated : q)));
        setShowEditModal(false);
        setEditingQuizId(null);
      }
    } catch (err) {
      alert('Failed to update quiz settings');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await fetch(`/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQuizzes(quizzes.filter((q) => q._id !== id));
      }
    } catch (err) {}
  };

  const allowedTeacherRoles = ['presentor', 'teacher', 'admin'];
  const userRole = (user?.role || '').toLowerCase();

  // 1. Redirect if unauthenticated
  if (!token) {
    if (window.location.port === '5173') {
      window.location.href = `http://${window.location.hostname}:5172/?redirect=${encodeURIComponent(`http://${window.location.hostname}:5173`)}`;
      return null;
    }
    if (window.location.pathname !== '/' || !window.location.search.includes('redirect')) {
      window.location.href = '/?redirect=/presentor';
      return null;
    }
    return null;
  }

  // 2. Immediate local block if authenticated user lacks Presentor permission
  if (user && !allowedTeacherRoles.includes(userRole)) {
    if (window.location.port === '5173') {
      window.location.href = `http://${window.location.hostname}:5172`;
    } else {
      window.location.href = '/';
    }
    return null;
  }

  // 3. Loading state while verifying server session
  if (verifyingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Presentor access...</span>
        </div>
      </div>
    );
  }

  // 4. Final check after server verification
  if (!user || !allowedTeacherRoles.includes((user.role || '').toLowerCase())) {
    if (window.location.port === '5173') {
      window.location.href = `http://${window.location.hostname}:5172`;
    } else {
      window.location.href = '/';
    }
    return null;
  }

  // 2. Active Quiz Arena (Projector Fullscreen Experience)
  if (activeGameId && gameState) {
    const { game, currentQuestion, optionCounts, answeredCount, totalPlayers, topLeaderboard, players, waitingPlayers } = gameState;

    return (
      <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden select-none">
        {/* Universal Top Role-Based Portal Switcher */}
        <PortalSwitcher current="presentor" currentUser={user} />
        {/* Hyperspeed Cosmic Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Hyperspeed effectOptions={hyperspeedConfig} />
        </div>

        {/* Ambient Spotlight Aura */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[180px] pointer-events-none z-1" />

        {/* Projector Top Bar */}
        <header className="relative z-10 flex items-center justify-between px-8 py-4 bg-[#121214]/85 backdrop-blur-2xl border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Leave arena view? The game session will remain active.')) {
                  setActiveGameId(null);
                }
              }}
              className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-md shadow-emerald-500/30">
                <Presentation size={18} strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <ShinyText text="ZYNC" speed={3} />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Arena
                  </span>
                </div>
                <h2 className="text-sm font-bold leading-tight text-white/90">{gameState.quiz?.title || 'Classroom Quiz'}</h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/[0.05] px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono text-neutral-300">
              <Users size={15} className="text-emerald-400" />
              <span>{totalPlayers || 0} Connected</span>
            </div>

            <div className="text-xl font-mono font-black tracking-widest px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/25">
              CODE {game.pin}
            </div>
          </div>
        </header>

        {/* Dynamic Projector Body */}
        <main className="relative z-10 flex-1 flex flex-col p-6 sm:p-8 max-w-7xl w-full mx-auto justify-between">
          {/* State: Lobby or Countdown */}
          {(game.status === 'lobby' || game.status === 'countdown') && (() => {
            const selectedStudent = (players && players.find((p) => p._id === selectedStudentId)) || players?.[0];
            const selectedCharId = selectedStudent?.avatarConfig?.presetOutfit || 'naruto';
            const selectedCharData = characterRegistry[selectedCharId] || {
              name: 'Student Hero',
              animeName: 'Anime Universe',
              color: '#34D399'
            };
            const isCountdown = game.status === 'countdown';
            const countdownRemaining = gameState.countdownRemaining !== undefined ? gameState.countdownRemaining : (game.countdownDuration || 5);

            return (
              <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
                {/* Top Info Banner */}
                <div className="flex items-center justify-between bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34D399]" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      {isCountdown ? 'Countdown Active' : 'Classroom Lobby'}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                      (Students join at {typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5172' : (typeof window !== 'undefined' ? window.location.origin : '/')})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-mono">Room Code</span>
                    <span className="text-2xl font-black font-mono tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-2xl shadow-lg shadow-emerald-500/10">
                      {game.pin}
                    </span>
                  </div>
                </div>

                {/* Admission Queue Card (If any students are waiting) */}
                {waitingPlayers && waitingPlayers.length > 0 && (
                  <div className="bg-amber-500/10 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-2">
                          <span>Admission Queue</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[10px]">
                            {waitingPlayers.length} Waiting
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-0.5">
                          Students waiting for presenter admission into the quiz room
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleAdmitPlayer(null, true)}
                        className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <Check size={16} strokeWidth={3} />
                        <span>Admit All</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Main 2-Column Split: Left = Ordered List, Right = Big Character Spotlight */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[460px]">
                  {/* Left Column (5 cols): List by Usernames in Order of Joining */}
                  <div className="lg:col-span-5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-emerald-400" />
                        <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white">
                          Joined ({players?.length || 0})
                        </h3>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        Arrival Order
                      </span>
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[440px]">
                      {/* Show waiting list items first if any */}
                      {waitingPlayers && waitingPlayers.map((wp) => (
                        <div
                          key={wp._id}
                          className="w-full flex items-center justify-between p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              ?
                            </span>
                            <div className="shrink-0">
                              <CharacterAvatar
                                config={wp.avatarConfig}
                                mode="bust"
                                size={36}
                                characterRegistry={characterRegistry}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{wp.nickname}</div>
                              <div className="text-[10px] text-amber-400 font-mono">Waiting for admission</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAdmitPlayer(wp._id)}
                              className="h-8 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Admit"
                            >
                              Admit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclinePlayer(wp._id)}
                              className="h-8 px-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
                              title="Decline"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Active joined players */}
                      {players && players.length > 0 ? (
                        players.map((p, idx) => {
                          const isSelected = p._id === selectedStudent?._id;
                          const pCharId = p.avatarConfig?.presetOutfit || 'naruto';
                          const pChar = characterRegistry[pCharId];

                          return (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => setSelectedStudentId(p._id)}
                              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_rgba(52,211,153,0.2)] ring-1 ring-emerald-500/50'
                                  : 'bg-white/[0.04] border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {/* Order Badge #1, #2, ... */}
                                <span
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                                    isSelected
                                      ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/30'
                                      : 'bg-white/[0.06] text-neutral-300 border border-white/10'
                                  }`}
                                >
                                  #{p.joinOrder || (idx + 1)}
                                </span>

                                {/* Character Bust Avatar */}
                                <div className="shrink-0">
                                  <CharacterAvatar
                                    config={p.avatarConfig}
                                    mode="bust"
                                    size={42}
                                    characterRegistry={characterRegistry}
                                  />
                                </div>

                                {/* Student Nickname & Character Info */}
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{p.nickname}</span>
                                    {isSelected && (
                                      <span className="text-[10px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.2 rounded-md uppercase">
                                        Viewing
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-neutral-400 truncate font-medium">
                                    {pChar?.name || pCharId} &bull; {pChar?.animeName || 'Anime'}
                                  </div>
                                </div>
                              </div>

                              <ChevronRight
                                size={18}
                                className={`shrink-0 transition-transform ${
                                  isSelected ? 'text-emerald-400 translate-x-1' : 'text-neutral-500'
                                }`}
                              />
                            </button>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400 space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                            <Users size={24} className="text-neutral-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">No active players yet</p>
                            <p className="text-xs text-neutral-400">Players join using Code {game.pin}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (7 cols): Heroic Character Spotlight (Good Big View) */}
                  <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl">
                    {selectedStudent ? (
                      <>
                        {/* Spotlight Header */}
                        <div className="z-10 w-full flex items-center justify-between border-b border-white/10 pb-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                            <Sparkles size={14} />
                            <span>Spotlight</span>
                          </div>
                          <div className="text-xs font-mono text-neutral-400">
                            Player #{selectedStudent.joinOrder || 1}
                          </div>
                        </div>

                        {/* Ambient Spotlight Radial Glow */}
                        <div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-30 transition-colors duration-500"
                          style={{ backgroundColor: selectedCharData?.color || '#34D399' }}
                        />

                        {/* Large Heroic Avatar with Pedestal (Big View) */}
                        <div className="my-auto relative flex flex-col items-center z-10 py-2">
                          {/* Pedestal Ground Glow */}
                          <div
                            className="absolute bottom-2 w-72 h-14 rounded-[100%] blur-2xl pointer-events-none opacity-70 transition-colors duration-500"
                            style={{
                              backgroundColor: selectedCharData?.color ? `${selectedCharData.color}60` : 'rgba(52, 211, 153, 0.5)'
                            }}
                          />
                          <div className="absolute bottom-3 w-52 h-6 bg-white/20 rounded-[100%] blur-md pointer-events-none" />

                          <CharacterAvatar
                            config={selectedStudent.avatarConfig}
                            mode="fullBody"
                            size={320}
                            characterRegistry={characterRegistry}
                          />
                        </div>

                        {/* Large Username & Character Title */}
                        <div className="z-10 w-full pt-2">
                          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
                            {selectedStudent.nickname}
                          </h2>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-sm sm:text-base font-bold text-white/90">
                              {selectedCharData?.name || selectedCharId}
                            </span>
                            <span className="text-xs text-neutral-500">&bull;</span>
                            <span
                              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider"
                              style={{ color: selectedCharData?.color || '#34D399' }}
                            >
                              {selectedCharData?.animeName || selectedCharData?.anime || 'Anime Universe'}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="my-auto text-center space-y-3 z-10">
                        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto">
                          <Users size={28} className="text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Standby</h3>
                        <p className="text-xs text-neutral-400 max-w-xs">
                          Waiting for students to connect. When students join, click any username to view their character!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Area: Start Quiz / Countdown & Bypass */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  {isCountdown ? (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
                          <Timer size={26} className="text-sky-400 animate-spin" />
                        </div>
                        <div>
                          <div className="text-xs uppercase font-mono tracking-widest text-sky-400 font-bold">
                            Countdown Active
                          </div>
                          <div className="text-2xl font-black text-white flex items-center gap-2">
                            <span>Quiz starts in</span>
                            <span className="text-3xl font-mono text-sky-300 animate-bounce">{countdownRemaining}</span>
                            <span>seconds...</span>
                          </div>
                        </div>
                      </div>

                      {/* Bypass Button */}
                      <button
                        type="button"
                        onClick={handleBypassGame}
                        className="h-14 px-8 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-extrabold rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition flex items-center gap-2.5 text-base cursor-pointer"
                      >
                        <Zap size={20} fill="black" />
                        <span>Bypass</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-neutral-400 text-xs">
                        <Users size={16} className="text-emerald-400" />
                        <span>
                          {players?.length || 0} players ready &bull; Countdown duration: {gameState.quiz?.lobbyCountdown || 5}s
                        </span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleStartGame(true)}
                          className="h-14 px-6 bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-white font-bold rounded-2xl active:scale-95 transition flex items-center gap-2 text-sm cursor-pointer"
                          title="Skip countdown and start immediately"
                        >
                          <Zap size={18} className="text-amber-400" />
                          <span>Quick Start</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartGame(false)}
                          disabled={!players || players.length === 0}
                          className="h-14 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black text-base rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                        >
                          <Play size={20} fill="black" />
                          <span>Start Quiz</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* State: Active Question */}
          {game.status === 'question' && currentQuestion && (
            <div className="flex-1 flex flex-col justify-between py-4 space-y-6">
              {/* Question Header & Counter */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Question {(game.currentIndex || 0) + 1} of {gameState.quiz?.totalQuestions || 1}
                </span>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/[0.05] px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>{answeredCount} / {totalPlayers} Answered</span>
                  </div>
                </div>
              </div>

              {/* Question Text Box */}
              <div className="bg-white/[0.03] backdrop-blur-2xl p-8 rounded-3xl border border-white/10 text-center shadow-2xl my-auto">
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* 4 Interactive Option Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: currentQuestion.options[0], color: 'from-rose-600 to-red-500', icon: Triangle },
                  { label: currentQuestion.options[1], color: 'from-blue-600 to-cyan-500', icon: Diamond },
                  { label: currentQuestion.options[2], color: 'from-amber-500 to-yellow-400', icon: Circle },
                  { label: currentQuestion.options[3], color: 'from-emerald-600 to-green-500', icon: Square }
                ].map((opt, idx) => {
                  const Icon = opt.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-2xl bg-gradient-to-r ${opt.color} flex items-center gap-4 text-white font-bold text-lg shadow-xl shadow-black/40`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                        <Icon size={20} className="fill-white/80" />
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Presentor Action: Reveal */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleRevealResults}
                  className="h-14 px-10 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer text-base"
                >
                  <span>Reveal</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* State: Results (Distribution Matrix Bar Chart & Leaderboard) */}
          {game.status === 'results' && currentQuestion && (
            <div className="flex-1 flex flex-col justify-between py-4 space-y-6">
              <div className="text-center space-y-2">
                <ShinyText text="RESULTS" speed={3} className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-400" />
                <h2 className="text-2xl sm:text-3xl font-black text-white">{currentQuestion.text}</h2>
              </div>

              {/* Distribution Matrix Bar Chart & Top 5 Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 items-center">
                {/* Left: 4 Option Answer Bar Chart */}
                <div className="bg-white/[0.03] backdrop-blur-2xl p-7 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 pb-2 border-b border-white/10">
                    Answer Distribution
                  </h3>

                  <div className="space-y-4">
                    {[
                      { label: currentQuestion.options[0], count: optionCounts[0], color: '#FF453A', icon: Triangle },
                      { label: currentQuestion.options[1], count: optionCounts[1], color: '#0A84FF', icon: Diamond },
                      { label: currentQuestion.options[2], count: optionCounts[2], color: '#FFD60A', icon: Circle, textColor: 'text-black' },
                      { label: currentQuestion.options[3], count: optionCounts[3], color: '#30D158', icon: Square }
                    ].map((opt, idx) => {
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const maxCount = Math.max(...optionCounts, 1);
                      const pct = Math.round((opt.count / maxCount) * 100);

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2">
                              {isCorrect && <CheckCircle2 size={16} className="text-emerald-400" />}
                              <span className={isCorrect ? 'text-emerald-300 font-bold' : 'text-neutral-300'}>{opt.label}</span>
                            </span>
                            <span className="font-mono text-white font-bold">{opt.count} votes</span>
                          </div>
                          <div className="h-7 w-full bg-white/[0.05] rounded-xl overflow-hidden flex border border-white/5">
                            <div
                              style={{ width: `${Math.max(pct, 6)}%`, backgroundColor: opt.color }}
                              className="h-full rounded-xl transition-all duration-700 flex items-center px-3 text-xs font-black font-mono shadow-md"
                            >
                              {opt.count}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Top 5 Live Leaderboard */}
                <div className="bg-white/[0.03] backdrop-blur-2xl p-7 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 pb-2 border-b border-white/10 flex items-center justify-between">
                    <span>Leaderboard</span>
                    <Award size={18} className="text-amber-400" />
                  </h3>

                  <div className="space-y-3">
                    {topLeaderboard && topLeaderboard.map((lb, idx) => (
                      <div
                        key={lb._id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                            idx === 0 ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/[0.08] text-white'
                          }`}>
                            #{idx + 1}
                          </span>
                          <CharacterAvatar
                            config={lb.avatarConfig}
                            mode="bust"
                            size={32}
                            characterRegistry={characterRegistry}
                          />
                          <span className="font-bold text-sm text-white">{lb.nickname}</span>
                        </div>
                        <span className="font-mono font-black text-emerald-400">{lb.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Host Action: Next Question or Finale */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="h-14 px-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center gap-2 cursor-pointer text-base"
                >
                  <span>Next Question</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* State: Podium Victory Screen (Ladder Climbing + Danmaku Comments) */}
          {game.status === 'ended' && (
            <div className="flex-1 flex flex-col justify-between py-6 text-center space-y-6 relative overflow-hidden">
              {/* Danmaku Floating Comment Canvas */}
              <div className="absolute inset-x-0 top-10 h-32 pointer-events-none z-30 overflow-hidden">
                {danmakuComments && danmakuComments.map((c, idx) => (
                  <div
                    key={c._id || idx}
                    style={{
                      top: `${(idx % 4) * 25}%`,
                      animationDuration: `${12 + (idx % 3) * 3}s`
                    }}
                    className="absolute whitespace-nowrap px-4 py-1.5 bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono text-sm rounded-full shadow-2xl animate-danmaku"
                  >
                    <span className="text-emerald-400 font-bold mr-2">{c.author}:</span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 z-10">
                <ShinyText text="CHAMPIONSHIP PODIUM" speed={2.5} className="text-xs uppercase font-mono font-bold tracking-widest text-amber-400" />
                <h1 className="text-4xl sm:text-5xl font-black text-white">Quiz Completed!</h1>
              </div>

              {/* 3D Ladder Climbing Rungs / Podium */}
              <div className="flex items-end justify-center gap-6 max-w-3xl mx-auto w-full my-auto z-10">
                {/* 2nd Place */}
                {topLeaderboard && topLeaderboard[1] && (
                  <div className="flex-1 flex flex-col items-center gap-2 animate-bounce" style={{ animationDuration: '2.5s' }}>
                    <CharacterAvatar
                      config={topLeaderboard[1].avatarConfig}
                      mode="bust"
                      size={60}
                      characterRegistry={characterRegistry}
                    />
                    <div className="font-bold text-sm truncate max-w-[120px] text-white">{topLeaderboard[1].nickname}</div>
                    <div className="text-xs font-mono text-neutral-400 font-bold">{topLeaderboard[1].score} pts</div>
                    <div className="w-full h-32 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-3xl flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-slate-900/50 border-t border-slate-400">
                      2
                    </div>
                  </div>
                )}

                {/* 1st Place Champion */}
                {topLeaderboard && topLeaderboard[0] && (
                  <div className="flex-1 flex flex-col items-center gap-2 -mt-10 animate-bounce" style={{ animationDuration: '1.8s' }}>
                    <Sparkles size={32} className="text-amber-400 animate-spin" />
                    <CharacterAvatar
                      config={topLeaderboard[0].avatarConfig}
                      mode="bust"
                      size={76}
                      characterRegistry={characterRegistry}
                    />
                    <div className="font-black text-base truncate max-w-[140px] text-amber-300">
                      {topLeaderboard[0].nickname}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 font-black">{topLeaderboard[0].score} pts</div>
                    <div className="w-full h-44 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-3xl flex items-center justify-center font-black text-5xl text-black shadow-2xl shadow-amber-500/30 border-t border-yellow-200">
                      1
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topLeaderboard && topLeaderboard[2] && (
                  <div className="flex-1 flex flex-col items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                    <CharacterAvatar
                      config={topLeaderboard[2].avatarConfig}
                      mode="bust"
                      size={52}
                      characterRegistry={characterRegistry}
                    />
                    <div className="font-bold text-sm truncate max-w-[120px] text-white">{topLeaderboard[2].nickname}</div>
                    <div className="text-xs font-mono text-neutral-400 font-bold">{topLeaderboard[2].score} pts</div>
                    <div className="w-full h-24 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-3xl flex items-center justify-center font-black text-2xl text-amber-200 shadow-xl shadow-amber-950/50 border-t border-amber-600">
                      3
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center z-10">
                <button
                  type="button"
                  onClick={() => setActiveGameId(null)}
                  className="h-14 px-10 bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white font-bold rounded-2xl transition active:scale-95 cursor-pointer flex items-center gap-2 text-base"
                >
                  Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 3. Presentor Dashboard View
  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden select-none">
      {/* Hyperspeed Cosmic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Hyperspeed effectOptions={hyperspeedConfig} />
      </div>

      {/* Ambient Top Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[180px] pointer-events-none z-1" />

      {/* Top Navbar matching admin, principal, moderator */}
      <PortalSwitcher current="presentor" currentUser={user} />
      <header className="relative z-10 h-16 flex items-center justify-between px-6 sm:px-8 bg-[#121214]/85 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-md shadow-emerald-500/30">
            <Presentation size={18} strokeWidth={2} />
          </div>
          <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            <ShinyText text="ZYNC" speed={3} />
            <span className="text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Presentor
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5 bg-white/[0.05] px-4 py-2 rounded-2xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
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

      {/* Main Content: Quizzes Roster */}
      <main className="flex-1 p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Quizzes</h1>
            <p className="text-xs sm:text-sm text-white/50 font-medium">Launch live classroom quiz games with custom countdowns</p>
          </div>

          <StarBorder
            as="button"
            onClick={() => setShowCreateModal(true)}
            color="#10B981"
            speed="3s"
            className="cursor-pointer active:scale-95 transition-transform shadow-xl shadow-emerald-500/20"
          >
            <div className="px-6 py-3 font-black text-sm tracking-wide text-white flex items-center gap-2">
              <Plus size={18} className="stroke-[3]" />
              <span>Create</span>
            </div>
          </StarBorder>
        </div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.length > 0 ? (
            quizzes.map((q) => (
              <div
                key={q._id}
                className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 hover:border-emerald-500/40 transition shadow-2xl flex flex-col justify-between group space-y-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">
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

                <button
                  type="button"
                  onClick={() => handleHostQuiz(q._id)}
                  className="w-full h-12 bg-white/[0.06] hover:bg-emerald-500 hover:text-black border border-white/10 hover:border-emerald-500 text-white font-extrabold rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg shadow-black/40"
                >
                  <Play size={16} />
                  <span>Launch Arena</span>
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-neutral-500 space-y-3">
              <Presentation size={36} className="mx-auto text-neutral-600" />
              <p className="text-sm">No quizzes found. Click Create above to build your first quiz.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Quiz */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Create New Quiz</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Modern Fullstack Architecture"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#1e1e24] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Lobby Countdown (s)</label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={newLobbyCountdown}
                    onChange={(e) => setNewLobbyCountdown(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Create Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Quiz */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Edit Quiz Settings</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuiz} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#1e1e24] border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Lobby Countdown (s)</label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    value={editLobbyCountdown}
                    onChange={(e) => setEditLobbyCountdown(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
