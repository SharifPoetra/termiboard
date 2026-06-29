import 'fastify';
import { Server } from 'socket.io';
import { TermiDb } from '../database/db.ts';
import { ServerToClientEvents, ClientToServerEvents } from '@termiboard/core';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      API_ADDR: string;
      API_PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
    };
    db: TermiDb;
    io: Server<ClientToServerEvents, ServerToClientEvents>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    checkBoardAccess: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
