const Quiz = require('../models/Quiz');
const GameResult = require('../models/GameResult');
const { inMemoryQuizzes } = require('../routes/quizRoutes');

// Active rooms stored in server memory for 50 concurrent players
const rooms = new Map();

function generateRoomPin() {
  let pin;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(pin));
  return pin;
}

// Helper to start a question
function startQuestion(io, room) {
  const currentQuestion = room.questions[room.currentQuestionIndex];
  const timeLimit = currentQuestion.timeLimit || (room.timingSettings && room.timingSettings.questionTime) || 15;

  room.questionActive = true;
  room.questionStartTime = Date.now();
  room.timeLimit = timeLimit;
  room.answeredPlayers = {}; // socketId -> answer details
  room.optionCounts = [0, 0, 0, 0];

  console.log(`[Quiz] Room ${room.roomPin} starting Question ${room.currentQuestionIndex + 1} of ${room.questions.length} (${timeLimit}s timer)`);

  // Emit full question and options ONLY to the Host screen
  io.to(room.hostSocketId).emit('quiz:host-question', {
    questionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    questionText: currentQuestion.questionText,
    options: currentQuestion.options,
    timeLimit,
    correctIndex: currentQuestion.correctIndex,
    timingSettings: room.timingSettings
  });

  // Pure "Eyes-Up" Student Controller:
  // Send ONLY questionIndex and totalQuestions. NO text, NO options, NO timer bar.
  io.to(room.roomPin).emit('quiz:player-question', {
    questionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length
  });
}

// Helper to end a question and broadcast matrix results
function endQuestion(io, room) {
  if (!room.questionActive) return;
  room.questionActive = false;

  const currentQuestion = room.questions[room.currentQuestionIndex];
  const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));

  console.log(`[Quiz] Room ${room.roomPin} Question ${room.currentQuestionIndex + 1} ended. Correct: ${currentQuestion.correctIndex}`);

  // Broadcast results matrix & leaderboard to entire room
  io.to(room.roomPin).emit('quiz:question-results', {
    questionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    correctIndex: currentQuestion.correctIndex,
    optionCounts: room.optionCounts,
    leaderboard: sortedPlayers,
    playerResults: room.answeredPlayers,
    timingSettings: room.timingSettings
  });
}

