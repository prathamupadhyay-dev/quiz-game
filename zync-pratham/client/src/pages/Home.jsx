import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import socket from '../socket';
import AvatarPicker from '../components/AvatarPicker';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Student form state
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('adventurer');
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(2, 8));
  const [studentError, setStudentError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Host modal state
  const [showHostModal, setShowHostModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState('quiz'); // 'quiz' | 'presenter'
  const [isCreatingHost, setIsCreatingHost] = useState(false);

  // Auto-fill PIN if user opened link via QR code (?pin=XXXXXX)
  useEffect(() => {
    const pinParam = searchParams.get('pin');
    if (pinParam) {
      setPin(pinParam.toUpperCase());
    }
  }, [searchParams]);

  // Host creates room
  const handleCreateHostRoom = () => {
    setIsCreatingHost(true);
    socket.emit('host:create-room', { mode: selectedMode }, (res) => {
      setIsCreatingHost(false);
      if (res && res.success && res.roomPin) {
        navigate(`/host/${res.roomPin}`);
      } else {
        alert(res?.message || 'Failed to create room. Please ensure server is running.');
      }
    });
  };

  // Student joins room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    setStudentError('');

    const trimmedPin = pin.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setStudentError('Please enter your name.');
      return;
    }
    if (!trimmedPin || trimmedPin.length !== 6) {
      setStudentError('Please enter a valid 6-digit Room PIN.');
      return;
    }

    setIsJoining(true);

    socket.emit(
      'player:join-room',
      {
        roomPin: trimmedPin,
        playerName: trimmedName,
        avatarStyle,
        avatarSeed
      },
      (res) => {
        setIsJoining(false);
        if (res && res.success) {
          // Store player profile locally for page reloads
          sessionStorage.setItem(
            'playerProfile',
            JSON.stringify({
              roomPin: trimmedPin,
              playerName: trimmedName,
              avatarStyle,
              avatarSeed
            })
          );
          navigate(`/player/${trimmedPin}`);
        } else {
          setStudentError(res?.message || 'Could not join room. Check PIN and try again.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
            ⚡
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
              Classroom<span className="text-indigo-400">Arena</span>
            </h1>
            <p className="text-xs text-slate-400 m-0">Live Anti-Cheat Quiz & Slide Presenter</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Server Online</span>
        </div>
      </header>

      {/* Main Grid: Student Join (Phone View) & Host Trigger (Projector View) */}
      <main className="max-w-5xl mx-auto w-full my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Student Join Box (Primary on Mobile) */}
        <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-3 py-1 rounded-full">
                Student Portal
              </span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-1">Join Live Session</h2>
              <p className="text-xs text-slate-400">Enter your nickname & room PIN to participate</p>
            </div>
            <div className="text-3xl">📱</div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-5">
            {/* Avatar Customizer */}
            <AvatarPicker
              style={avatarStyle}
              seed={avatarSeed}
              onStyleChange={setAvatarStyle}
              onSeedChange={setAvatarSeed}
            />

            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                maxLength={20}
                required
                placeholder="e.g. Captain Speed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none transition"
              />
            </div>

            {/* Room PIN */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                6-Digit Room PIN
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-center font-mono text-2xl font-black tracking-widest text-amber-400 placeholder-slate-700 outline-none transition"
              />
            </div>

            {studentError && (
              <div className="bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{studentError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining Room...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Enter Arena</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Host Card (Projector View) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📽️</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 border border-purple-800/60 px-3 py-1 rounded-full">
                  Instructor Mode
                </span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-1">Host Projector View</h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Launch a live room on the classroom projector or big screen. Students scan the QR code to join in real-time with their custom avatars.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <span className="text-indigo-400 text-lg">🛡️</span>
                <span><strong>Anti-Cheat Arena:</strong> Questions appear only on the big screen; student phones become buzzer pads.</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <span className="text-purple-400 text-lg">💬</span>
                <span><strong>Interactive Slides:</strong> Real-time Danmaku bullet comments & confused student counter.</span>
              </div>
            </div>

            <button
              onClick={() => setShowHostModal(true)}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>🖥️</span>
              <span>Launch Host Lobby</span>
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-center justify-between">
            <span>🌐 Wi-Fi Hotspot Ready</span>
            <span className="text-emerald-400 font-mono">Port 5000 / 5173</span>
          </div>
        </div>
      </main>

      {/* Host Mode Selection Modal */}
      {showHostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowHostModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Select Host Session Type</h3>
            <p className="text-xs text-slate-400 mb-6">Choose how you want to run this classroom session</p>

            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Option 1: Quiz */}
              <button
                type="button"
                onClick={() => setSelectedMode('quiz')}
                className={`p-4 rounded-2xl text-left border transition flex items-start gap-4 ${
                  selectedMode === 'quiz'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-3xl p-2 bg-indigo-900/50 rounded-xl">🎯</div>
                <div>
                  <h4 className="font-bold text-base text-white">10-Question Quiz Arena</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Speed-decay scoring, millisecond rankings, and anti-cheat buzzer pads.
                  </p>
                </div>
              </button>

              {/* Option 2: Presenter */}
              <button
                type="button"
                onClick={() => setSelectedMode('presenter')}
                className={`p-4 rounded-2xl text-left border transition flex items-start gap-4 ${
                  selectedMode === 'presenter'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-3xl p-2 bg-purple-900/50 rounded-xl">📊</div>
                <div>
                  <h4 className="font-bold text-base text-white">Live Slide Presenter</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Slide synchronization, flying Danmaku comments, and confused student gauge.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowHostModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingHost}
                onClick={handleCreateHostRoom}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {isCreatingHost ? 'Generating Room...' : 'Start Lobby 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        Classroom Arena • High-Concurrency Real-Time MERN Engine
      </footer>
    </div>
  );
}
