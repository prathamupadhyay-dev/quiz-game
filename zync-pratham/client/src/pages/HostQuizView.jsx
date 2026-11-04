import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import HostNavbar from '../components/HostNavbar';

const OPTION_COLORS = [
  { bg: 'bg-red-600/90', border: 'border-red-500', barBg: 'bg-red-500', label: '1', shape: '▲' },
  { bg: 'bg-blue-600/90', border: 'border-blue-500', barBg: 'bg-blue-500', label: '2', shape: '◆' },
  { bg: 'bg-emerald-600/90', border: 'border-emerald-500', barBg: 'bg-emerald-500', label: '3', shape: '●' },
  { bg: 'bg-amber-500/90', border: 'border-amber-400', barBg: 'bg-amber-400', label: '4', shape: '■' }
];

export default function HostQuizView() {
  const { roomPin } = useParams();
  const navigate = useNavigate();

  // Screen modes: 'waiting' | 'question' | 'matrix' | 'leaderboard' | 'finale'
  const [screenMode, setScreenMode] = useState('waiting');
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [timeLimit, setTimeLimit] = useState(15);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  // Results & Matrix state
  const [resultsData, setResultsData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finaleData, setFinaleData] = useState(null);

  // Configurable timing settings from Host
  const [timingSettings, setTimingSettings] = useState({
    questionTime: 15,
    matrixTime: 4,
    leaderboardTime: 4
  });

  // 4-second auto-transition phase countdown
  const [phaseSeconds, setPhaseSeconds] = useState(4);

  const questionTimerRef = useRef(null);
  const autoPhaseTimerRef = useRef(null);
  const hasEndedRef = useRef(false);
  const isPausedRef = useRef(isAutoPlayPaused);
  const timingSettingsRef = useRef(timingSettings);

  useEffect(() => {
    isPausedRef.current = isAutoPlayPaused;
  }, [isAutoPlayPaused]);

  useEffect(() => {
    timingSettingsRef.current = timingSettings;
  }, [timingSettings]);

  useEffect(() => {
    if (!roomPin) return;

    // Ask server for current quiz state in case of reload
    socket.emit('quiz:get-state', { roomPin }, (res) => {
      if (res && res.success) {
        setTotalQuestions(res.totalQuestions || 0);
        setQuestionIndex(res.currentQuestionIndex || 0);
        setLeaderboard(res.leaderboard || []);
        setTotalPlayers(res.totalPlayers || 0);
        setAnsweredCount(res.answeredCount || 0);
        if (res.timingSettings) {
          setTimingSettings(res.timingSettings);
        }

        if (res.questionActive && res.questionText) {
          hasEndedRef.current = false;
          setCurrentQuestion({
            questionText: res.questionText,
            options: res.options,
            correctIndex: res.correctIndex
          });
          setTimeLimit(res.timeLimit || res.timingSettings?.questionTime || 15);
          setTimeRemaining(res.timeRemaining || 15);
          setScreenMode('question');
        }
      }
    });

    // 1. Host receives question text & options
    const handleHostQuestion = (data) => {
      clearInterval(questionTimerRef.current);
      clearInterval(autoPhaseTimerRef.current);
      hasEndedRef.current = false;

      if (data.timingSettings) {
        setTimingSettings(data.timingSettings);
      }

      setCurrentQuestion({
        questionText: data.questionText,
        options: data.options,
        correctIndex: data.correctIndex
      });
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimeLimit(data.timeLimit || data.timingSettings?.questionTime || 15);
      setTimeRemaining(data.timeLimit || data.timingSettings?.questionTime || 15);
      setAnsweredCount(0);
      setScreenMode('question');
    };

    // 2. Answer count updates
    const handleAnswerCount = (data) => {
      setAnsweredCount(data.answeredCount);
      setTotalPlayers(data.totalPlayers);
    };

    // 3. Question results received -> triggers Phase B (Matrix)
    const handleQuestionResults = (data) => {
      clearInterval(questionTimerRef.current);
      clearInterval(autoPhaseTimerRef.current);
      hasEndedRef.current = true;

      if (data.timingSettings) {
        setTimingSettings(data.timingSettings);
      }

      setResultsData(data);
      setLeaderboard(data.leaderboard || []);
      const matrixSec = (data.timingSettings && data.timingSettings.matrixTime) || timingSettingsRef.current.matrixTime || 4;
      setPhaseSeconds(matrixSec);
      setScreenMode('matrix');
    };

    // 4. Finale event -> Phase D finale
    const handleFinale = (data) => {
      clearInterval(questionTimerRef.current);
      clearInterval(autoPhaseTimerRef.current);
      hasEndedRef.current = true;

      setFinaleData(data);
      setLeaderboard(data.leaderboard || []);
      setScreenMode('finale');
    };

    socket.on('quiz:host-question', handleHostQuestion);
    socket.on('quiz:answer-count', handleAnswerCount);
    socket.on('quiz:question-results', handleQuestionResults);
    socket.on('quiz:finale', handleFinale);

    return () => {
      clearInterval(questionTimerRef.current);
      clearInterval(autoPhaseTimerRef.current);
      socket.off('quiz:host-question', handleHostQuestion);
      socket.off('quiz:answer-count', handleAnswerCount);
      socket.off('quiz:question-results', handleQuestionResults);
      socket.off('quiz:finale', handleFinale);
    };
  }, [roomPin]);

  // Phase A: Active Question Countdown Timer
  useEffect(() => {
    if (screenMode !== 'question') {
      clearInterval(questionTimerRef.current);
      return;
    }

    clearInterval(questionTimerRef.current);
    questionTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current);
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            socket.emit('host:end-question', { roomPin });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(questionTimerRef.current);
  }, [screenMode, roomPin]);

  // Phase B & C: Automated Configurable Flow (Matrix -> Leaderboard -> Next Question)
  useEffect(() => {
    if (screenMode !== 'matrix' && screenMode !== 'leaderboard') {
      clearInterval(autoPhaseTimerRef.current);
      return;
    }

    clearInterval(autoPhaseTimerRef.current);
    const initialDuration = screenMode === 'matrix' 
      ? (timingSettings.matrixTime || 4) 
      : (timingSettings.leaderboardTime || 4);

    setPhaseSeconds(initialDuration);

    autoPhaseTimerRef.current = setInterval(() => {
      if (isPausedRef.current) return; // Do not decrement if presenter paused

      setPhaseSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(autoPhaseTimerRef.current);

          if (screenMode === 'matrix') {
            // Transition from Matrix (Phase B) to Leaderboard (Phase C)
            setScreenMode('leaderboard');
          } else if (screenMode === 'leaderboard') {
            // Transition from Leaderboard (Phase C) to Next Question / Finale (Phase D)
            socket.emit('host:next-question', { roomPin });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(autoPhaseTimerRef.current);
  }, [screenMode, roomPin, timingSettings]);

  const handleManualAdvance = () => {
    if (screenMode === 'matrix') {
      setScreenMode('leaderboard');
    } else if (screenMode === 'leaderboard') {
      socket.emit('host:next-question', { roomPin });
    }
  };

  const timerPercent = Math.max(0, Math.min(100, (timeRemaining / timeLimit) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      {/* Top Navbar with Single Safety Pause Toggle */}
      <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <span className="font-extrabold text-white text-base">Classroom Arena</span>
          <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
            PIN: {roomPin}
          </span>
        </div>

        {/* Safety Control: Pause / Resume Auto-Flow */}
        <div className="flex items-center gap-3">
          {screenMode !== 'finale' && screenMode !== 'waiting' && (
            <button
              type="button"
              onClick={() => setIsAutoPlayPaused(!isAutoPlayPaused)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isAutoPlayPaused
                  ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>{isAutoPlayPaused ? '▶️ Resume Auto-Play' : '⏸️ Pause Auto-Play'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-3 py-1 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{totalPlayers || leaderboard.length} Joined</span>
          </div>
        </div>
      </header>

      {/* Main Projector Arena View */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex-1 flex flex-col justify-between">
        
        {/* ============================================================== */}
        {/* PHASE A: ACTIVE QUESTION SCREEN (`15s` Timer)                 */}
        {/* ============================================================== */}
        {screenMode === 'question' && currentQuestion && (
          <div className="flex-1 flex flex-col justify-between gap-6 py-2">
            {/* Header: Question Badge, Timer & Answers Counter */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-400 font-semibold uppercase hidden sm:inline">
                  ⚡ Anti-Cheat Active
                </span>
              </div>

              {/* Answers locked-in count & Timer */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase">Answers:</span>
                  <span className="text-lg font-black text-emerald-400">
                    {answeredCount} / {totalPlayers || '0'}
                  </span>
                </div>

                <div className={`px-4 py-1.5 rounded-xl font-mono text-2xl font-black flex items-center gap-2 border ${
                  timeRemaining <= 5 
                    ? 'bg-rose-950 text-rose-400 border-rose-700 animate-pulse' 
                    : 'bg-slate-950 text-amber-400 border-slate-800'
                }`}>
                  <span>⏱️</span>
                  <span>{timeRemaining}s</span>
                </div>
              </div>
            </div>

            {/* Visual Timer Progress Bar */}
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  timeRemaining <= 5 ? 'bg-gradient-to-r from-rose-600 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                }`}
                style={{ width: `${timerPercent}%` }}
              ></div>
            </div>

            {/* Question Text (Large Projector Display) */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex items-center justify-center min-h-[160px]">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight max-w-5xl">
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* 4 Colored Option Cards (Option 1 Red, 2 Blue, 3 Green, 4 Yellow) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1 items-stretch">
              {currentQuestion.options.map((option, idx) => {
                const color = OPTION_COLORS[idx];
                return (
                  <div
                    key={idx}
                    className={`${color.bg} border-2 ${color.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex items-center gap-4 shadow-xl shadow-black/40`}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-black/30 backdrop-blur border border-white/20 flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-inner flex-shrink-0">
                      <span>{color.shape}</span>
                    </div>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-snug break-words flex-1">
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE B: ANSWER REVEAL & OPTION MATRIX (4 Seconds Auto)        */}
        {/* ============================================================== */}
        {screenMode === 'matrix' && resultsData && (
          <div className="flex-1 flex flex-col justify-between gap-6 py-2">
            {/* Automated Progress Banner */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 text-white">
                  Answer Reveal
                </span>
                <span className="text-emerald-400 font-extrabold text-sm sm:text-base">
                  ✓ Option {resultsData.correctIndex + 1} was the correct answer!
                </span>
              </div>

              {/* Auto Transition Indicator */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  {isAutoPlayPaused ? '⏸️ Auto-Flow Paused' : `Leaderboard in ${phaseSeconds}s...`}
                </span>
                {isAutoPlayPaused && (
                  <button
                    type="button"
                    onClick={handleManualAdvance}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                  >
                    Skip to Leaderboard ➜
                  </button>
                )}
              </div>
            </div>

            {/* Option Distribution Matrix Bar Charts */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex-1 flex flex-col justify-center space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white">Classroom Vote Distribution</h3>
                <p className="text-xs text-slate-400">See how students distributed their answers</p>
              </div>

              <div className="space-y-4">
                {currentQuestion?.options.map((optText, idx) => {
                  const color = OPTION_COLORS[idx];
                  const isCorrect = idx === resultsData.correctIndex;
                  const count = (resultsData.optionCounts && resultsData.optionCounts[idx]) || 0;
                  const totalAnswered = (resultsData.optionCounts || []).reduce((a, b) => a + b, 0) || 1;
                  const percent = Math.round((count / totalAnswered) * 100);

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-950/70 border-emerald-400 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                          : 'bg-slate-950/80 border-slate-800 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl ${color.bg} text-white font-black text-base flex items-center justify-center`}>
                            {color.shape}
                          </span>
                          <span className="font-extrabold text-white text-lg">
                            {optText}
                          </span>
                          {isCorrect && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500 text-slate-950 ml-2">
                              CORRECT ✓
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-black text-base text-slate-200">
                          {count} votes ({percent}%)
                        </span>
                      </div>

                      {/* Bar Graphic */}
                      <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCorrect ? 'bg-emerald-400' : color.barBg
                          }`}
                          style={{ width: `${Math.max(4, percent)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE C: LIVE LEADERBOARD (4 Seconds Auto)                     */}
        {/* ============================================================== */}
        {screenMode === 'leaderboard' && (
          <div className="flex-1 flex flex-col justify-between gap-6 py-2">
            {/* Header with Auto Transition */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 text-white">
                  Leaderboard Standings
                </span>
                <span className="text-slate-300 font-bold text-sm">
                  After Question {questionIndex + 1} of {totalQuestions}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  {isAutoPlayPaused 
                    ? '⏸️ Auto-Flow Paused' 
                    : (questionIndex + 1 >= totalQuestions ? `Final Podium in ${phaseSeconds}s...` : `Next Question in ${phaseSeconds}s...`)}
                </span>
                {isAutoPlayPaused && (
                  <button
                    type="button"
                    onClick={handleManualAdvance}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                  >
                    {questionIndex + 1 >= totalQuestions ? 'Show Podium 🏆' : 'Next Question ➜'}
                  </button>
                )}
              </div>
            </div>

            {/* Standings Cards */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex-1 flex flex-col shadow-2xl">
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 my-auto">
                {leaderboard.map((player, idx) => {
                  const avatarUrl = `https://api.dicebear.com/9.x/${player.avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(player.avatarSeed || player.playerName)}`;
                  const roundAnswer = resultsData?.playerResults ? resultsData.playerResults[player.socketId] : null;

                  return (
                    <div
                      key={player.socketId || idx}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'bg-amber-950/40 border-amber-500/70 shadow-lg shadow-amber-500/10'
                          : idx === 1
                          ? 'bg-slate-800/80 border-slate-600'
                          : idx === 2
                          ? 'bg-orange-950/30 border-orange-700/60'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center font-mono ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' :
                          idx === 1 ? 'bg-slate-300 text-slate-950' :
                          idx === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>

                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-400 bg-slate-900 shadow">
                          <img src={avatarUrl} alt={player.playerName} className="w-full h-full object-cover" />
                        </div>

                        <div>
                          <span className="font-extrabold text-white text-base block">
                            {player.playerName}
                          </span>
                          {roundAnswer && (
                            <span className={`text-xs font-semibold ${roundAnswer.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {roundAnswer.isCorrect ? `+${roundAnswer.pointsEarned} pts in ${roundAnswer.timeElapsed}s` : 'Missed (+0)'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-2xl font-black text-amber-400">
                          {player.score || 0}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">
                          pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE D: GRAND FINALE PODIUM & FULL CLASS SHOWCASE            */}
        {/* ============================================================== */}
        {screenMode === 'finale' && (
          <div className="flex-1 flex flex-col justify-between py-4 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40">
                🎉 Quiz Completed • Grand Finale
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Classroom Arena Podium
              </h2>
              <p className="text-sm text-slate-400">
                Congratulations to all {leaderboard.length} competitors!
              </p>
            </div>

            {/* TOP 3 PODIUM */}
            <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-3xl mx-auto w-full pt-8">
              {/* 2nd Place (Silver) */}
              {leaderboard[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-slate-300 shadow-xl bg-slate-900 mb-2">
                    <img
                      src={`https://api.dicebear.com/9.x/${leaderboard[1].avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(leaderboard[1].avatarSeed || leaderboard[1].playerName)}`}
                      alt={leaderboard[1].playerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-white text-sm sm:text-base truncate max-w-full">
                    {leaderboard[1].playerName}
                  </span>
                  <span className="font-mono text-sm font-extrabold text-slate-300 mb-2">
                    {leaderboard[1].score} pts
                  </span>
                  <div className="w-full bg-gradient-to-t from-slate-700 to-slate-500 h-32 sm:h-40 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl border-t-2 border-slate-300">
                    <span className="text-2xl sm:text-3xl">🥈</span>
                    <span className="font-black text-lg text-slate-900">2nd</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) */}
              {leaderboard[0] && (
                <div className="flex-1 flex flex-col items-center -translate-y-4">
                  <div className="text-3xl animate-bounce mb-1">👑</div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl shadow-amber-500/30 bg-slate-900 mb-2 ring-4 ring-amber-400/20">
                    <img
                      src={`https://api.dicebear.com/9.x/${leaderboard[0].avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(leaderboard[0].avatarSeed || leaderboard[0].playerName)}`}
                      alt={leaderboard[0].playerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-black text-white text-base sm:text-lg truncate max-w-full">
                    {leaderboard[0].playerName}
                  </span>
                  <span className="font-mono text-base font-black text-amber-400 mb-2">
                    {leaderboard[0].score} pts
                  </span>
                  <div className="w-full bg-gradient-to-t from-amber-600 to-amber-400 h-44 sm:h-52 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl border-t-2 border-amber-200">
                    <span className="text-3xl sm:text-4xl">🏆</span>
                    <span className="font-black text-xl text-slate-950">CHAMPION</span>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {leaderboard[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-amber-700 shadow-xl bg-slate-900 mb-2">
                    <img
                      src={`https://api.dicebear.com/9.x/${leaderboard[2].avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(leaderboard[2].avatarSeed || leaderboard[2].playerName)}`}
                      alt={leaderboard[2].playerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-white text-sm sm:text-base truncate max-w-full">
                    {leaderboard[2].playerName}
                  </span>
                  <span className="font-mono text-sm font-extrabold text-amber-600 mb-2">
                    {leaderboard[2].score} pts
                  </span>
                  <div className="w-full bg-gradient-to-t from-amber-900 to-amber-700 h-24 sm:h-32 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl border-t-2 border-amber-600">
                    <span className="text-2xl sm:text-3xl">🥉</span>
                    <span className="font-black text-lg text-white">3rd</span>
                  </div>
                </div>
              )}
            </div>

            {/* FULL CLASS GROUP SHOWCASE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <h3 className="font-bold text-lg text-white">All Classmate Scores</h3>
                <span className="text-xs text-slate-400 font-semibold">{leaderboard.length} Students Participated</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {leaderboard.map((student, idx) => {
                  const avatarUrl = `https://api.dicebear.com/9.x/${student.avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(student.avatarSeed || student.playerName)}`;
                  return (
                    <div
                      key={student.socketId || idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3"
                    >
                      <span className="font-mono text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                        <img src={avatarUrl} alt={student.playerName} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate flex-1">
                        <span className="text-xs font-bold text-white block truncate">
                          {student.playerName}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">
                          {student.score} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Single Return Button */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-8 py-3.5 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                🏠 Return to Main Lobby
              </button>
            </div>
          </div>
        )}

        {/* Loading / Waiting state */}
        {screenMode === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold text-white">Preparing Arena...</h3>
            <p className="text-xs text-slate-400">Question 1 will appear in a moment!</p>
          </div>
        )}
      </main>
    </div>
  );
}
