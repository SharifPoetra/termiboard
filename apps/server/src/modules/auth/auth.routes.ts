import { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  updateProfileHandler,
  verifyOtpHandler,
  resendOtpHandler,
} from './auth.controller.ts';

export const authRoutes = async (app: FastifyInstance) => {
  app.post('/register', registerHandler);
  app.post('/login', loginHandler);
  app.post('/verify-otp', verifyOtpHandler);
  app.post('/resend-otp', resendOtpHandler);
  app.patch('/profile', { preHandler: app.authenticate }, updateProfileHandler);
};
