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

### 📂 Planned structures
```
client/src/
├── assets/             # Global static assets (images, favicon, global CSS)
├── components/         # Global & Reusable UI Components (Atomic Design)
│   ├── ui/             # Small/base components (Button.tsx, Input.tsx, Badge.tsx)
│   ├── layout/         # Layout components (Navbar.tsx, Sidebar.tsx, Footer.tsx)
│   └── shared/         # Shared composite components (Modal.tsx, LoadingSpinner.tsx)
│
├── features/           # Heart of the app (Feature-Based)
│   ├── auth/           # 🔐 Authentication Feature
│   │   ├── components/ # FormLogin.tsx, FormRegister.tsx
│   │   ├── pages/      # LoginPage.tsx, RegisterPage.tsx
│   │   └── types/      # auth.types.ts
│   │
│   ├── dashboard/      # 📊 Main Feature / Project Boards List
│   │   ├── components/ # BoardCard.tsx, CreateBoardModal.tsx
│   │   ├── pages/      # DashboardPage.tsx
│   │   └── types/      # dashboard.types.ts
│   │
│   └── kanban/         # 📋 Core Kanban Board Feature (Workspace)
│       ├── components/ # BoardHeader.tsx, ColumnContainer.tsx, CardItem.tsx
│       ├── pages/      # BoardDetailPage.tsx
│       ├── hooks/      # useKanbanSocket.ts (specifically handles WS for this board)
│       └── types/      # kanban.types.ts
│
├── hooks/              # Global Custom Hooks
│   ├── useSocket.ts    # Initialization & main gateway for Socket.io-client
│   └── useAuth.ts      # Quick bridge to check login status in router
│
├── lib/                # Third-party Configuration
│   └── axios.ts        # Global Axios instance (+ interceptor to inject JWT Token)
│
├── store/              # Centralized State Management (Zustand)
│   ├── authStore.ts    # Manages logged-in user data & token
│   └── boardStore.ts   # Manages realtime Board, Column, & Card data
│
├── App.tsx             # Router setup (Login Gatekeeper & Private Route)
└── main.tsx            # React application entry point
```

---
