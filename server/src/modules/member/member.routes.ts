import { FastifyInstance } from 'fastify';
import { addMemberHandler, acceptInviteHandler, rejectInviteHandler, kickMemberHandler } from './member.controller.js';

export const memberRoutes = async (app: FastifyInstance) => {
  app.post('/invite', { preHandler: [app.authenticate] }, addMemberHandler);
  app.post('/invite/accept', { preHandler: [app.authenticate] }, acceptInviteHandler);
  app.post('/invite/reject', { preHandler: [app.authenticate] }, rejectInviteHandler);
  app.delete('/kick', { preHandler: [app.authenticate] }, kickMemberHandler);
};
