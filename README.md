# TermiBoard Monorepo 🚀

Welcome to the official repository of **TermiBoard**, a real-time collaborative Kanban board application designed for seamless team workflows. This project is structured as a modern decoupled **TypeScript Monorepo** powered by **NPM Workspaces**.

## 📂 Project Structure

```text
termiboard/
├── client/              # Frontend Workspace (UI Application)
├── server/              # Backend Workspace (Fastify API & Socket.io)
├── package.json         # Global Workspace Config & Dev Dependencies
└── tsconfig.base.json   # Shared Global TypeScript Configurations
```

## 🛠️ Global Requirements
Before spinning up the environment, ensure you have the following installed:
 * **Node.js** (v22+ recommended)
 * **NPM** (v10+)
 * A running **PostgreSQL** instance (or Supabase/Neon URL)

## 🚀 Quick Start Guide

### 1. Monorepo Installation
Clone the repository and install all dependencies for **both** workspaces simultaneously from the root directory:
```bash
npm install
```

### 2. Environment Variables Setup
Go to the server/ directory and create your configuration file:
```bash
cp server/.env.example server/.env
```

*Make sure to fill out the DATABASE_URL and JWT_SECRET inside server/.env.*

### 3. Running the Projects
| Command | Action | Workspace Target |
|---|---|---|
| npm run dev:server | Starts the Fastify API with hot-reload (tsx watch) | @termiboard/server |
| npm run build:server | Compiles production-ready TypeScript code into /dist | @termiboard/server |
| npm run build:client | Triggers the frontend compilation pipeline | @termiboard/client |

## 🔒 Shared Code Quality Guard
This monorepo enforces shared linting and styling across all workspaces located at the root layer:
 * **Code Formatter:** Prettier configured via .prettierrc
 * **Linter Static Analysis:** ESLint configured via eslint.config.js

## 📝 Authors
 * [**SharifPoetra**](https://github.com/SharifPoetra/) - *Core Architect & Backend Developer*

## 📄 License
This software artifact is licensed under the terms of the formal **MIT License**. Check out the fully detailed copy inside the root repository [LICENSE](LICENSE) file for deep permissions mapping.

---
