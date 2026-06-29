# TermiBoard Monorepo 🚀

Welcome to the official repository of **TermiBoard**, a real-time collaborative Kanban board application designed for seamless team workflows. This project is structured as a modern decoupled **TypeScript Monorepo** powered by **NPM Workspaces** (or your preferred package manager).

## 📂 Project Structure

```text
termiboard/
├── apps/
│   ├── client-web/        # Frontend Workspace (React + Vite UI Application)
│   ├── client-android/    # Mobile Workspace (Upcoming Android Application)
│   └── server/            # Backend Workspace (Fastify API & Socket.io)
├── packages/              # Shared Modules & Cross-Platform Utilities (Upcoming)
│   └── shared-types/      # Shared TypeScript types, Drizzle schemas, and Socket events
├── package.json           # Global Workspace Config & Dev Dependencies
└── tsconfig.base.json     # Shared Global TypeScript Configurations
```

## 🛠️ Global Requirements

Before spinning up the environment, ensure you have the following installed:

- **Node.js** (v22+ recommended)
- **NPM** (v10+) / **pnpm** / **Yarn**
- A running **PostgreSQL** instance (or Supabase/Neon URL)

## 🚀 Quick Start Guide

### 1. Monorepo Installation

Clone the repository and install all dependencies for all workspaces simultaneously from the root directory:

```bash
npm install

```

### 2. Environment Variables Setup

Configure your environment variables by copying the examples provided in the respective application folders:
**Backend Server:**

```bash
cp apps/server/.env.example apps/server/.env

```

_Make sure to fill out the DATABASE_URL and JWT_SECRET inside apps/server/.env._
**Web Client:**

```bash
cp apps/client-web/.env.example apps/client-web/.env

```

### 3. Running the Projects

You can run specific workspaces directly from the root using workspace flags:
| Command | Action | Workspace Target |
|---|---|---|
| npm run dev:server | Starts the Fastify API with hot-reload | apps/server |
| npm run dev:client-web | Starts the Vite development server | apps/client-web |
| npm run build:server | Compiles production-ready backend code | apps/server |
| npm run build:client-web | Triggers the frontend compilation pipeline | apps/client-web |

## 🔒 Shared Code Quality Guard

This monorepo enforces shared linting and styling across all workspaces located at the root layer:

- **Code Formatter:** Prettier configured via .prettierrc
- **Linter Static Analysis:** ESLint configured via eslint.config.js

## 📝 Authors

- [**SharifPoetra**](https://github.com/SharifPoetra/) - _Core Architect & Backend Developer_

## 📄 License

This software artifact is licensed under the terms of the formal **MIT License**. Check out the fully detailed copy inside the root repository [LICENSE](LICENSE) file for deep permissions mapping.

---

```

```
