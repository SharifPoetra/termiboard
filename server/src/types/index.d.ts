import 'fastify';
import { Server } from 'socket.io';
import { TermiDb } from '../database/db.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      API_ADDR: string;
      API_PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
    };
    db: TermiDb;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    io: Server;
  }
}
