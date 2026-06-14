import { FastifyInstance } from 'fastify';
import { registerHandler, loginHandler } from './auth.controller.ts';

export const authRoutes = async (app: FastifyInstance) => {
  // Define POST /api/auth/register route
  app.post('/register', registerHandler);
  // Define POST /api/auth/login route
  app.post('/login', loginHandler);
};
