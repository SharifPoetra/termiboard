# TermiBoard Client Workspace 🌐

This directory houses the frontend user interface for **TermiBoard**. It communicates with the backend server seamlessly using RESTful API endpoints for persistent state changes and WebSockets (`Socket.io`) for reactive, real-time board updates.

## 🧪 Current State: Real-Time Diagnostic Dashboard
Right now, this workspace contains a dedicated **WebSocket Diagnostic System** (`test-ws.html`) designed to test real-time collaboration protocols before building out the full UI layout.

### Features covered in current diagnostics:
* 🚪 **Room Joining:** Securely bounds socket stream to a specific board channel (`join_board`).
* 🏛️ **Column Listeners:** Live logs for `column_created`, `column_updated`, and `column_deleted`.
* 🃏 **Card Listeners:** Live logs for `card_created`, `card_moved`, `card_updated`, and `card_deleted`.

---

## 🛠️ How to Launch the Diagnostics

1. Ensure the backend server is running up at `http://127.0.0.1:3001`.
2. Open the `test-ws.html` file using a local static browser server or directly via terminal preview tools of your choice.
3. Authenticate with a valid JWT token generated from the REST API to monitor incoming event payloads dynamically.

---

## 🗺️ Frontend Roadmap
The target UI will eventually be engineered with modern reactive frameworks, aiming for:
1. **State Management:** Optimistic UI updates to render dragging movements instantly.
2. **Interactive Board Layout:** Drag-and-drop support for switching card positions across columns effortlessly.
3. **Collaborative Presence:** Visual indicators showing other active members currently viewing the board room.

---
