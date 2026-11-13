import React, { useState, useEffect, useRef, useMemo } from 'react';
import ShinyText from './reactbits/ShinyText';
import {
  Settings,
  X,
  Layers,
  User,
  Key,
  LogOut,
  Shield,
  Palette,
  Presentation,
  ShieldAlert,
  Gamepad2,
  Lock,
  Check,
  ChevronRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

/**
 * Universal ZYNC Navigation & Settings Component:
 * 1. Fixed Top-Middle: React Bits ShinyText ZYNC Branding.
 * 2. Fixed Top-Right: Noticeable Settings Icon Button (no colored orb).
 * 3. Centered Floating Modal Box:
 *    - Red 'X' Close Button on Top-Right.
 *    - User Info (Username, Role - No Emails).
 *    - Transitions into Modes/Portals (all 5 visible; click opens fresh portal with same account).
 *    - Transitions into Change Username Form.
 *    - Transitions into Change Password Form.
 *    - Sign Out.
 */
export default function PortalSwitcher({ current = 'admin', currentUser = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState('menu'); // 'menu' | 'modes' | 'change-username' | 'change-password'
  
  // Change Username State
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null);

  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  // Access notice
  const [accessDeniedNotice, setAccessDeniedNotice] = useState(null);

  // Retrieve user from props or localStorage
  const [user, setUser] = useState(() => {
    if (currentUser) return currentUser;
    try {
      const stored = localStorage.getItem('zync_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser]);

  const token = useMemo(() => {
    return (
      localStorage.getItem('zync_token') ||
      localStorage.getItem('zync_admin_token') ||
      localStorage.getItem('zync_creator_token') ||
      localStorage.getItem('zync_teacher_token') ||
      localStorage.getItem('zync_moderator_token') ||
      ''
    );
  }, []);

  const rawRole = (user?.role || 'admin').toLowerCase();

  // All 5 ZYNC Modes - All 5 are visible to everyone
  // Renamed Student -> User
  const ALL_PORTALS = [
    {
      id: 'admin',
      name: 'Admin',
      badge: 'Control Center',
      path: '/admin',
      port: 5171,
      roles: ['admin'],
      icon: Shield,
      accent: '#38BDF8',
      activeClass: 'border-sky-500/50 bg-sky-500/15 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
    },
    {
      id: 'creator',
      name: 'Creator',
      badge: 'Quizzes & Avatars',
      path: '/creator',
      port: 5175,
      roles: ['creator', 'principal', 'admin'],
      icon: Palette,
      accent: '#06B6D4',
      activeClass: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
    },
    {
      id: 'presentor',
      name: 'Presenter',
      badge: 'Live Arena',
      path: '/presentor',
      port: 5173,
      roles: ['presentor', 'teacher', 'admin'],
      icon: Presentation,
      accent: '#10B981',
      activeClass: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
    },
    {
      id: 'moderator',
      name: 'Moderator',
      badge: 'Room Supervisor',
      path: '/moderator',
      port: 5174,
      roles: ['moderator', 'admin'],
      icon: ShieldAlert,
      accent: '#A855F7',
      activeClass: 'border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    },
    {
      id: 'user',
      name: 'User',
      badge: 'Game Pad',
      path: '/',
      port: 5172,
      roles: ['user', 'student', 'admin', 'creator', 'principal', 'presentor', 'teacher', 'moderator'],
      icon: Gamepad2,
      accent: '#5E5CE6',
      activeClass: 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300 shadow-[0_0_15px_rgba(94,92,230,0.2)]'
    }
  ];

  // Normalized current ID
  const normalizedCurrent = (current === 'presenter' ? 'presentor' : current).toLowerCase();

  // If user is not logged in, don't show the controls
  if (!user && !token) {
    return null;
  }

  const handlePortalClick = (p) => {
    const isCurrent = p.id === normalizedCurrent;
    if (isCurrent) {
      setIsOpen(false);
      return;
    }

    const isAuthorized = p.roles.includes(rawRole);
    if (!isAuthorized) {
      setAccessDeniedNotice(`Locked: The ${p.name} module requires ${p.roles.map(r => r.toUpperCase()).join(' or ')} permission.`);
      setTimeout(() => setAccessDeniedNotice(null), 4000);
      return;
    }

    const isMultiPortDev = ['5171', '5172', '5173', '5174', '5175'].includes(window.location.port);
    if (isMultiPortDev) {
      const userStr = user ? JSON.stringify(user) : '';
      window.location.href = `http://${window.location.hostname}:${p.port}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userStr)}`;
    } else {
      window.location.href = p.path;
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameStatus(null);

    const clean = newUsername.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus({ type: 'error', message: 'Username cannot be empty.' });
      return;
    }
    if (!/^[a-z0-9_]{3,24}$/.test(clean)) {
      setUsernameStatus({ type: 'error', message: 'Username must be 3-24 characters (letters, numbers, underscore only).' });
      return;
    }

    setUsernameLoading(true);
    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername: clean })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to update username');
      }

      setUsernameStatus({ type: 'success', message: 'Username updated successfully!' });
      const updatedUser = data.user || { ...user, username: clean, name: clean };
      setUser(updatedUser);
      localStorage.setItem('zync_user', JSON.stringify(updatedUser));
      setNewUsername('');
      setTimeout(() => {
        setActiveView('menu');
        setUsernameStatus(null);
      }, 1500);
    } catch (err) {
      setUsernameStatus({ type: 'error', message: err.message });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword || newPassword.length < 4) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 4 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword, confirmPassword })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.error) || 'Failed to update password');
      }

      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setActiveView('menu');
        setPasswordStatus(null);
      }, 1500);
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('zync_token');
    localStorage.removeItem('zync_user');
    localStorage.removeItem('zync_admin_token');
    localStorage.removeItem('zync_creator_token');
    localStorage.removeItem('zync_teacher_token');
    localStorage.removeItem('zync_moderator_token');
    localStorage.removeItem('zync_student_token');

    const isMultiPortDev = ['5171', '5172', '5173', '5174', '5175'].includes(window.location.port);
    if (isMultiPortDev) {
      window.location.href = `http://${window.location.hostname}:5172`;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* =========================================================
          1. TOP-MIDDLE REACT BITS SHINY ZYNC
      ========================================================= */}
      <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center justify-center select-none">
        <ShinyText
          text="ZYNC"
          speed={3}
          className="text-xl sm:text-2xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]"
        />
      </div>

      {/* =========================================================
          2. TOP-RIGHT NOTICEABLE SETTINGS BUTTON (NO ORB)
      ========================================================= */}
      <div className="fixed top-3.5 right-4 z-50 select-none">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setActiveView('menu');
            setAccessDeniedNotice(null);
          }}
          className="group w-11 h-11 rounded-2xl bg-[#121214]/90 hover:bg-[#1f1f24] border border-white/20 hover:border-white/40 backdrop-blur-2xl shadow-2xl flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer active:scale-95 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          title="Settings & Portal Switcher"
        >
          <Settings size={22} className="transition-transform duration-300 group-hover:rotate-45 text-neutral-200 group-hover:text-white" />
        </button>
      </div>

      {/* =========================================================
          3. CENTERED FLOATING SETTINGS MODAL WINDOW
      ========================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150 select-none">
          <div className="w-full max-w-md bg-[#121214]/98 border border-white/20 backdrop-blur-3xl rounded-3xl p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative text-white space-y-5 animate-in zoom-in-95 duration-200">
            {/* Red Cross Close Button on Top-Right */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
              title="Close Settings"
            >
              <X size={16} strokeWidth={2.5} />
            </button>

            {/* User Account Info Header (No Email) */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/10 pr-10">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5E5CE6] to-[#06B6D4] flex items-center justify-center font-black text-base text-white shadow-lg shrink-0">
                {(user?.username || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-base font-extrabold text-white truncate leading-tight">
                  {user?.username || user?.name || 'User'}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 border border-white/10">
                    {rawRole === 'student' ? 'USER' : rawRole.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Active Mode: <span className="text-white capitalize">{normalizedCurrent === 'presentor' ? 'Presenter' : normalizedCurrent}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Access Denied Warning Toast */}
            {accessDeniedNotice && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span className="leading-snug">{accessDeniedNotice}</span>
              </div>
            )}

            {/* VIEW 1: MAIN MENU */}
            {activeView === 'menu' && (
              <div className="space-y-2.5">
                {/* 1. Modes & Portals Button */}
                <button
                  type="button"
                  onClick={() => setActiveView('modes')}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0">
                      <Layers size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        Modes & Portals
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        Switch active workspace (5 modes)
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                </button>

                {/* 2. Change Username Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('change-username');
                    setNewUsername('');
                    setUsernameStatus(null);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Change Username
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        Update account login credential
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                </button>

                {/* 3. Change Password Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('change-password');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordStatus(null);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                      <Key size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        Change Password
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        Update account login password
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
                </button>

                {/* 4. Sign Out Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full h-11 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-300 hover:text-red-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: MODES / PORTALS LIST */}
            {activeView === 'modes' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveView('menu')}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
                    title="Back to Menu"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Select Mode / Portal
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {ALL_PORTALS.map((portal) => {
                    const isCurrent = portal.id === normalizedCurrent;
                    const isAuthorized = portal.roles.includes(rawRole);
                    const IconComponent = portal.icon;

                    return (
                      <button
                        key={portal.id}
                        type="button"
                        onClick={() => handlePortalClick(portal)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left ${
                          isCurrent
                            ? `${portal.activeClass} font-bold`
                            : isAuthorized
                            ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20 text-neutral-200 cursor-pointer'
                            : 'bg-white/[0.01] border-white/[0.05] text-neutral-500 opacity-40 hover:opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isCurrent
                                ? 'border-white/20 text-white'
                                : isAuthorized
                                ? 'bg-white/[0.05] border-white/10 text-neutral-300'
                                : 'bg-white/[0.02] border-white/[0.05] text-neutral-600'
                            }`}
                            style={isCurrent ? { backgroundColor: `${portal.accent}30` } : {}}
                          >
                            <IconComponent size={16} />
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                              <span>{portal.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/20 text-white">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 truncate">
                              {portal.badge}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center pl-2">
                          {isCurrent ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : isAuthorized ? (
                            <ChevronRight size={16} className="text-neutral-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/5">
                              <Lock size={10} />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: CHANGE USERNAME */}
            {activeView === 'change-username' && (
              <form onSubmit={handleUsernameSubmit} className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveView('menu')}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
                    title="Back to Menu"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Change Username
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-neutral-400">
                  Current Username: <span className="text-white font-mono font-bold">{user?.username}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                    New Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="3-24 characters, letters/numbers/underscore"
                    className="w-full h-10 px-3.5 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-mono tracking-wide"
                    required
                    autoFocus
                  />
                </div>

                {usernameStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs leading-tight flex items-center gap-2 ${
                      usernameStatus.type === 'success'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {usernameStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{usernameStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveView('menu')}
                    className="flex-1 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={usernameLoading}
                    className="flex-1 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                  >
                    {usernameLoading ? 'Updating...' : 'Save Username'}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: CHANGE PASSWORD */}
            {activeView === 'change-password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveView('menu')}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition cursor-pointer"
                    title="Back to Menu"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Change Password
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full h-10 px-3.5 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono tracking-wide"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full h-10 px-3.5 rounded-xl bg-white/[0.05] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono tracking-wide"
                    required
                  />
                </div>

                {passwordStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs leading-tight flex items-center gap-2 ${
                      passwordStatus.type === 'success'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {passwordStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveView('menu')}
                    className="flex-1 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20"
                  >
                    {passwordLoading ? 'Updating...' : 'Save Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
