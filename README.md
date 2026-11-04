# Quiz Game & Real-Time Classroom Arena

An interactive, real-time classroom quiz and presentation platform built on the MERN stack with Socket.io. Features an anti-cheat quiz arena with speed-decay scoring and an interactive live slide presenter with Danmaku bullet comments.

## 🚀 Features

- **Anti-Cheat Quiz Arena:**
  - Host screen displays the full question and options on the projector.
  - Player phones only receive answer buttons and a countdown timer to prevent screen-peeking and cheating.
  - Millisecond speed-decay scoring: faster correct answers earn higher points.
  - Live post-question response distribution charts and dynamic podium leaderboards.

- **Live Slide Presenter:**
  - Real-time synchronized slide transitions across all connected student devices.
  - Live Danmaku bullet comments floating across the host screen.
  - Real-time "Confused Students" feedback counter.

- **Seamless Lobby & Avatars:**
  - Room generation with 6-digit PIN and dynamic QR codes for instant mobile joining.
  - Custom student avatars generated using DiceBear API.

---

## 🛠️ Tech Stack

- **Frontend (`zync-pratham/client`):**
  - React 19 (Vite)
  - Tailwind CSS
  - Socket.io Client
  - React Router
  - QR Code (`qrcode.react`)
- **Backend (`zync-pratham/server`):**
  - Node.js & Express
  - Socket.io
  - MongoDB & Mongoose
  - CORS & Dotenv

---

## 📂 Project Structure

```
├── zync-pratham/
│   ├── client/              # React frontend application
│   │   ├── src/
│   │   │   ├── components/  # AvatarPicker, HostNavbar, QRCodeModal, DanmakuOverlay
│   │   │   ├── pages/       # Home, HostLobby, PlayerLobby, HostQuizView, PlayerQuizPad, etc.
│   │   │   └── socket.js    # Shared Socket.io client instance
│   │   └── package.json
│   └── server/              # Node/Express + Socket.io backend
│       ├── models/          # Mongoose schemas (Quiz, Presentation, GameResult)
│       ├── routes/          # REST API endpoints
│       ├── socket/          # Real-time room and game handlers
│       ├── index.js         # Server entry point
│       └── package.json
├── presentation.html        # Interactive presentation deck
├── SPEC.md                  # Complete architectural specifications
└── README.md                # Project overview and setup guide
```

---

## 🏁 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd zync-pratham/server
npm install
```
Create a `.env` file from `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/classroom_arena
NODE_ENV=development
```
Start the server:
```bash
npm start
# or with file watching:
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd zync-pratham/client
npm install
npm run dev
```
Open `http://localhost:5173` (or the URL displayed in the terminal) in your browser.
