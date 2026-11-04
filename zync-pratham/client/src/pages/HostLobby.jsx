import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import socket from '../socket';
import HostNavbar from '../components/HostNavbar';

export default function HostLobby() {
  const { roomPin } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [mode, setMode] = useState('quiz');
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Custom Quizzes State (No pre-seeded packs)
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [showBuilderModal, setShowBuilderModal] = useState(false);

  // Configurable Timing Settings (Seconds)
  const [questionTime, setQuestionTime] = useState(15);
  const [matrixTime, setMatrixTime] = useState(4);
  const [leaderboardTime, setLeaderboardTime] = useState(4);

  // Custom Quiz Builder State
  const [customTitle, setCustomTitle] = useState('');
  const [customQuestions, setCustomQuestions] = useState([
    {
      questionText: 'What is the capital of France?',
      options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
      correctIndex: 2
    },
    {
      questionText: 'Which element has the chemical symbol "O"?',
      options: ['Gold', 'Oxygen', 'Osmium', 'Iron'],
      correctIndex: 1
    }
  ]);
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const joinUrl = `http://${hostname}:5173/?pin=${roomPin}`;

  // Fetch custom quizzes from server
  const loadQuizzes = () => {
    fetch(`http://${hostname}:5000/api/quizzes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.quizzes && data.quizzes.length > 0) {
          setQuizzes(data.quizzes);
          if (!selectedQuizId) {
            setSelectedQuizId(data.quizzes[0]._id);
          }
        } else {
          setQuizzes([]);
          setSelectedQuizId('');
        }
      })
      .catch((err) => console.warn('Could not fetch custom quizzes:', err));
  };

  useEffect(() => {
    loadQuizzes();
  }, [hostname]);

  useEffect(() => {
    if (!roomPin) return;

    // Fetch initial room state from server
    socket.emit('room:get-state', { roomPin }, (res) => {
      if (res && res.success && res.room) {
        setPlayers(res.room.players || []);
        if (res.room.mode) setMode(res.room.mode);
        if (res.room.quizActive) {
          navigate(`/host/quiz/${roomPin}`);
        }
      }
    });

    const handlePlayersUpdated = (updatedPlayers) => {
      setPlayers(updatedPlayers || []);
    };

    const handleQuizStarted = () => {
      navigate(`/host/quiz/${roomPin}`);
    };

    socket.on('room:players-updated', handlePlayersUpdated);
    socket.on('quiz:started', handleQuizStarted);

    return () => {
      socket.off('room:players-updated', handlePlayersUpdated);
      socket.off('quiz:started', handleQuizStarted);
    };
  }, [roomPin, navigate]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSession = () => {
    if (mode === 'quiz') {
      if (!selectedQuizId || quizzes.length === 0) {
        alert('Please create or select a custom quiz first! Click "+ Create Custom Quiz" to add your questions.');
        setShowBuilderModal(true);
        return;
      }

      if (players.length === 0) {
        const confirmStart = window.confirm(
          'No players have joined yet! Are you sure you want to start without students?'
        );
        if (!confirmStart) return;
      }

      setIsStarting(true);
      const timingSettings = {
        questionTime: Number(questionTime) || 15,
        matrixTime: Number(matrixTime) || 4,
        leaderboardTime: Number(leaderboardTime) || 4
      };

      socket.emit('host:start-quiz', { roomPin, quizId: selectedQuizId, timingSettings }, (res) => {
        setIsStarting(false);
        if (res && res.success) {
          navigate(`/host/quiz/${roomPin}`);
        } else {
          alert(res?.message || 'Failed to start quiz');
        }
      });
    } else {
      alert('[Phase 3 Ready] Live Slide Presenter will be activated!');
    }
  };

  // Custom Quiz Builder Handlers
  const handleAddQuestion = () => {
    setCustomQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (customQuestions.length <= 1) return;
    setCustomQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (qIndex, field, value) => {
    setCustomQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex, optIndex, value) => {
    setCustomQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIndex].options];
      newOpts[optIndex] = value;
      copy[qIndex] = { ...copy[qIndex], options: newOpts };
      return copy;
    });
  };

  const handleSaveCustomQuiz = async (e) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      alert('Please enter a quiz title.');
      return;
    }
    for (let i = 0; i < customQuestions.length; i++) {
      if (!customQuestions[i].questionText.trim()) {
        alert(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!customQuestions[i].options[j]?.trim()) {
          alert(`Option ${j + 1} for Question ${i + 1} cannot be empty.`);
          return;
        }
      }
    }

    setIsSavingCustom(true);
    try {
      const response = await fetch(`http://${hostname}:5000/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle.trim(),
          questions: customQuestions
        })
      });
      const data = await response.json();
      if (data.success && data.quiz) {
        setQuizzes((prev) => [data.quiz, ...prev]);
        setSelectedQuizId(data.quiz._id);
        setShowBuilderModal(false);
        setCustomTitle('');
      } else {
        alert(data.message || 'Failed to save quiz');
      }
    } catch (err) {
      alert('Error saving custom quiz: ' + err.message);
    } finally {
      setIsSavingCustom(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <HostNavbar roomPin={roomPin} mode={mode} playersCount={players.length} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* Top Hero Section: PIN & QR Code */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center lg:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Lobby Active • Ready for Students</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Join at <span className="text-indigo-400 font-mono underline decoration-indigo-500/50">http://{hostname}:5173</span>
            </h2>

            <p className="text-slate-400 text-sm max-w-xl">
              Scan the QR code with any smartphone or open a browser and enter the Room PIN.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="bg-slate-950/90 border-2 border-indigo-500/50 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">PIN:</span>
                <span className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-widest">
                  {roomPin}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-sm font-semibold transition flex items-center gap-2"
              >
                <span>{copied ? '✓ Copied!' : '📋 Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-indigo-500/10 flex flex-col items-center">
            <QRCodeSVG
              value={joinUrl}
              size={160}
              level="H"
              marginSize={1}
            />
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mt-2">
              Scan to Join
            </span>
          </div>
        </div>

        {/* Quiz Setup & Timing Panel (Only in Quiz Mode) */}
        {mode === 'quiz' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Box: Custom Quizzes List & Add Button */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📝</span>
                    <span>Custom Quiz Arena</span>
                  </h3>
                  <p className="text-xs text-slate-400">Build or pick custom questions for your classroom</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBuilderModal(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>+</span>
                  <span>Create Custom Quiz</span>
                </button>
              </div>

              {quizzes.length === 0 ? (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 text-center space-y-3">
                  <div className="text-3xl">🎯</div>
                  <h4 className="font-bold text-white text-sm">No Custom Quiz Created Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click the <strong>"+ Create Custom Quiz"</strong> button above to write your questions, options, and answers!
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowBuilderModal(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition"
                  >
                    Launch Question Builder ➜
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {quizzes.map((quiz) => {
                    const isSelected = selectedQuizId === quiz._id;
                    const count = quiz.questions?.length || 0;
                    return (
                      <div
                        key={quiz._id}
                        onClick={() => setSelectedQuizId(quiz._id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40'
                            : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                            {count} Questions
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-sm truncate">
                          {quiz.title}
                        </h4>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Box: Configurable Quiz Timing Settings */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⏱️</span>
                  <span>Quiz Timing Settings</span>
                </h3>
                <p className="text-xs text-slate-400">Configure duration for each automated phase</p>
              </div>

              <div className="space-y-3 pt-1">
                {/* 1. Question Time Limit */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Question Time Limit</span>
                    <span className="text-[10px] text-slate-400">Duration students have to buzz in</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={questionTime}
                      onChange={(e) => setQuestionTime(Math.max(5, Math.min(60, Number(e.target.value) || 15)))}
                      className="w-16 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-2 py-1 text-center font-mono font-bold text-amber-400 text-sm outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">sec</span>
                  </div>
                </div>

                {/* 2. Answer Reveal & Matrix Time */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Answer Reveal & Matrix</span>
                    <span className="text-[10px] text-slate-400">Big screen vote distribution chart</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={matrixTime}
                      onChange={(e) => setMatrixTime(Math.max(2, Math.min(20, Number(e.target.value) || 4)))}
                      className="w-16 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-2 py-1 text-center font-mono font-bold text-emerald-400 text-sm outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">sec</span>
                  </div>
                </div>

                {/* 3. Leaderboard Display Time */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Leaderboard Duration</span>
                    <span className="text-[10px] text-slate-400">Scores shown before next question</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={leaderboardTime}
                      onChange={(e) => setLeaderboardTime(Math.max(2, Math.min(20, Number(e.target.value) || 4)))}
                      className="w-16 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-2 py-1 text-center font-mono font-bold text-purple-400 text-sm outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold">sec</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Players In Arena Grid */}
        <section className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Students in Arena</h3>
              <span className="px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-sm font-bold">
                {players.length}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Live Updates</span>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-500 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center text-3xl animate-bounce">
                ⏳
              </div>
              <p className="text-base font-semibold text-slate-400">Waiting for players to connect...</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Students will automatically pop up here as they scan the QR code and enter their nicknames!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {players.map((p, idx) => {
                const avatarUrl = `https://api.dicebear.com/9.x/${p.avatarStyle || 'adventurer'}/svg?seed=${encodeURIComponent(p.avatarSeed || p.playerName)}`;
                return (
                  <div
                    key={p.socketId || idx}
                    className="group bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/80 rounded-2xl p-4 flex flex-col items-center text-center transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-indigo-400/60 bg-slate-900 mb-3 shadow-md">
                      <img
                        src={avatarUrl}
                        alt={p.playerName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-sm font-bold text-white truncate max-w-full">
                      {p.playerName}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-indigo-400 mt-1">
                      Ready ⚡
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Control Bar — SINGLE Launch Button */}
      <footer className="sticky bottom-0 bg-slate-900/90 backdrop-blur border-t border-slate-800 px-6 py-4 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            Mode: <span className="text-white font-semibold">{mode === 'quiz' ? 'Custom Quiz Arena' : 'Slide Presenter'}</span>
            {selectedQuizId && (
              <span className="ml-3 text-indigo-400 font-semibold">
                • {quizzes.find((q) => q._id === selectedQuizId)?.title} ({quizzes.find((q) => q._id === selectedQuizId)?.questions?.length || 0} Questions)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={isStarting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 text-base disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Starting Arena...</span>
              </>
            ) : (
              <>
                <span>🚀 Launch Quiz Arena</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Custom Quiz Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-8 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-white">Custom Quiz Builder</h3>
                <p className="text-xs text-slate-400">Design your own questions, options, and answers</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBuilderModal(false)}
                className="text-slate-400 hover:text-white p-2 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomQuiz} className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Quiz Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Review Quiz"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Questions ({customQuestions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1"
                  >
                    <span>+ Add Question</span>
                  </button>
                </div>

                {customQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-400">
                        Question #{qIdx + 1}
                      </span>
                      {customQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Type your question here..."
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'questionText', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-white text-sm outline-none"
                    />

                    {/* 4 Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        const optColors = ['border-red-500/50', 'border-blue-500/50', 'border-emerald-500/50', 'border-amber-500/50'];
                        const isCorrect = q.correctIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 bg-slate-900 ${
                              isCorrect ? 'border-emerald-400 ring-1 ring-emerald-400/50' : optColors[optIdx]
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => handleUpdateQuestion(qIdx, 'correctIndex', optIdx)}
                              className="accent-emerald-500 cursor-pointer"
                              title="Mark as correct answer"
                            />
                            <span className="text-xs font-black text-slate-400">
                              {optIdx + 1}:
                            </span>
                            <input
                              type="text"
                              required
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              className="w-full bg-transparent text-white text-xs outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustom}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {isSavingCustom ? 'Saving Quiz...' : 'Save & Select Quiz 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
