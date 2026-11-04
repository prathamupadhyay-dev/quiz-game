const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');

// In-memory quizzes store for custom quizzes created during the session
// (guarantees functionality even when local MongoDB is offline)
const inMemoryQuizzes = [];

// No-op seed helper (pre-seeded quizzes removed per user request)
async function seedDefaultQuizIfEmpty() {
  // Purely custom quiz mode: no pre-seeded quizzes
  console.log('[Quiz] Pure custom quiz mode active (no pre-seeded quizzes).');
}

// GET /api/quizzes - List all custom quizzes
router.get('/', async (req, res) => {
  try {
    let dbQuizzes = [];
    try {
      dbQuizzes = await Quiz.find().sort({ createdAt: -1 });
    } catch (dbErr) {
      // DB error or disconnected
    }

    // Merge in-memory custom quizzes
    const dbIds = new Set(dbQuizzes.map((q) => String(q._id)));
    const allQuizzes = [...dbQuizzes];
    for (const mem of inMemoryQuizzes) {
      if (!dbIds.has(String(mem._id))) {
        allQuizzes.push(mem);
      }
    }

    return res.json({
      success: true,
      quizzes: allQuizzes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, quizzes: inMemoryQuizzes });
  }
});

// GET /api/quizzes/:id - Fetch single quiz
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let quiz = null;

    try {
      quiz = await Quiz.findById(id);
    } catch (e) {
      // not a valid ObjectId or DB down
    }

    if (!quiz) {
      quiz = inMemoryQuizzes.find((q) => q._id === id || String(q._id) === String(id));
    }

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    return res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/quizzes - Create custom quiz
router.post('/', async (req, res) => {
  try {
    const { title, questions } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title and an array of questions are required.'
      });
    }

    // Sanitize and validate questions
    const sanitizedQuestions = questions.map((q, idx) => ({
      questionText: q.questionText || `Question ${idx + 1}`,
      options: (q.options && q.options.length === 4) ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      timeLimit: typeof q.timeLimit === 'number' && q.timeLimit > 0 ? q.timeLimit : undefined
    }));

    let createdQuiz = null;
    try {
      createdQuiz = await Quiz.create({ title, questions: sanitizedQuestions });
      console.log(`[Quiz] Saved custom quiz in MongoDB: "${title}" (${sanitizedQuestions.length} questions)`);
    } catch (dbErr) {
      // Fallback save in memory
      createdQuiz = {
        _id: 'custom-' + Date.now(),
        title,
        description: `Custom Quiz (${sanitizedQuestions.length} Questions)`,
        questions: sanitizedQuestions,
        createdAt: new Date().toISOString()
      };
      inMemoryQuizzes.unshift(createdQuiz);
      console.log(`[Quiz] Saved custom quiz in memory: "${title}" (${sanitizedQuestions.length} questions)`);
    }

    res.status(201).json({ success: true, quiz: createdQuiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = {
  router,
  inMemoryQuizzes,
  seedDefaultQuizIfEmpty
};
