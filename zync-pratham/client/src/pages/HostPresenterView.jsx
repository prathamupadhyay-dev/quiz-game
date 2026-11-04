import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function HostPresenterView() {
  const { roomPin } = useParams();
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Host Slide Presenter (Room: {roomPin})</h1>
      <p className="text-slate-400 mb-6">Phase 2: PDF synchronization, Danmaku barrage & confused count</p>
      <Link to={`/host/${roomPin}`} className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold">
        Return to Lobby
      </Link>
    </div>
  );
}
