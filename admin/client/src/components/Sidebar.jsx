import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Presentation,
  Gamepad2,
  Sparkles,
  Layers,
  Settings,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { path: '/games', label: 'Games', icon: Gamepad2 },
  { path: '/avatars', label: 'Characters', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="min-[900px]:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-[260px] bg-[#121214]/90 backdrop-blur-3xl border-r border-white/10 z-40 flex flex-col transition-transform duration-250 ease-ios ${
          isOpen ? 'translate-x-0' : '-translate-x-full min-[900px]:translate-x-0'
        }`}
      >
        <div className="min-[900px]:hidden flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-neutral-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `h-12 flex items-center gap-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/25 to-blue-500/20 text-white border border-indigo-400/40 shadow-lg shadow-indigo-500/20 font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs text-neutral-500 font-mono">
          ZYNC Admin &bull; 2.0
        </div>
      </aside>
    </>
  );
}
