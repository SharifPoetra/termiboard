import { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  updateProfileHandler,
  verifyOtpHandler,
  resendOtpHandler,
} from './auth.controller.ts';
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, updateProfileSchema } from './auth.schema.ts';

export const authRoutes = async (app: FastifyInstance) => {
  app.post('/register', { ...registerSchema, handler: registerHandler });
  app.post('/login', { ...loginSchema, handler: loginHandler });
  app.post('/verify-otp', { ...verifyOtpSchema, handler: verifyOtpHandler });
  app.post('/resend-otp', { ...resendOtpSchema, handler: resendOtpHandler });
  app.patch('/profile', { ...updateProfileSchema, preHandler: [app.authenticate], handler: updateProfileHandler });
};
