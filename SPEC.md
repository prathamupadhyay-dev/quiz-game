# Project Architecture Blueprint (SPEC.md)

## 1. Tech Stack (MERN + Real-Time)
- **Frontend (`/client`):** React (Vite, standard JavaScript/JSX), Tailwind CSS, `socket.io-client`, `qrcode.react` (for room QR codes), DiceBear API (for custom student avatars).
- **Backend (`/server`):** Node.js, Express.js, `cors` package (enabled for both REST APIs and Socket.io so mobile devices on the same Wi-Fi/network can connect), `socket.io`, `mongoose`.
- **Database (`MongoDB`):** Mongoose schemas for permanent storage of Quizzes, Presentations, and Final Session Leaderboards.

## 2. Folder Structure
- `/client`
  - `/src/components` (AvatarPicker, HostNavbar, QRCodeModal, DanmakuOverlay)
  - `/src/pages` (Home, HostLobby, PlayerLobby, HostQuizView, PlayerQuizPad, HostPresenterView, PlayerPresenterView)
  - `/src/socket.js` (Single shared Socket.io client instance)
- `/server`
  - `index.js` (Express server, CORS setup, MongoDB connection, Socket.io initialization)
  - `/models` (`Quiz.js`, `Presentation.js`, `GameResult.js`)
  - `/routes` (`quizRoutes.js`, `presentationRoutes.js`)
  - `/socket` (`roomHandler.js` - manages in-memory active rooms for 50 concurrent players)

## 3. MongoDB Schemas
1. **Quiz Schema (`Quiz.js`):**
   - `title`: String
   - `questions`: Array of 10 objects `{ questionText: String, options: [String, String, String, String], correctIndex: Number, timeLimit: Number }`
2. **Presentation Schema (`Presentation.js`):**
   - `title`: String
   - `pdfUrl`: String
   - `totalSlides`: Number
3. **GameResult Schema (`GameResult.js`):**
   - `roomPin`: String
   - `mode`: String ("quiz" or "presenter")
   - `leaderboard`: Array of `{ playerName: String, avatarSeed: String, score: Number }`

## 4. Express REST API Endpoints (with CORS)
- `GET /api/quizzes` - Fetch all saved quizzes from MongoDB (plus seed a default 10-question demo quiz if empty).
- `POST /api/quizzes` - Save a new 10-question quiz to MongoDB.
- `POST /api/presentations` - Upload and save PDF slide deck metadata.
- `POST /api/results` - Save the final 50-player leaderboard to MongoDB after Question 10.

## 5. Socket.io Real-Time Events
### Lobby & Identity:
- `host:create-room` -> Generates a 6-digit `roomPin`, initializes room state in server memory.
- `player:join-room` -> `{ roomPin, playerName, avatarConfig }` -> Broadcasts `room:players-updated` to Host so the avatar pops up live on the projector.

### Module 1: Anti-Cheat 10-Question Quiz Arena:
- `host:start-question` -> `{ roomPin, questionIndex }` -> Host screen receives full question + 4 options; Player phones receive ONLY `{ questionIndex, timeLimit }` (no question/option text to prevent cheating).
- `player:submit-answer` -> `{ roomPin, optionIndex (0-3) }` -> Server calculates score using millisecond speed-decay: `1000 * (1 - (timeElapsed / timeLimit) * 0.5)` for correct answers.
- `host:end-question` -> Broadcasts `quiz:question-matrix` containing `{ optionCounts: [n, n, n, n], correctIndex, topLeaderboard }` to render the bar chart and rankings.
- `host:finish-quiz` -> Saves results to MongoDB and broadcasts `quiz:finale` with the podium and all participating avatars.

### Module 2: Live Interactive Slide Presenter:
- `host:change-slide` -> `{ roomPin, slideNumber }` -> Syncs slide view across all student phones.
- `player:send-danmaku` -> `{ roomPin, text, color }` -> Renders a floating bullet-comment across the Host projector screen.
- `player:mark-confused` -> `{ roomPin, slideNumber }` -> Increments the live "Confused Students" counter on the Host screen.
