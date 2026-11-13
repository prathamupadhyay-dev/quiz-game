import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Palette,
  Presentation,
  ShieldAlert,
  Gamepad2,
  Lock,
  Check,
  Key,
  LogOut,
  ChevronDown,
  ChevronRight,
  Layers,
  AlertCircle,
  X
} from 'lucide-react';

/**
 * Universal Fixed Top-Right ZYNC Control Pod & Portal Switcher
 * Unified across all 5 modules for seamless visual transitions.
 * Shows fixed control box, all 5 modes with access permission locks,
 * change password modal/panel, and clean single sign out.
 */
export default function PortalSwitcher({ current = 'user', currentUser = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState(null);

  const podRef = useRef(null);

  // Retrieve user from props or localStorage
  const user = useMemo(() => {
    if (currentUser) return currentUser;
    try {
      const stored = localStorage.getItem('zync_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
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

  const rawRole = (user?.role || 'user').toLowerCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (podRef.current && !podRef.current.contains(e.target)) {
        setIsOpen(false);
        setAccessDeniedNotice(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // All 5 ZYNC Modes - All 5 are visible to everyone
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
      name: 'Student',
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

  // Color theme for trigger button
  const currentPortalConfig = ALL_PORTALS.find((p) => p.id === normalizedCurrent) || ALL_PORTALS[4];

  // Don't render if not logged in
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
      setAccessDeniedNotice(`Locked: The ${p.name} module requires ${p.roles.map(r => r.toUpperCase()).join(' or ')} access.`);
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
        setShowPasswordForm(false);
        setPasswordStatus(null);
      }, 2000);
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
    <div ref={podRef} className="fixed top-3.5 right-4 z-50 select-none">
      {/* =========================================================
          FIXED TRIGGER BOX / PILL (CONSISTENT ON ALL 5 SCREENS)
      ========================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 h-10 px-3 rounded-2xl bg-[#121214]/90 hover:bg-[#1c1c20] border border-white/15 hover:border-white/30 backdrop-blur-2xl shadow-2xl transition-all cursor-pointer active:scale-95"
        title="Account & Portal Modes"
      >
        {/* Glow indicator orb */}
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"
          style={{ backgroundColor: currentPortalConfig.accent, color: currentPortalConfig.accent }}
        />

        {/* Username */}
        <span className="text-xs font-black tracking-tight text-white max-w-[110px] truncate">
          {user?.username || user?.name || 'Account'}
        </span>

        {/* Current Portal Badge */}
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white/[0.08] text-neutral-300 border border-white/10 hidden sm:inline-block">
          {rawRole}
        </span>

        {/* Chevron Icon */}
        <ChevronDown
          size={14}
          className={`text-neutral-400 group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* =========================================================
          EXPANDED CONTROL POD WINDOW
      ========================================================= */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-80 max-w-[calc(100vw-2rem)] bg-[#121214]/98 border border-white/15 backdrop-blur-3xl rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3.5">
          {/* Header Info */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-black shadow-md shrink-0"
                style={{ backgroundColor: currentPortalConfig.accent }}
              >
                {(user?.username || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {user?.username || user?.name || 'Pratham'}
                </div>
                <div className="text-[10px] font-mono text-neutral-400 truncate">
                  {user?.email || `${user?.username || 'user'}@zync.local`}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10 shrink-0">
              {rawRole}
            </span>
          </div>

          {/* Access Denied Toast inside pod */}
          {accessDeniedNotice && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span className="leading-snug">{accessDeniedNotice}</span>
            </div>
          )}

          {/* Mode Switcher: All 5 Modes Visible */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Layers size={12} className="text-neutral-400" />
                <span>Modes & Portals</span>
              </span>
              <span className="text-[10px] text-neutral-500">5 Available</span>
            </div>

            <div className="flex flex-col gap-1">
              {ALL_PORTALS.map((portal) => {
                const isCurrent = portal.id === normalizedCurrent;
                const isAuthorized = portal.roles.includes(rawRole);
                const IconComponent = portal.icon;

                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => handlePortalClick(portal)}
                    className={`w-full flex items-center justify-between p-2 rounded-2xl border transition-all text-left ${
                      isCurrent
                        ? `${portal.activeClass} font-bold`
                        : isAuthorized
                        ? 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-white/20 text-neutral-200 cursor-pointer'
                        : 'bg-white/[0.01] border-white/[0.05] text-neutral-500 opacity-50 hover:opacity-80 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCurrent
                            ? 'border-white/20 text-white'
                            : isAuthorized
                            ? 'bg-white/[0.05] border-white/10 text-neutral-300'
                            : 'bg-white/[0.02] border-white/[0.05] text-neutral-600'
                        }`}
                        style={isCurrent ? { backgroundColor: `${portal.accent}30` } : {}}
                      >
                        <IconComponent size={14} />
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                          <span>{portal.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/20 text-white">
                              Active
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
                        <Check size={14} className="text-emerald-400" />
                      ) : isAuthorized ? (
                        <ChevronRight size={14} className="text-neutral-500" />
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/5">
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

          {/* Change Password Accordion */}
          <div className="border-t border-white/10 pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPasswordStatus(null);
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Key size={14} className="text-amber-400" />
                <span>Change Password</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-neutral-400 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`}
              />
            </button>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-2 p-3 rounded-2xl bg-black/40 border border-white/10">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                {passwordStatus && (
                  <div
                    className={`p-2 rounded-lg text-[11px] leading-tight flex items-center gap-1.5 ${
                      passwordStatus.type === 'success'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {passwordStatus.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Single Universal Sign Out Button */}
          <div className="border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full h-9 rounded-2xl bg-white/[0.04] hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-neutral-300 hover:text-red-400 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
