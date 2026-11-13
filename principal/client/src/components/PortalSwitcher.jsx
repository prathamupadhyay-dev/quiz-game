import React, { useMemo } from 'react';

/**
 * Universal Role-Based ZYNC Portal Switcher
 * Only visible AFTER login.
 * Dynamically filters visible portals based on the authenticated user's role and permissions.
 */
export default function PortalSwitcher({ current = 'user', currentUser = null }) {
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

  const rawRole = (user?.role || '').toLowerCase();

  // All portal definitions
  const allPortals = [
    { id: 'admin', label: 'Admin', path: '/admin', port: 5171, activeClass: 'text-sky-300 border-sky-500/40 bg-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.3)]' },
    { id: 'creator', label: 'Creator', path: '/creator', port: 5175, activeClass: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.3)]' },
    { id: 'presentor', label: 'Presentor', path: '/presentor', port: 5173, activeClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]' },
    { id: 'moderator', label: 'Moderator', path: '/moderator', port: 5174, activeClass: 'text-purple-300 border-purple-500/40 bg-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
    { id: 'user', label: 'Student', path: '/', port: 5172, activeClass: 'text-indigo-300 border-indigo-500/40 bg-indigo-500/20 shadow-[0_0_12px_rgba(94,92,230,0.3)]' }
  ];

  // Determine authorized portal IDs based on user's role
  const authorizedPortals = useMemo(() => {
    if (!user) return [];

    if (rawRole === 'admin') {
      // Super admin can access every single portal
      return allPortals;
    }
    if (rawRole === 'creator' || rawRole === 'principal') {
      return allPortals.filter(p => p.id === 'creator' || p.id === 'user');
    }
    if (rawRole === 'presentor' || rawRole === 'teacher') {
      return allPortals.filter(p => p.id === 'presentor' || p.id === 'user');
    }
    if (rawRole === 'moderator') {
      return allPortals.filter(p => p.id === 'moderator' || p.id === 'user');
    }
    // Normal students only have access to Student / User
    return allPortals.filter(p => p.id === 'user');
  }, [user, rawRole]);

  // If user is not logged in, or is a normal student with only 1 portal, don't show the switcher bar
  if (!user || authorizedPortals.length <= 1) {
    return null;
  }

  const handleSwitch = (p) => {
    if (p.id === current) return;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      window.location.href = `http://${window.location.hostname}:${p.port}`;
    } else {
      window.location.href = p.path;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zync_token');
    localStorage.removeItem('zync_user');
    localStorage.removeItem('zync_admin_token');
    localStorage.removeItem('zync_creator_token');
    localStorage.removeItem('zync_teacher_token');
    localStorage.removeItem('zync_moderator_token');
    localStorage.removeItem('zync_student_token');
    window.location.href = '/';
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-black/60 border-b border-white/10 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
        <span className="text-[11px] font-mono font-bold text-neutral-300">
          Logged in as <span className="text-white font-extrabold">{user.username || user.name}</span>
          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-neutral-300 uppercase tracking-wider font-mono">
            {user.role}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
        {authorizedPortals.map((p) => {
          const isActive = p.id === current;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSwitch(p)}
              className={`py-1 px-2.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer text-center select-none ${
                isActive
                  ? `${p.activeClass} border font-black`
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="px-2.5 py-1 text-[11px] font-mono font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
        title="Sign Out"
      >
        Sign Out
      </button>
    </div>
  );
}
