import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import socket from '../socket';

const BUTTON_CONFIG = [
  { index: 0, label: '1', shape: '▲', bg: 'bg-red-600 active:bg-red-700 hover:bg-red-500', border: 'border-red-500', colorName: 'Red' },
  { index: 1, label: '2', shape: '◆', bg: 'bg-blue-600 active:bg-blue-700 hover:bg-blue-500', border: 'border-blue-500', colorName: 'Blue' },
  { index: 2, label: '3', shape: '●', bg: 'bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500', border: 'border-emerald-500', colorName: 'Green' },
  { index: 3, label: '4', shape: '■', bg: 'bg-amber-400 active:bg-amber-500 hover:bg-amber-300 text-slate-950 font-black', border: 'border-amber-400', colorName: 'Yellow' }
];

export default function PlayerQuizPad() {
  const { roomPin } = useParams();

  const [profile] = useState(() => {
    try {
      const saved = sessionStorage.getItem('playerProfile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Quiz state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Pad states: 'answering' | 'locked' | 'finale'
  const [padState, setPadState] = useState('answering');
  const [selectedOption, setSelectedOption] = useState(null);

  const playerName = profile?.playerName || 'Student';
  const avatarStyle = profile?.avatarStyle || 'adventurer';
  const avatarSeed = profile?.avatarSeed || 'student';
  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

  useEffect(() => {
    if (!roomPin) return;

    // Fetch quiz state on mount or reconnect
    socket.emit('quiz:get-state', { roomPin }, (res) => {
      if (res && res.success) {
        setQuestionIndex(res.currentQuestionIndex || 0);
        setTotalQuestions(res.totalQuestions || 0);

        if (res.hasAnswered) {
          setPadState('locked');
          setSelectedOption(res.playerAnswer?.selectedOption ?? null);
        } else if (res.questionActive) {
          setPadState('answering');
        }
      }
    });

    // 1. New Question Starts -> Reset pad for answering
    const handlePlayerQuestion = (data) => {
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setSelectedOption(null);
      setPadState('answering');
    };

    // 2. Answer locked acknowledgement
    const handleAnswerReceived = (data) => {
      setSelectedOption(data.selectedOption);
      setPadState('locked');
    };

    // 3. Question Results -> Keep screen locked with "Eyes on the Big Screen"
    // (Never show correct/incorrect or scores on the phone)
    const handleQuestionResults = () => {
      setPadState('locked');
    };

    // 4. Finale Event -> Show simple completion card
    const handleFinale = () => {
      setPadState('finale');
    };

    socket.on('quiz:player-question', handlePlayerQuestion);
    socket.on('quiz:answer-received', handleAnswerReceived);
    socket.on('quiz:question-results', handleQuestionResults);
    socket.on('quiz:finale', handleFinale);

    return () => {
      socket.off('quiz:player-question', handlePlayerQuestion);
      socket.off('quiz:answer-received', handleAnswerReceived);
      socket.off('quiz:question-results', handleQuestionResults);
      socket.off('quiz:finale', handleFinale);
    };
  }, [roomPin]);

  // Student taps an option button on their buzzer pad
  const handleSelectOption = (idx) => {
    if (padState !== 'answering') return;

    setSelectedOption(idx);
    setPadState('locked');

    socket.emit('player:submit-answer', { roomPin, optionIndex: idx });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-4 select-none touch-manipulation">
      {/* Top Mobile Bar: Minimal student identity & question badge (NO timer, NO scores) */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-400 bg-slate-900">
            <img src={avatarUrl} alt={playerName} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-bold text-white truncate max-w-[120px]">
            {playerName}
          </span>
        </div>

        <div className="bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-800 text-xs text-indigo-300 font-extrabold">
          Question {questionIndex + 1}{totalQuestions > 0 ? ` / ${totalQuestions}` : ''}
        </div>
      </header>

      {/* Main Interactive Screen */}
      <main className="max-w-md mx-auto w-full my-auto flex-1 flex flex-col justify-center py-2">

        {/* ============================================================== */}
        {/* STATE 1: ACTIVE QUESTION (PURE 4-BUTTON EYES-UP CONTROLLER)     */}
        {/* ============================================================== */}
        {padState === 'answering' && (
          <div className="flex-1 flex flex-col justify-between space-y-3">
            {/* Top Prompt Banner */}
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl text-center">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                👀 Look at the Big Screen
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tap the matching color or shape below to lock in your answer
              </p>
            </div>

            {/* 2x2 Grid Filling the Screen with 4 Huge Colored Touch Buttons */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 items-stretch min-h-[380px]">
              {BUTTON_CONFIG.map((btn) => (
                <button
                  key={btn.index}
                  type="button"
                  onClick={() => handleSelectOption(btn.index)}
                  className={`relative rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95 ${btn.bg} border-2 ${btn.border}`}
                >
                  <span className="text-5xl sm:text-6xl mb-2 filter drop-shadow">
                    {btn.shape}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black">
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 2: OPTION LOCKED! EYES ON THE BIG SCREEN                 */}
        {/* ============================================================== */}
        {padState === 'locked' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8 px-4">
            <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-4 border-indigo-400 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/20 animate-pulse">
              👀
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Option Locked!
              </h2>
              <p className="text-base font-extrabold text-indigo-400">
                Eyes on the Big Screen
              </p>
            </div>

            {/* Registered Option Indicator */}
            {selectedOption !== null && (
              <div className={`px-6 py-3.5 rounded-2xl border-2 flex items-center gap-3 shadow-xl ${BUTTON_CONFIG[selectedOption].bg} ${BUTTON_CONFIG[selectedOption].border}`}>
                <span className="text-3xl">{BUTTON_CONFIG[selectedOption].shape}</span>
                <span className="font-black text-lg">Option {selectedOption + 1} ({BUTTON_CONFIG[selectedOption].colorName})</span>
              </div>
            )}

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-xs w-full text-xs text-slate-400 space-y-1 shadow-lg">
              <p className="font-semibold text-slate-300">
                Results and rankings are displayed live on the classroom projector.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 3: QUIZ COMPLETE                                        */}
        {/* ============================================================== */}
        {padState === 'finale' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8 px-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl shadow-amber-500/30 bg-slate-900 mx-auto">
              <img src={avatarUrl} alt={playerName} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">
                Quiz Complete!
              </h2>
              <p className="text-base font-extrabold text-amber-400">
                Check the Big Screen for Final Standings 🏆
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-xs w-full text-xs text-slate-400 shadow-lg">
              <p>Look up at the podium to see your final class ranking!</p>
            </div>

            <Link
              to="/"
              className="w-full max-w-xs py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition text-center shadow-lg"
            >
              Back to Home
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-slate-600 py-1 border-t border-slate-900">
        Classroom Arena • Phone Controller
      </footer>
    </div>
  );
}
