# ZYNC Project Inventory & Consolidation Plan

Generated: 2026-11-04
Root Folder: `E:\AL-MERN\first-jsx\MERN-PROJECT`

---

## 1. Discovered Assets Across the System

| Path | Contents | Status / Architecture |
| :--- | :--- | :--- |
| `E:\AL-MERN\first-jsx\ADMIN\zync-pratham` | Full Admin Portal (`client` & `server`) | **Complete & Working (REST + MongoDB)**. Contains shared schemas, seed scripts, auth middleware, iOS minimal dark theme, and admin management pages. |
| `E:\AL-MERN\first-jsx\MERN-PROJECT\zync-pratham` | Prototype Quiz & Slides Engine (`client` & `server`) | Working Socket.io prototype. Contains Host/Player components, Avatar picker, question matrix, and scoring algorithms. |
| `E:\AL-MERN\first-jsx\MERN-PROJECT\admin` | Empty directory | Placeholder created in root. |
| `E:\AL-MERN\first-jsx\MERN-PROJECT\principle` / `zync-nehal` | Empty directories | Missing Principal portal code. |
| `E:\AL-MERN\first-jsx\MERN-PROJECT\teacher` / `zync-ramya` | Empty directories | Missing Teacher portal code. |
| `E:\AL-MERN\first-jsx\MERN-PROJECT\student` / `zync-dhruv` | Empty directories | Missing Student portal code. |
| `E:\AL-MERN\first-jsx\MERN-PROJECT\moderator` / `zync-utkarsh` | Empty directories | Missing Moderator & Slides portal code. |
| `E:\AL-MERN\first-jsx\backend\.env` | MongoDB Atlas credentials | Working connection verified with public DNS resolvers (`8.8.8.8`, `1.1.1.1`). |
| `C:\Users\prath\Downloads\controlled_chaos_zync_project_presentation.html` | Presentation blueprint | Complete system requirements and module definitions. |

---

## 2. Consolidation & Build Decisions

| Portal | Source / Strategy | Ports (Server / Client) | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** (`admin/`) | Copied from `E:\AL-MERN\first-jsx\ADMIN\zync-pratham` | 5001 / 5171 | User management, role assignment, vector avatars, categories, settings, quiz oversight, slides oversight, system health & seed scripts. |
| **Principal** (`principal/`) | Built from specification adhering to shared schemas | 5005 / 5175 | Institutional dashboard, school analytics, teacher performance, student engagement metrics, audit logs, category reports, and game session oversight. |
| **Teacher** (`teacher/`) | Built from specification, integrating UI components from prototype | 5003 / 5173 | Quiz builder, live quiz hosting with 6-digit PIN, projector arena view, question countdown, dynamic response matrix chart, podium rankings, REST polling every 1000ms. |
| **Student** (`student/`) | Built from specification, integrating mobile controller UI | 5002 / 5172 | Guest login via PIN, avatar selection, anti-cheat 4-button color response pad (speed-decay points calculation), live slide viewer, Danmaku comment sender, and confused reaction button. |
| **Moderator & Slides** (`moderator/`) | Built from specification adhering to shared schemas | 5004 / 5174 | Real-time game moderation (mute, kick, ban, comment removal, log actions), plus Teacher Live Slide Presenter (deck controls, slide sync, floating comments, and live confused counter). |

---

## 3. Archive Actions
- Existing empty folders (`zync-dhruv`, `zync-nehal`, `zync-ramya`, `zync-utkarsh`, etc.) and the original prototype will be moved safely to `ROOT/_archive/` to preserve historical work without cluttering the active workspace.
