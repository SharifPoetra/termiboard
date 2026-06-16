import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';
import { Server } from 'socket.io';
import { initDatabase } from './database/db.ts';
import { initAuthMiddleware } from './middlewares/auth.middleware.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';
import { boardRoutes } from './modules/board/board.routes.ts';
import { columnRoutes } from './modules/column/column.routes.ts';
import { cardRoutes } from './modules/card/card.routes.ts';
import { memberRoutes } from './modules/member/member.routes.ts';

// Initialize Fastify Instance with Pino-Pretty logger
const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
      },
    },
  },
});

// Environment variables validation schema
const schema = {
  type: 'object',
  required: ['API_ADDR', 'API_PORT', 'DATABASE_URL', 'JWT_SECRET'],
  properties: {
    API_ADDR: { type: 'string', default: '127.0.0.1' },
    API_PORT: { type: 'string', default: '3001' },
    DATABASE_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
  },
};

const options = {
  confKey: 'config',
  schema: schema,
  dotenv: true,
};

// Register core infrastructure plugins
await app.register(fastifyEnv, options);
await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await app.register(fastifyJwt, {
  secret: app.config.JWT_SECRET,
});

// Initialize Authentication Hooks & Database Connection
await initAuthMiddleware(app);
await initDatabase(app);

// Initialize Socket.io and attach it to Fastify's HTTP server instance
const io = new Server(app.server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Decorate Fastify instance with 'io' to make it accessible across all controllers
app.decorate('io', io);

// Socket.io main connection handler and room isolation logic
io.on('connection', (socket) => {
  app.log.info(`⚡ User connected to WebSocket: ${socket.id}`);

  // Event listener for joining a specific board stream
  socket.on('join_board', (boardId: string) => {
    socket.join(boardId);
    app.log.info(`📁 Socket client ${socket.id} joined Board Room: ${boardId}`);
  });

  // Client disconnection clean-up handler
  socket.on('disconnect', () => {
    app.log.info(`❌ User disconnected from WebSocket: ${socket.id}`);
  });
});

// Features Routing Definitions
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(boardRoutes, { prefix: '/api/boards' });
await app.register(columnRoutes, { prefix: '/api/columns' });
await app.register(cardRoutes, { prefix: '/api/cards' });
await app.register(memberRoutes, { prefix: '/api/boards' });

// Health Check Endpoint
app.get('/health', async () => ({
  status: 'OK',
  message: 'TermiBoard API is online!',
}));

// Spin up the application server
const host = app.config.API_ADDR;
const port = Number(app.config.API_PORT);

try {
  const address = await app.listen({ port, host });
  app.log.info(`🚀 TermiBoard API listening on ${address}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
