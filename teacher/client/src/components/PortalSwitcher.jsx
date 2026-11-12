import React from 'react';

/**
 * Universal ZYNC Portal Switcher
 * Allows instant navigation between User, Admin, Creator, Presentor, and Moderator portals.
 * Intelligently routes by port on localhost and by path in production.
 */
export default function PortalSwitcher({ current = 'user' }) {
  const portals = [
    { id: 'user', label: 'User', path: '/', port: 5172, activeClass: 'text-indigo-300 border-indigo-500/40 bg-indigo-500/20 shadow-[0_0_12px_rgba(94,92,230,0.3)]' },
    { id: 'admin', label: 'Admin', path: '/admin', port: 5171, activeClass: 'text-sky-300 border-sky-500/40 bg-sky-500/20 shadow-[0_0_12px_rgba(56,189,248,0.3)]' },
    { id: 'creator', label: 'Creator', path: '/creator', port: 5175, activeClass: 'text-cyan-300 border-cyan-500/40 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.3)]' },
    { id: 'presentor', label: 'Presentor', path: '/presentor', port: 5173, activeClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.3)]' },
    { id: 'moderator', label: 'Moderator', path: '/moderator', port: 5174, activeClass: 'text-purple-300 border-purple-500/40 bg-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.3)]' }
  ];

  const handleSwitch = (p) => {
    if (p.id === current) return;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      window.location.href = `http://${window.location.hostname}:${p.port}`;
    } else {
      window.location.href = p.path;
    }
  };

  return (
    <div className="w-full flex flex-col items-center mb-4">
      <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10 w-full max-w-sm backdrop-blur-xl">
        {portals.map((p) => {
          const isActive = p.id === current;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSwitch(p)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer text-center select-none ${
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
    </div>
  );
}
