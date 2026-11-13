import React, { useState, useEffect } from 'react';
import AvatarSvg from './components/AvatarSvg';
import CharacterAvatar from './components/CharacterAvatar';
import StarBorder from './components/reactbits/StarBorder';
import ShinyText from './components/reactbits/ShinyText';
import Squares from './components/reactbits/Squares';
import PortalSwitcher from './components/PortalSwitcher';
import {
  ShieldAlert,
  LogOut,
  Users,
  VolumeX,
  Volume2,
  UserX,
  Trash2,
  ChevronRight,
  Play,
  Pause,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  History,
  ArrowLeft,
  Check,
  X,
  UserCheck,
  Sparkles,
  Radio,
  Clock,
  Ban,
  Activity
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
    leftCars: [0xa855f7, 0x9333ea, 0x7e22ce],
    rightCars: [0xc084fc, 0x818cf8, 0x6366f1],
    sticks: 0xa855f7
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
        localStorage.setItem('zync_moderator_token', qToken);
        if (qUser) localStorage.setItem('zync_user', qUser);
        window.history.replaceState({}, document.title, window.location.pathname);
        return qToken;
      }
    } catch (e) {}
    return localStorage.getItem('zync_token') || localStorage.getItem('zync_moderator_token');
  });
  const [user, setUser] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qUser = urlParams.get('user');
      if (qUser) return JSON.parse(qUser);
    } catch (e) {}
    const saved = localStorage.getItem('zync_user') || localStorage.getItem('zync_moderator_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [portalNotice, setPortalNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifyingAuth, setVerifyingAuth] = useState(true);

  // Verify server session and Moderator role permissions
  useEffect(() => {
    async function verifyModeratorAccess() {
      const currentToken = token || localStorage.getItem('zync_token') || localStorage.getItem('zync_moderator_token');
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
        const allowedRoles = ['moderator', 'admin'];
        if (allowedRoles.includes(role)) {
          setUser(data.user);
          localStorage.setItem('zync_user', JSON.stringify(data.user));
          setVerifyingAuth(false);
        } else {
          // Block unauthorized role and redirect to student pad
          if (window.location.port === '5174') {
            window.location.href = `http://${window.location.hostname}:5172`;
          } else {
            window.location.href = '/';
          }
        }
      } catch (err) {
        setVerifyingAuth(false);
      }
    }

    verifyModeratorAccess();
  }, [token]);

  // Moderation state
  const [activeGames, setActiveGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [moderationData, setModerationData] = useState(null);
  const [characterRegistry, setCharacterRegistry] = useState({});

  // Load characters registry
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

  // Poll active games list every 2000ms when not inspecting a specific game
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchActiveGames = async () => {
      try {
        const res = await fetch('/api/games/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data)) setActiveGames(data);
        }
      } catch (err) {}
    };

    fetchActiveGames();
    const interval = setInterval(fetchActiveGames, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // Poll moderation state for selected game every 1000ms
  useEffect(() => {
    if (!token || !selectedGameId) return;

    let isMounted = true;
    const pollMod = async () => {
      try {
        const res = await fetch(`/api/games/${selectedGameId}/moderation-state`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setModerationData(data);
        }
      } catch (err) {}
    };

    pollMod();
    const interval = setInterval(pollMod, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, selectedGameId]);

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
      localStorage.setItem('zync_moderator_token', data.token);
      localStorage.setItem('zync_moderator_user', JSON.stringify(data.user));
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zync_moderator_token');
    localStorage.removeItem('zync_moderator_user');
    setToken(null);
    setUser(null);
    setSelectedGameId(null);
    setModerationData(null);
  };

  // Moderation action handlers
  const handleAdmit = async (playerId, all = false) => {
    if (!selectedGameId) return;
    try {
      await fetch('/api/moderation/admit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: selectedGameId, playerId, all })
      });
    } catch (err) {}
  };

  const handleDecline = async (playerId) => {
    try {
      await fetch('/api/moderation/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ playerId })
      });
    } catch (err) {}
  };

  const handleToggleCommenting = async (playerId, canComment) => {
    if (!selectedGameId) return;
    try {
      await fetch('/api/moderation/toggle-commenting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: selectedGameId, playerId, canComment })
      });
    } catch (err) {}
  };

  const handleWarnStudent = async (playerId) => {
    if (!selectedGameId) return;
    try {
      await fetch('/api/moderation/warn-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId: selectedGameId,
          playerId,
          note: 'Class Monitor strike'
        })
      });
    } catch (err) {}
  };

  const handlePlayerAction = async (playerId, action) => {
    if (!selectedGameId) return;
    try {
      await fetch('/api/moderation/player-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: selectedGameId, playerId, action })
      });
    } catch (err) {}
  };

  const handleRemoveComment = async (commentId) => {
    if (!selectedGameId) return;
    try {
      await fetch('/api/moderation/remove-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId: selectedGameId,
          commentId,
          note: 'Removed by moderator'
        })
      });
    } catch (err) {}
  };

  const handlePauseResumeGame = async (isPaused) => {
    if (!selectedGameId) return;
    try {
      const endpoint = isPaused ? '/api/moderation/resume' : '/api/moderation/pause';
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: selectedGameId })
      });
    } catch (err) {}
  };

  const handleNextQuestion = async () => {
    if (!selectedGameId) return;
    try {
      await fetch('/api/moderation/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: selectedGameId })
      });
    } catch (err) {}
  };

  const handleEndGame = async () => {
    if (!selectedGameId) return;
    if (!confirm('End this quiz session for all players?')) return;
    try {
      await fetch('/api/moderation/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: selectedGameId })
      });
      setSelectedGameId(null);
    } catch (err) {}
  };

  const allowedModeratorRoles = ['moderator', 'admin'];
  const userRole = (user?.role || '').toLowerCase();

  // 1. Redirect if unauthenticated
  if (!token) {
    if (window.location.port === '5174') {
      window.location.href = `http://${window.location.hostname}:5172/?redirect=${encodeURIComponent(`http://${window.location.hostname}:5174`)}`;
      return null;
    }
    if (window.location.pathname !== '/' || !window.location.search.includes('redirect')) {
      window.location.href = '/?redirect=/moderator';
      return null;
    }
    return null;
  }

  // 2. Immediate local block if authenticated user lacks Moderator permission
  if (user && !allowedModeratorRoles.includes(userRole)) {
    if (window.location.port === '5174') {
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
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Moderator access...</span>
        </div>
      </div>
    );
  }

  // 4. Final check after server verification
  if (!user || !allowedModeratorRoles.includes((user.role || '').toLowerCase())) {
    if (window.location.port === '5174') {
      window.location.href = `http://${window.location.hostname}:5172`;
    } else {
      window.location.href = '/';
    }
    return null;
  }

  // 2. Room Supervision Console (When inspecting a room)
  if (selectedGameId && moderationData) {
    const { game, quiz, waitingPlayers, players, comments, logs } = moderationData;
    const isPaused = game?.status === 'paused';

    return (
      <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden select-none">
        {/* React Bits: Squares Interactive Drift Grid (Purple Cubic Theme) */}
        <Squares
          direction="diagonal"
          speed={0.35}
          squareSize={44}
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(168, 85, 247, 0.22)"
        />

        {/* Top Navbar */}
        <PortalSwitcher current="moderator" currentUser={user} />
        <header className="relative z-10 h-16 flex items-center justify-between px-6 sm:px-8 bg-[#121214]/85 backdrop-blur-2xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedGameId(null)}
              className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
              title="Return to Active Quizzes"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                <ShieldAlert size={18} strokeWidth={2} />
              </div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <ShinyText text="ZYNC" speed={3} />
                <span className="text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Room PIN {game?.pin}
                </span>
              </span>
            </div>
          </div>

          {/* Supervisor Game Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handlePauseResumeGame(isPaused)}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                isPaused
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
              }`}
            >
              {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="h-10 px-4 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={handleEndGame}
              className="h-10 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition cursor-pointer"
            >
              End
            </button>

            <button
              onClick={() => setSelectedGameId(null)}
              className="h-10 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-bold transition cursor-pointer"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Supervisor Main Stage */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 z-10 overflow-y-auto">
          {/* Status Header Bar */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'} shadow-[0_0_10px_currentColor]`} />
                <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-bold">
                  Status: {game?.status} {isPaused ? '(Paused by Supervisor)' : ''}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">{quiz?.title || 'Classroom Quiz Session'}</h1>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10">
                Question: {(game?.currentIndex || 0) + 1} / {quiz?.totalQuestions || 1}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10">
                Players: {players?.length || 0}
              </span>
            </div>
          </div>

          {/* Admission Queue (If students are waiting in lobby) */}
          {waitingPlayers && waitingPlayers.length > 0 && (
            <div className="bg-amber-500/10 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck size={20} className="text-amber-400" />
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-amber-300">
                    Admission Queue ({waitingPlayers.length} Waiting)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdmit(null, true)}
                  className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition cursor-pointer"
                >
                  Admit All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {waitingPlayers.map((wp) => (
                  <div
                    key={wp._id}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CharacterAvatar
                        config={wp.avatarConfig}
                        mode="bust"
                        size={32}
                        characterRegistry={characterRegistry}
                      />
                      <span className="text-sm font-bold text-white truncate">{wp.nickname}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdmit(wp._id)}
                        className="h-8 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition cursor-pointer"
                      >
                        Admit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(wp._id)}
                        className="h-8 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2-Column Split: Active Players Roster & Live Comments / Audit Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active Players Roster with Class Monitor Controls (7 cols) */}
            <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-purple-400" />
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white">
                    Class Monitor Roster ({players?.length || 0})
                  </h3>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Live Supervision
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                {players && players.length > 0 ? (
                  players.map((p, idx) => (
                    <div
                      key={p._id}
                      className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/10 text-neutral-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <CharacterAvatar
                          config={p.avatarConfig}
                          mode="bust"
                          size={38}
                          characterRegistry={characterRegistry}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                            <span>{p.nickname}</span>
                            {p.canComment === false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold">
                                Muted
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 font-mono">
                            Score: {p.score || 0} pts &bull; Strikes: {p.warningCount || 0}/3
                          </div>
                        </div>
                      </div>

                      {/* Moderator Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Toggle Commenting Access */}
                        <button
                          type="button"
                          onClick={() => handleToggleCommenting(p._id, p.canComment === false)}
                          className={`h-8 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            p.canComment === false
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                          }`}
                          title={p.canComment === false ? 'Restore Commenting' : 'Revoke Commenting'}
                        >
                          {p.canComment === false ? <Volume2 size={13} /> : <VolumeX size={13} />}
                          <span>{p.canComment === false ? 'Unmute' : 'Mute'}</span>
                        </button>

                        {/* Warn Student */}
                        <button
                          type="button"
                          onClick={() => handleWarnStudent(p._id)}
                          className="h-8 px-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs font-bold transition cursor-pointer"
                          title="Issue Warning Strike"
                        >
                          <AlertTriangle size={13} />
                        </button>

                        {/* Kick Player */}
                        <button
                          type="button"
                          onClick={() => handlePlayerAction(p._id, 'kick')}
                          className="h-8 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                          title="Kick from game"
                        >
                          <UserX size={13} />
                        </button>

                        {/* Ban Player */}
                        <button
                          type="button"
                          onClick={() => handlePlayerAction(p._id, 'ban')}
                          className="h-8 px-2 rounded-lg bg-red-600/30 hover:bg-red-600/40 border border-red-500/50 text-red-200 text-xs font-bold transition cursor-pointer"
                          title="Permanent Ban"
                        >
                          <Ban size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-neutral-500 text-xs">
                    No active players in room yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Comments Feed & Audit Log (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Comments Feed */}
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-400" />
                    <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white">
                      Live Comments
                    </h3>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    Danmaku Stream
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[260px] pr-1">
                  {comments && comments.length > 0 ? (
                    comments.map((c) => (
                      <div
                        key={c._id}
                        className={`p-3 rounded-2xl border text-xs transition flex items-start justify-between gap-3 ${
                          c.removed
                            ? 'bg-rose-500/5 border-rose-500/20 opacity-50'
                            : 'bg-white/[0.04] border-white/10'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-purple-300 mr-1.5">{c.author}:</span>
                          <span className={c.removed ? 'line-through text-neutral-500' : 'text-white'}>
                            {c.text}
                          </span>
                        </div>

                        {!c.removed && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveComment(c._id)}
                              className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                              title="Delete Comment"
                            >
                              <Trash2 size={13} />
                            </button>
                            {c.playerId && (
                              <button
                                type="button"
                                onClick={() => handleToggleCommenting(c.playerId, false)}
                                className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition cursor-pointer"
                                title="Mute Author"
                              >
                                <VolumeX size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-neutral-500 text-xs">
                      No live comments posted yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Moderation Audit Log */}
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <Activity size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-wider uppercase font-mono text-white">
                    Audit Log
                  </h3>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[180px] text-xs font-mono pr-1">
                  {logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <div key={log._id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-neutral-300">
                        <span className="text-purple-400 font-bold">[{log.action}]</span> {log.note || 'Action taken'}
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-neutral-500 text-xs">
                      No moderation actions logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Active Quizzes Browser (Home Screen)
  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden select-none">
      {/* Universal Top Role-Based Portal Switcher */}
      <PortalSwitcher current="moderator" currentUser={user} />

      {/* React Bits: Squares Interactive Drift Grid (Purple Cubic Theme) */}
      <Squares
        direction="diagonal"
        speed={0.35}
        squareSize={44}
        borderColor="rgba(255, 255, 255, 0.04)"
        hoverFillColor="rgba(168, 85, 247, 0.22)"
      />

      {/* Ambient Top Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none z-1" />

      {/* Top Navbar */}
      <header className="relative z-10 h-16 flex items-center justify-between px-6 sm:px-8 bg-[#121214]/85 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <ShieldAlert size={18} strokeWidth={2} />
          </div>
          <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            <ShinyText text="ZYNC" speed={3} />
            <span className="text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Moderator
            </span>
          </span>
        </div>
      </header>

      {/* Main Content: Live Games Browser */}
      <main className="flex-1 p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6 z-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Live Rooms</h1>
          <p className="text-xs sm:text-sm text-white/50 font-medium">
            Monitor ongoing quiz sessions, manage student permissions, and supervise live commentary
          </p>
        </div>

        {/* Live Quizzes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeGames.length > 0 ? (
            activeGames.map((g) => (
              <div
                key={g._id}
                className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 border border-white/10 hover:border-purple-500/40 transition shadow-2xl flex flex-col justify-between group space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-mono font-black text-purple-400 bg-purple-500/10 px-3.5 py-1 rounded-xl border border-purple-500/20">
                      PIN {g.pin}
                    </span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                      g.status === 'paused'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : g.status === 'lobby'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {g.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition line-clamp-1">
                      {g.refId?.title || 'Interactive Session'}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                      Host: {g.hostId?.name || 'Presentor'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGameId(g._id)}
                  className="w-full h-12 bg-white/[0.06] hover:bg-purple-600 hover:text-white border border-white/10 hover:border-purple-500 text-white font-extrabold rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg shadow-black/40"
                >
                  <ShieldAlert size={16} />
                  <span>Supervise</span>
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-neutral-500 space-y-3">
              <ShieldAlert size={36} className="mx-auto text-neutral-600" />
              <p className="text-sm">No active quiz sessions currently live.</p>
              <p className="text-xs text-neutral-600">When a presentor launches a quiz arena, it will appear here instantly.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
