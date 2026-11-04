import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PlayerPresenterView() {
  const { roomPin } = useParams();
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Player Slide Companion (Room: {roomPin})</h1>
      <p className="text-slate-400 mb-6">Phase 2: Synced slide view, Danmaku sender & Confused button</p>
      <Link to={`/player/${roomPin}`} className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold">
        Return to Lobby
      </Link>
    </div>
  );
}