function setupRoomHandler(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Host creates a room (Mode: "quiz" or "presenter")
    socket.on('host:create-room', (payload, callback) => {
      try {
        const mode = (payload && payload.mode) || 'quiz';
        const roomPin = generateRoomPin();

        const roomData = {
          roomPin,
          hostSocketId: socket.id,
          mode,
          createdAt: Date.now(),
          players: [],
          // Configurable timing settings (seconds)
          timingSettings: {
            questionTime: 15,
            matrixTime: 4,
            leaderboardTime: 4
          },
          // Quiz specific state (starts empty - purely custom quiz mode)
          quizActive: false,
          questions: [],
          currentQuestionIndex: 0,
          questionActive: false,
          questionStartTime: 0,
          timeLimit: 15,
          answeredPlayers: {},
          optionCounts: [0, 0, 0, 0]
        };

        rooms.set(roomPin, roomData);
        socket.join(roomPin);

        socket.data.roomPin = roomPin;
        socket.data.isHost = true;

        console.log(`[Host] Created room ${roomPin} (Mode: ${mode}) by ${socket.id}`);

        const response = { success: true, roomPin, mode };
        if (typeof callback === 'function') callback(response);
        socket.emit('room:created', response);
      } catch (err) {
        console.error('[Host] Create room error:', err);
        if (typeof callback === 'function') callback({ success: false, message: err.message });
      }
    });

    // Player joins a room with name and avatar configuration
    socket.on('player:join-room', (payload, callback) => {
      try {
        const { roomPin, playerName, avatarStyle, avatarSeed } = payload || {};

        if (!roomPin || !rooms.has(roomPin)) {
          const errMsg = 'Room not found. Please check your 6-digit PIN.';
          if (typeof callback === 'function') {
            return callback({ success: false, message: errMsg });
          }
          return socket.emit('room:error', { message: errMsg });
        }

        const room = rooms.get(roomPin);

        const newPlayer = {
          socketId: socket.id,
          playerName: (playerName || 'Student').trim().substring(0, 20),
          avatarStyle: avatarStyle || 'adventurer',
          avatarSeed: avatarSeed || socket.id.slice(0, 6),
          score: 0,
          joinedAt: Date.now()
        };

        // Update player if already present or add new
        const existingIdx = room.players.findIndex((p) => p.socketId === socket.id);
        if (existingIdx !== -1) {
          // Preserve score if rejoining
          newPlayer.score = room.players[existingIdx].score || 0;
          room.players[existingIdx] = newPlayer;
        } else {
          room.players.push(newPlayer);
        }

        socket.join(roomPin);
        socket.data.roomPin = roomPin;
        socket.data.isHost = false;
        socket.data.playerName = newPlayer.playerName;

        console.log(`[Player] ${newPlayer.playerName} joined room ${roomPin} (${room.players.length} players)`);

        // Broadcast to Host and everyone in room
        io.to(roomPin).emit('room:players-updated', room.players);

        const response = {
          success: true,
          room: {
            roomPin,
            mode: room.mode,
            quizActive: room.quizActive,
            players: room.players
          },
          player: newPlayer
        };

        if (typeof callback === 'function') callback(response);
        socket.emit('player:joined', response);
      } catch (err) {
        console.error('[Player] Join room error:', err);
        if (typeof callback === 'function') callback({ success: false, message: err.message });
      }
    });

    // ==========================================
    // MODULE 1: CUSTOM QUIZ ARENA EVENTS
    // ==========================================

    // Host starts the Custom Quiz
    socket.on('host:start-quiz', async (payload, callback) => {
      try {
        const roomPin = payload?.roomPin || socket.data?.roomPin;
        if (!roomPin || !rooms.has(roomPin)) {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
          return;
        }

        const room = rooms.get(roomPin);
        if (room.hostSocketId !== socket.id) {
          if (typeof callback === 'function') callback({ success: false, message: 'Only host can start quiz' });
          return;
        }

        // Apply configurable timing settings
        if (payload?.timingSettings) {
          room.timingSettings = {
            questionTime: Math.max(5, Math.min(120, Number(payload.timingSettings.questionTime) || 15)),
            matrixTime: Math.max(2, Math.min(30, Number(payload.timingSettings.matrixTime) || 4)),
            leaderboardTime: Math.max(2, Math.min(30, Number(payload.timingSettings.leaderboardTime) || 4))
          };
        }

        // Load custom questions
        let loadedQuestions = null;
        if (payload?.quizId) {
          try {
            const foundQuiz = await Quiz.findById(payload.quizId);
            if (foundQuiz && foundQuiz.questions?.length > 0) {
              loadedQuestions = foundQuiz.questions;
            }
          } catch (e) {}

          if (!loadedQuestions) {
            const memQuiz = inMemoryQuizzes.find(
              (q) => q._id === payload.quizId || String(q._id) === String(payload.quizId)
            );
            if (memQuiz && memQuiz.questions?.length > 0) {
              loadedQuestions = memQuiz.questions;
            }
          }
        }

        // Fallback: use first available custom quiz if no quizId specified
        if (!loadedQuestions || loadedQuestions.length === 0) {
          if (inMemoryQuizzes.length > 0) {
            loadedQuestions = inMemoryQuizzes[0].questions;
          } else {
            try {
              const latestDb = await Quiz.findOne().sort({ createdAt: -1 });
              if (latestDb && latestDb.questions?.length > 0) {
                loadedQuestions = latestDb.questions;
              }
            } catch (e) {}
          }
        }

        if (!loadedQuestions || loadedQuestions.length === 0) {
          const errMsg = 'No quiz found! Please click "+ Create Custom Quiz" first.';
          if (typeof callback === 'function') callback({ success: false, message: errMsg });
          return;
        }

        // Apply default questionTime to questions without a custom limit
        room.questions = loadedQuestions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          timeLimit: q.timeLimit || room.timingSettings.questionTime
        }));

        room.currentQuestionIndex = 0;
        room.quizActive = true;
        // Reset player scores
        room.players.forEach((p) => {
          p.score = 0;
        });

        console.log(`[Quiz] Host started Quiz with ${room.questions.length} questions in room ${roomPin}. Settings: ${JSON.stringify(room.timingSettings)}`);

        // Notify entire room that quiz has started (triggers client-side navigation)
        io.to(roomPin).emit('quiz:started', {
          roomPin,
          totalQuestions: room.questions.length,
          timingSettings: room.timingSettings
        });

        // Small 1.2s countdown pause before delivering Question 1
        setTimeout(() => {
          startQuestion(io, room);
        }, 1200);

        if (typeof callback === 'function') callback({ success: true, roomPin });
      } catch (err) {
        console.error('[Quiz] Start quiz error:', err);
        if (typeof callback === 'function') callback({ success: false, message: err.message });
      }
    });

    // Player submits an answer on their 4-button buzzer pad
    socket.on('player:submit-answer', (payload, callback) => {
      try {
        const { roomPin, optionIndex } = payload || {};
        if (!roomPin || !rooms.has(roomPin)) return;

        const room = rooms.get(roomPin);
        if (!room.questionActive) {
          if (typeof callback === 'function') callback({ success: false, message: 'Question is not active' });
          return;
        }

        // Prevent multiple answers for the same question
        if (room.answeredPlayers[socket.id]) {
          if (typeof callback === 'function') callback({ success: false, message: 'Already answered' });
          return;
        }

        const currentQuestion = room.questions[room.currentQuestionIndex];
        const timeLimit = room.timeLimit || 15;
        const timeElapsed = (Date.now() - room.questionStartTime) / 1000;

        // Increment distribution counter
        if (optionIndex >= 0 && optionIndex <= 3) {
          room.optionCounts[optionIndex]++;
        }

        const isCorrect = optionIndex === currentQuestion.correctIndex;
        let points = 0;

        // Speed-Decay Scoring:
        // Faster answers get closer to 1000; slower correct answers closer to 500; wrong get 0.
        if (isCorrect) {
          const clampedTime = Math.min(Math.max(timeElapsed, 0), timeLimit);
          points = Math.max(500, Math.round(1000 * (1 - (clampedTime / timeLimit) * 0.5)));
        }

        // Find player and add points
        const player = room.players.find((p) => p.socketId === socket.id);
        if (player) {
          player.score = (player.score || 0) + points;
        }

        // Store round answer
        room.answeredPlayers[socket.id] = {
          socketId: socket.id,
          playerName: player ? player.playerName : 'Player',
          avatarStyle: player?.avatarStyle || 'adventurer',
          avatarSeed: player?.avatarSeed || 'seed',
          isCorrect,
          pointsEarned: points,
          timeElapsed: Number(timeElapsed.toFixed(2)),
          selectedOption: optionIndex
        };

        console.log(`[Quiz] Player ${player?.playerName} submitted opt ${optionIndex} (${isCorrect ? 'CORRECT' : 'WRONG'}, +${points} pts, ${timeElapsed.toFixed(2)}s)`);

        // Send acknowledgement to player (only confirms lock, no score/correct details)
        const ackData = {
          success: true,
          selectedOption: optionIndex
        };
        if (typeof callback === 'function') callback(ackData);
        socket.emit('quiz:answer-received', ackData);

        // Notify Host of live answer count
        const answeredCount = Object.keys(room.answeredPlayers).length;
        const totalPlayers = room.players.length;

        io.to(room.hostSocketId).emit('quiz:answer-count', {
          answeredCount,
          totalPlayers
        });

        // Auto-end question early if ALL joined students have locked in their answer!
        if (totalPlayers > 0 && answeredCount >= totalPlayers) {
          console.log(`[Quiz] All ${totalPlayers} players answered. Automatically ending question early!`);
          endQuestion(io, room);
        }
      } catch (err) {
        console.error('[Quiz] Submit answer error:', err);
      }
    });

    // Host ends the current question (or timer expired)
    socket.on('host:end-question', (payload) => {
      const roomPin = payload?.roomPin || socket.data?.roomPin;
      if (!roomPin || !rooms.has(roomPin)) return;
      const room = rooms.get(roomPin);
      if (room.hostSocketId === socket.id) {
        endQuestion(io, room);
      }
    });

    // Host advances to next question or triggers finale
    socket.on('host:next-question', async (payload) => {
      const roomPin = payload?.roomPin || socket.data?.roomPin;
      if (!roomPin || !rooms.has(roomPin)) return;
      const room = rooms.get(roomPin);
      if (room.hostSocketId !== socket.id) return;

      if (room.currentQuestionIndex + 1 < room.questions.length) {
        room.currentQuestionIndex++;
        startQuestion(io, room);
      } else {
        // Finale reached: Quiz complete!
        room.quizActive = false;
        room.questionActive = false;
        const finalLeaderboard = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));

        console.log(`[Quiz] Room ${roomPin} completed all ${room.questions.length} questions! Finale reached.`);

        // Persist final session leaderboard to MongoDB GameResult model
        try {
          await GameResult.create({
            roomPin: room.roomPin,
            mode: 'quiz',
            leaderboard: finalLeaderboard.map((p) => ({
              playerName: p.playerName,
              avatarSeed: p.avatarSeed,
              avatarStyle: p.avatarStyle,
              score: p.score
            }))
          });
          console.log(`[Quiz] Persisted final leaderboard to MongoDB for room ${roomPin}`);
        } catch (dbErr) {
          console.warn('[Quiz] MongoDB offline, leaderboard preserved in memory.');
        }

        // Broadcast finale event
        io.to(room.roomPin).emit('quiz:finale', {
          roomPin: room.roomPin,
          leaderboard: finalLeaderboard
        });
      }
    });

    // State sync endpoint for reloads & reconnections
    socket.on('quiz:get-state', (payload, callback) => {
      const roomPin = payload?.roomPin || socket.data?.roomPin;
      if (roomPin && rooms.has(roomPin)) {
        const room = rooms.get(roomPin);
        const isHost = socket.id === room.hostSocketId;
        const currentQuestion = room.questions ? room.questions[room.currentQuestionIndex] : null;
        const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));

        let timeRemaining = 0;
        if (room.questionActive && room.questionStartTime) {
          const elapsed = (Date.now() - room.questionStartTime) / 1000;
          timeRemaining = Math.max(0, Math.ceil((room.timeLimit || 15) - elapsed));
        }

        const state = {
          success: true,
          quizActive: room.quizActive,
          questionActive: room.questionActive,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.questions ? room.questions.length : 0,
          timeLimit: room.timeLimit || 15,
          timeRemaining,
          timingSettings: room.timingSettings || { questionTime: 15, matrixTime: 4, leaderboardTime: 4 },
          optionCounts: room.optionCounts,
          leaderboard: sortedPlayers,
          answeredCount: Object.keys(room.answeredPlayers || {}).length,
          totalPlayers: room.players.length,
          hasAnswered: !!(room.answeredPlayers && room.answeredPlayers[socket.id]),
          playerAnswer: room.answeredPlayers ? room.answeredPlayers[socket.id] : null
        };

        // Host receives question text & options
        if (isHost && currentQuestion) {
          state.questionText = currentQuestion.questionText;
          state.options = currentQuestion.options;
          state.correctIndex = currentQuestion.correctIndex;
        }

        if (typeof callback === 'function') callback(state);
      } else {
        if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
      }
    });

    // Fetch current general room state
    socket.on('room:get-state', (payload, callback) => {
      const roomPin = payload?.roomPin || socket.data?.roomPin;
      if (roomPin && rooms.has(roomPin)) {
        const room = rooms.get(roomPin);
        if (typeof callback === 'function') {
          callback({
            success: true,
            room: {
              roomPin: room.roomPin,
              mode: room.mode,
              quizActive: room.quizActive,
              players: room.players,
              isHostConnected: !!io.sockets.sockets.get(room.hostSocketId)
            }
          });
        }
      } else {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Room not found' });
        }
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      rooms.forEach((room, pin) => {
        // If host disconnected
        if (room.hostSocketId === socket.id) {
          console.log(`[Host] Host disconnected from room ${pin}`);
          io.to(pin).emit('room:host-disconnected', {
            message: 'Host has temporarily disconnected.'
          });
        }

        // If player disconnected
        const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const removed = room.players.splice(playerIndex, 1)[0];
          console.log(`[Player] ${removed.playerName} left room ${pin}`);
          io.to(pin).emit('room:players-updated', room.players);

          // If a question was active and this player hadn't answered yet, check if all remaining answered
          if (room.questionActive && room.players.length > 0) {
            const answeredCount = Object.keys(room.answeredPlayers).length;
            if (answeredCount >= room.players.length) {
              endQuestion(io, room);
            }
          }
        }
      });
    });
  });
}

module.exports = {
  rooms,
  setupRoomHandler
};
