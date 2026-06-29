import { FastifyInstance } from 'fastify';
import { registerHandler, loginHandler, updateProfileHandler } from './auth.controller.ts';

export const authRoutes = async (app: FastifyInstance) => {
  app.post('/register', registerHandler);
  app.post('/login', loginHandler);
  app.patch('/profile', { preHandler: app.authenticate }, updateProfileHandler);
};
