# ZYNC Admin Portal (zync-pratham)

ZYNC is a role-based classroom quiz and live slides platform. Five developers build separate applications that cooperate exclusively through ONE shared MongoDB database named `zync`.

This folder (`zync-pratham`) contains the complete ADMIN portal service and interface. Only users with the role `admin` can enter this portal.

---

## 1. Quick Start and Run Steps

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Server Setup (`zync-pratham/server`)
1. Open terminal in `zync-pratham/server`:
   ```bash
   cd zync-pratham/server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (or copy from `.env.example`):
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/zync
   JWT_SECRET=zync_shared_jwt_secret_key_2026
   CLIENT_ORIGIN=http://localhost:5171
   STUDENT_URL=http://localhost:5172
   ADMIN_EMAIL=admin@zync.local
   ADMIN_PASSWORD=Demo@123
   ```
   *Note: If `MONGODB_URI` is left blank, the server will start successfully and log "Database not configured yet".*
4. Run the seed script:
   ```bash
   npm run seed
   ```
   *This seeds the admin account (`admin@zync.local`), demo staff accounts, 6 starter vector avatars, default categories, and platform settings. Seed password for demo users is `Demo@123`. Seed operations use upserts by key/email to avoid duplicate records.*
5. Start the backend server:
   ```bash
   npm start
   # or development mode:
   npm run dev
   ```
   The admin API server listens on `http://localhost:5001`.

### Client Setup (`zync-pratham/client`)
1. Open terminal in `zync-pratham/client`:
   ```bash
   cd zync-pratham/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite development server:
   ```bash
   npm run dev
   ```
   The client application opens on `http://localhost:5171`.

---

## 2. Ports and Architecture Overview

| Role / Scope | Developer | Server Port | Client Port | URL |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Pratham | **5001** | **5171** | `http://localhost:5171` |
| **Student** | Dhruv | 5002 | 5172 | `http://localhost:5172` |
| **Teacher quizzes** | Ramya | 5003 | 5173 | `http://localhost:5173` |
| **Moderator & slides** | Utkarsh | 5004 | 5174 | `http://localhost:5174` |
| **Principal** | Nihal | 5005 | 5175 | `http://localhost:5175` |

