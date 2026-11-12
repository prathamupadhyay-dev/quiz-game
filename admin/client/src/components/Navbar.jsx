import React from 'react';
import { Menu, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ShinyText from './reactbits/ShinyText';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-[#121214]/85 backdrop-blur-2xl fixed top-0 left-0 right-0 z-40 px-4 md:px-6 flex items-center justify-between border-b border-white/10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="min-[900px]:hidden w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.05] border border-white/10 text-neutral-300 hover:text-white"
          aria-label="Toggle navigation"
        >
          <Menu size={18} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5E5CE6] to-[#06B6D4] flex items-center justify-center text-white shadow-md shadow-[#5E5CE6]/30">
            <Shield size={18} strokeWidth={2} />
          </div>
          <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            <ShinyText text="ZYNC" speed={3} />
            <span className="text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5 bg-white/[0.05] px-4 py-2 rounded-2xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]"></span>
            <span className="text-xs font-bold text-white">{user.name || user.email}</span>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="h-10 px-4 rounded-2xl bg-white/[0.05] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-neutral-300 hover:text-red-400 font-bold text-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
          title="Sign Out"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
