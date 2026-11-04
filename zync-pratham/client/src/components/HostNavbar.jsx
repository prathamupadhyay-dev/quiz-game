import React from 'react';
import { Link } from 'react-router-dom';

export default function HostNavbar({ roomPin, mode, playersCount = 0 }) {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-lg">
          <span className="text-2xl">🎓</span>
          <span>Classroom Arena</span>
        </Link>
        {mode && (
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
            {mode === 'quiz' ? '🎯 10-Question Quiz' : '📊 Slide Presenter'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {roomPin && (
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs uppercase text-slate-400 font-semibold">PIN:</span>
            <span className="font-mono text-xl font-extrabold text-amber-400 tracking-wider">
              {roomPin}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-sm font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{playersCount} Joined</span>
        </div>
      </div>
    </header>
  );
}
