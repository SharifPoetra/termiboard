# TermiBoard Client Workspace 🌐

This directory houses the frontend user interface for **TermiBoard**, engineered with a retro-futuristic hacker/terminal aesthetic. It communicates with the backend server seamlessly using RESTful API endpoints for persistent state changes and WebSockets (`Socket.io`) for reactive, multi-user real-time board sync.

## 🚀 Implemented Features

### 🔐 1. Authentication Matrix

- **Secure Session Gatekeeper:** Full login and registration system.
- **JWT Authorization Interceptor:** Automated global token injection for every outgoing request via Axios interceptors.
- **Persistence Layer Store:** Synchronized global auth state via Zustand (`authStore.ts`).

### 📊 2. Operational Control Dashboard (`DashboardPage`)

- **Project Deployment:** Create, update, and permanently delete project boards.
- **Integrated Real-Time Notification Center:** \* A reactive `Bell` notification dropdown embedded directly into the header navigation bar.
  - Dynamic red notification count badge showing outstanding workspace invitations.
  - Real-time `invitation_received` WebSockets listener + database fallback sync upon application startup to survive page refresh.
  - Instant `[ ACCEPT ]` and `[ REJECT ]` handling for incoming board collaboration pipelines.

### 📋 3. Core Kanban Workspace (`BoardDetailPage`)

- **Multi-Lane Board Grid:** Render structured workflow status tracks using columns and task cards.
- **Drag-and-Drop Runtime Matrix:** Powered by `@dnd-kit/core` with custom `Pointer` and `Touch` sensors to ensure fluid interaction across both desktop and mobile layouts.
- **Responsive Control Interface:**
  - **Desktop Mode:** Dedicated inline action arrays for immediate board edits, board destruction, and collaborator invites.
  - **Mobile Matrix View:** Automatic responsive compression that combines advanced board operations (Invite, Edit, Delete) into a sleek `MoreVertical` dropdown overlay.

### 🔌 4. WebSocket Synchronization Gateway (`useSocket`)

- **Live Stream Reconciliation:** Listens to server-side broadcasts to reflect global changes instantaneously without triggering page reloads:
  - `board_updated` / `board_deleted` (with emergency redirection evacuation flags).
  - `column_created` / `column_updated` / `column_deleted`.
  - `card_created` / `card_updated` / `card_moved` / `card_deleted`.
- **Local Echo Supression:** Implements reference guards (`isLocallyDragging`) to suppress infinite UI re-render cycles while dragging local cards.

---

## 🛠️ Tech Stack & Dependencies

- **Core UI Engine:** React 18+ (TypeScript)
- **Style Framework:** Tailwind CSS (with slate-950 terminal matrix theme)
- **State Management:** Zustand (Lightweight centralized hooks)
- **Drag & Drop Layer:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Network Client:** Axios (REST API calls) & `socket.io-client` (Real-Time streams)
- **Icon Library:** `lucide-react`

---

### 📂 Current and Planned Structures

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
│   └── useSocket.ts    # Initialization & main gateway for Socket.io-client
│
│
├── lib/                # Third-party Configuration
│   └── axios.ts        # Global Axios instance (+ interceptor to inject JWT Token)
│
├── store/              # Centralized State Management (Zustand)
│   ├── authStore.ts    # Manages logged-in user data & token
│   ├── boardStore.ts   # Manages realtime Board, Column, & Card data
│   └── notificationStore.ts # Pending invitations and notification state
│
├── App.tsx             # Router setup (Login Gatekeeper & Private Route)
└── main.tsx            # React application entry point
```

---
