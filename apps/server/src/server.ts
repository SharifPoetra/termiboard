import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifyScalar from '@scalar/fastify-api-reference';
import { Server } from 'socket.io';
import TermiboardPackage from '../package.json' with { type: 'json' };
import { initDatabase } from './database/db.ts';
import { initAuthMiddleware } from './middlewares/auth.middleware.ts';
import { initCheckBoardAccessMiddleware } from './middlewares/boardAccess.middleware.ts';
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
  required: [
    'API_ADDR',
    'API_PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
  ],
  properties: {
    API_ADDR: { type: 'string', default: '127.0.0.1' },
    API_PORT: { type: 'string', default: '3001' },
    DATABASE_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    SMTP_HOST: { type: 'string' },
    SMTP_PORT: { type: 'number' },
    SMTP_USER: { type: 'string' },
    SMTP_PASS: { type: 'string' },
    SMTP_FROM: { type: 'string' },
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
  credentials: true,
});

await app.register(fastifyJwt, {
  secret: app.config.JWT_SECRET,
});

// Initialize Authentication Hooks & Database Connection
await initAuthMiddleware(app);
await initDatabase(app);
await initCheckBoardAccessMiddleware(app);

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

  // Event listener on user personal room notification subscription
  socket.on('subscribe_notifications', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} successfully locked into their personal notification room.`);
  });

  // Client disconnection clean-up handler
  socket.on('disconnect', () => {
    app.log.info(`❌ User disconnected from WebSocket: ${socket.id}`);
  });
});

// Initialize swagger docs
await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'TermiBoard API',
      description: 'Real-time collaborative Kanban board backend',
      version: TermiboardPackage.version,
    },
    // servers: [
    //   {
    //     url: `http://${app.config.API_ADDR}:${app.config.API_PORT}`,
    //     description: 'Development server',
    //   },
    // ],
    tags: [
      { name: 'Auth', description: 'Authentication & user management' },
      { name: 'Boards', description: 'Project boards operations' },
      { name: 'Columns', description: 'Board columns management' },
      { name: 'Cards', description: 'Task cards management' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

// Initialize docs UI
await app.register(fastifyScalar, {
  routePrefix: '/docs',
  configuration: {
    theme: 'dark',
    showSidebar: true,
    layout: 'modern',
    hideDownloadButton: true,
    hideTestRequestButton: true,
    hideClientButton: true,
    hideModels: true,
    hiddenClients: true,
    agent: {
      disabled: true,
    },
    mcp: {
      disabled: true,
    },
    metaData: {
      title: 'TermiboardAPI',
      description: 'Real-time collaborative Kanban board backend',
      ogDescription: 'Real-time collaborative Kanban board backend',
      ogTitle: 'Termiboard API',
      ogImage: 'https://termiboard.sharif.my.id/favicon.png',
      twitterCard: 'https://termiboard.sharif.my.id/logo-preview.png',
    },
  },
});

// Features Routing Definitions
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(boardRoutes, { prefix: '/api/boards' });
await app.register(columnRoutes, { prefix: '/api/columns' });
await app.register(cardRoutes, { prefix: '/api/cards' });
await app.register(memberRoutes, { prefix: '/api/boards' });

// Home Endpoint
app.get('/', async (_request, reply) => {
  reply.status(200).send({
    status: 'OK',
    message: 'Termiboard API',
    docs: '/docs',
    api: '/api',
  });
});

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