### Cross-Origin Resource Sharing (CORS)
All servers allow CORS requests across all five client origins:
- `http://localhost:5171`
- `http://localhost:5172`
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`

---

## 3. Authentication & Authorization Contract

- **Staff Roles**: `admin`, `principal`, `teacher`, `moderator`. Students never log in; they join games as guests using a 6-digit PIN.
- **Login Endpoint**: `POST /api/auth/login` with `{ email, password }`.
- **Password Hashing**: Salted bcrypt (`bcryptjs`).
- **Token Format**: HS256 JWT, signed with shared `JWT_SECRET`, valid for 8 hours.
  - Payload: `{ userId, role, name }`
- **Portal Segregation**:
  - Each portal accepts only its designated roles.
  - When a user with another role attempts login in the admin portal, the server rejects with status 403 and the UI displays:
    `Use the <portal name> portal` with a clickable hyperlink to that portal's URL.
  - Users with `disabled: true` cannot log in and receive an account disabled notice.
  - Clients store the token in `localStorage` and redirect to `/login` upon any HTTP 401 response.

---

## 4. Shared Database Contract (Exact MongoDB Collections)

All five developer applications connect to the shared database `zync` using identical collection schemas without renaming, adding, or removing shared fields.

### `users` (Collection: `users`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | required | Staff user full name |
| `email` | String | required, unique, lowercase, index | Email address |
| `passwordHash` | String | required | Bcrypt password hash |
| `role` | String | required, enum: `admin`, `principal`, `teacher`, `moderator` | Staff authorization role |
| `createdBy` | ObjectId | ref: `User`, default: null | Admin or creator identifier |
| `access` | Object | `{ canCreateQuiz: Boolean, canPresentSlides: Boolean }` | Teacher / moderator permissions |
| `assignedTeacherIds`| [ObjectId] | ref: `User` | Assigned teachers for moderators |
| `disabled` | Boolean | default: false | Account active / inactive flag |
| `createdAt` | Date | default: Date.now | Account creation timestamp |

### `avatars` (Collection: `avatars`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | required | Avatar title |
| `shape` | String | required, enum: `circle`, `square`, `triangle`, `diamond`, `hexagon`, `star` | Vector shape type |
| `color` | String | required | Primary shape color hex code |
| `accentColor` | String | required | Secondary accent color hex code |
| `active` | Boolean | default: true | Student selection availability |
| `createdBy` | ObjectId | ref: `User` | Admin creator identifier |

### `categories` (Collection: `categories`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | required | Category topic title |
| `createdBy` | ObjectId | ref: `User` | Admin creator identifier |

### `settings` (Collection: `settings`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `key` | String | required, unique | Setting key: `defaultTimeLimit`, `maxPlayersPerGame`, `joinEnabled` |
| `value` | Mixed | required | Setting configuration value |

### `quizzes` (Collection: `quizzes`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | required | Quiz title |
| `categoryId` | ObjectId | ref: `Category`, required | Associated topic |
| `ownerId` | ObjectId | ref: `User`, required | Author teacher / admin |
| `questions` | Array | `[{ text, options: [4 strings], correctIndex: 0..3, timeLimit: seconds }]` | Question items |
| `lastEditedBy` | ObjectId | ref: `User` | User who last updated |
| `createdAt` | Date | default: Date.now | Created timestamp |
| `updatedAt` | Date | default: Date.now | Updated timestamp |

### `slideDecks` (Collection: `slideDecks`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | required | Deck title |
| `ownerId` | ObjectId | ref: `User`, required | Author staff member |
| `slides` | Array | `[{ title: String, body: String }]` | Slide entries |
| `createdAt` | Date | default: Date.now | Created timestamp |
| `updatedAt` | Date | default: Date.now | Updated timestamp |

### `games` (Collection: `games`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | required, enum: `quiz`, `slides` | Game mode |
| `pin` | String | required, 6 digits, index | Session join PIN |
| `hostId` | ObjectId | ref: `User`, required | Teacher host |
| `refId` | ObjectId | required | Quiz ID or SlideDeck ID |
| `status` | String | enum: `lobby`, `question`, `results`, `live`, `ended`, default: `lobby` | Game status |
| `currentIndex` | Number | default: -1 for quiz, 0 for slides | Active question or slide index |
| `questionStartedAt`| Date | default: null | Timestamp when question started |
| `createdAt` | Date | default: Date.now | Game creation timestamp |
| `endedAt` | Date | default: null | Game conclusion timestamp |

### `players` (Collection: `players`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `gameId` | ObjectId | ref: `Game`, required, index | Game session reference |
| `nickname` | String | required | Student display nickname |
| `avatarId` | ObjectId | ref: `Avatar`, required | Selected avatar reference |
| `sessionToken` | String | required | Guest session authorization token |
| `status` | String | enum: `active`, `muted`, `kicked`, `banned`, default: `active` | Player state |
| `score` | Number | default: 0 | Total accumulated score |
| `joinedAt` | Date | default: Date.now | Session join timestamp |

### `answers` (Collection: `answers`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `gameId` | ObjectId | ref: `Game`, required | Game session reference |
| `playerId` | ObjectId | ref: `Player`, required | Player reference |
| `questionIndex`| Number | required | Question index |
| `choice` | Number | required, 0 to 3 | Selected option index |
| `timeMs` | Number | required | Elapsed time in milliseconds |
| `correct` | Boolean | required | Correctness evaluation |
| `points` | Number | required | Computed score points |

### `comments` (Collection: `comments`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `gameId` | ObjectId | ref: `Game`, required | Game session reference |
| `playerId` | ObjectId | ref: `Player`, required | Comment author |
| `slideIndex` | Number | required | Slide index reference |
| `text` | String | required | Comment text |
| `removed` | Boolean | default: false | Moderation status |
| `createdAt` | Date | default: Date.now | Timestamp |

### `confused` (Collection: `confused`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `gameId` | ObjectId | ref: `Game`, required | Game session reference |
| `playerId` | ObjectId | ref: `Player`, required | Player reference |
| `slideIndex` | Number | required | Slide index reference |
| `createdAt` | Date | default: Date.now | Reaction timestamp |

### `moderationLogs` (Collection: `moderationLogs`)
| Field | Type | Attributes / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `gameId` | ObjectId | ref: `Game`, required | Game session reference |
| `moderatorId` | ObjectId | ref: `User`, required | Staff moderator |
| `playerId` | ObjectId | ref: `Player` | Targeted player |
| `action` | String | required, enum: `mute`, `unmute`, `kick`, `ban`, `remove_comment`, `edit_question` | Action type |
| `note` | String | default: '' | Reason or note |
| `createdAt` | Date | default: Date.now | Logged timestamp |

---

## 5. Live State & Game Rules

1. **No Sockets**:
   - Because 5 different servers run independently, they cannot share in-memory socket state.
   - The shared MongoDB database is the live state.
   - Every client polls its respective server every 1000 ms, and the server reads MongoDB.
2. **Quiz Flow**:
   - Host creates `games` doc (`status: "lobby"`, unique 6-digit PIN among active games).
   - Start or Next sets `status: "question"`, increments `currentIndex`, and sets `questionStartedAt = now`.
   - Reveal sets `status: "results"`.
   - End sets `status: "ended"` and `endedAt = now`.
3. **Slides Flow**:
   - Host starts deck (`type: "slides"`, `status: "live"`).
   - `currentIndex` denotes the active slide index.
4. **Student Join**:
   - `POST /api/join` with `{ pin, nickname, avatarId }`.
   - Returns `sessionToken`.
   - Must reject join if game is ended, `joinEnabled` setting is false, nickname is taken in that game, or a banned player with that nickname exists.
5. **Scoring Formula**:
   - Correct answer: `round(1000 * (1 - (timeMs / (timeLimit * 1000)) / 2))`.
   - Wrong answer or late answer scores 0.
   - Answers submitted after `timeLimit` are rejected.
   - Exactly one answer allowed per player per question.
   - Student server writes to `answers` and adds points to `players.score`.
6. **Student Interface**:
   - Student screen displays only 4 answer shapes (triangle, diamond, circle, square).
   - Question text is displayed exclusively on the teacher host screen. The student server never sends question text or `correctIndex`.
7. **Moderation Rules**:
   - Muted players cannot post comments.
   - Kicked or banned players receive HTTP 403 on requests, displaying "You were removed from this game".

---

## 6. iOS Minimal Dark Design System Reference

- **CSS Variables** (`client/src/theme.css`):
  ```css
  :root {
    --bg: #000000;
    --surface: #1C1C1E;
    --surface-2: #2C2C2E;
    --separator: rgba(84, 84, 88, 0.65);
    --label: #FFFFFF;
    --label-2: rgba(235, 235, 245, 0.60);
    --label-3: rgba(235, 235, 245, 0.30);
    --accent: #5E5CE6;
    --red: #FF453A;
    --blue: #0A84FF;
    --green: #30D158;
    --yellow: #FFD60A;
    --orange: #FF9F0A;
    --glass: rgba(28, 28, 30, 0.72);
    --radius-window: 26px;
    --radius-card: 20px;
    --radius-field: 12px;
    --font: -apple-system, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif;
  }
  ```
- **Rules**:
  - NO emojis, emoticons, or Unicode pictographs anywhere in UI text, comments, logs, or seed data.
  - Line icons only (`lucide-react`, stroke 1.75).
  - Sentence case formatting for all titles and labels.
  - Type scale: Large Title (34/41 bold), Title (28/34 bold), Headline (17/22 semibold), Body (17/22), Subheadline (15/20), Footnote (13/18).
  - Rounded numerals (`font-rounded-num`, `tabular-nums`) for PINs, timers, and scores.
  - 4px grid; minimum 44px hit targets.
  - Glass effect only on toolbar (52px), sidebar (260px), sheets, and floating controls.
  - Content cards are solid `var(--surface)` with 1px separator.
  - Quiz answer colors (red, blue, yellow, green) are strictly reserved for answer shapes and chart bars.

---

## 7. Model Verification Checklist for All Five Folders

To maintain database interoperability across all 5 independent apps, ensure every folder adheres to this checklist:
- [x] Database name is configured as `zync`.
- [x] Exact collection names are explicitly specified in Mongoose model definitions (`users`, `avatars`, `categories`, `settings`, `quizzes`, `slideDecks`, `games`, `players`, `answers`, `comments`, `confused`, `moderationLogs`).
- [x] No custom fields added, removed, or renamed from the shared schemas.
- [x] Bcrypt password hashing used for staff authentication.
- [x] Shared JWT secret with HS256 algorithm and 8-hour expiration.
- [x] 1000ms REST polling with direct MongoDB queries (no sockets).
- [x] No emoji in seed data or UI text.
