import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function PlayerLobby() {
  const { roomPin } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => {
    try {
      const saved = sessionStorage.getItem('playerProfile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [players, setPlayers] = useState([]);
  const [hostWarning, setHostWarning] = useState('');

  const playerName = profile?.playerName || 'Student';
  const avatarStyle = profile?.avatarStyle || 'adventurer';
  const avatarSeed = profile?.avatarSeed || 'student';
  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

  useEffect(() => {
    if (!roomPin) return;

    // Ensure socket is joined in this room (re-join if refreshed)
    if (profile) {
      socket.emit('player:join-room', {
        roomPin,
        playerName: profile.playerName,
        avatarStyle: profile.avatarStyle,
        avatarSeed: profile.avatarSeed
      });
    }

    // Fetch state
    socket.emit('room:get-state', { roomPin }, (res) => {
      if (res && res.success && res.room) {
        setPlayers(res.room.players || []);
        if (res.room.quizActive) {
          navigate(`/player/quiz/${roomPin}`);
        }
      }
    });

    const handlePlayersUpdated = (updated) => {
      setPlayers(updated || []);
    };

    const handleHostDisconnected = (data) => {
      setHostWarning(data?.message || 'Host has temporarily disconnected.');
    };

    // Auto-transition to quiz pad when host starts quiz
    const handleQuizStarted = () => {
      navigate(`/player/quiz/${roomPin}`);
    };

    socket.on('room:players-updated', handlePlayersUpdated);
    socket.on('room:host-disconnected', handleHostDisconnected);
    socket.on('quiz:started', handleQuizStarted);

    return () => {
      socket.off('room:players-updated', handlePlayersUpdated);
      socket.off('room:host-disconnected', handleHostDisconnected);
      socket.off('quiz:started', handleQuizStarted);
    };
  }, [roomPin, profile, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Mobile Bar */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800">
        <Link to="/" className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-1">
          ← Exit
        </Link>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Room</span>
          <span className="font-mono font-extrabold text-amber-400 text-sm tracking-wider">
            {roomPin}
          </span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="max-w-md mx-auto w-full my-auto py-6 flex flex-col items-center text-center space-y-6">
        {hostWarning && (
          <div className="w-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{hostWarning}</span>
          </div>
        )}

        {/* Player Avatar Spotlight */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-400 shadow-2xl shadow-emerald-500/20 bg-slate-900 flex items-center justify-center animate-pulse">
            <img
              src={avatarUrl}
              alt={playerName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            Ready
          </div>
        </div>

        {/* Welcome Message */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            You're in, <span className="text-emerald-400">{playerName}</span>!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Look up at the projector screen. You should see your avatar!
          </p>
        </div>

        {/* Animated Waiting Card */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></div>
            <span>Waiting for host to start...</span>
          </div>
          <p className="text-xs text-slate-500">
            Keep this screen open on your phone. When the session starts, your buzzer pad will automatically appear here!
          </p>
        </div>

        {/* Players In Lobby Quick Count */}
        <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Classmates in Arena</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">
              {players.length} Total
            </span>
          </div>

          <div className="flex items-center justify-center -space-x-2 overflow-hidden py-1">
            {players.slice(0, 8).map((p, idx) => {
              const miniAvatarUrl = `https://api.dicebear.com/9.x/${p.avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(p.avatarSeed || p.playerName)}`;
              return (
                <div
                  key={p.socketId || idx}
                  title={p.playerName}
                  className="w-9 h-9 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden shadow"
                >
                  <img src={miniAvatarUrl} alt={p.playerName} className="w-full h-full object-cover" />
                </div>
              );
            })}
            {players.length > 8 && (
              <div className="w-9 h-9 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                +{players.length - 8}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-slate-600 py-2">
        Classroom Arena • Phone Buzzer Pad
      </footer>
    </div>
  );
}
