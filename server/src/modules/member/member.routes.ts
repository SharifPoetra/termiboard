import { FastifyInstance } from 'fastify';
import {
  addMemberHandler,
  getPendingInvitationsHandler,
  acceptInviteHandler,
  rejectInviteHandler,
  kickMemberHandler,
} from './member.controller.js';

export const memberRoutes = async (app: FastifyInstance) => {
  app.post('/invite', { preHandler: [app.authenticate] }, addMemberHandler);
  app.get('/invite/pending', { preHandler: [app.authenticate] }, getPendingInvitationsHandler);
  app.post('/invite/accept', { preHandler: [app.authenticate] }, acceptInviteHandler);
  app.post('/invite/reject', { preHandler: [app.authenticate] }, rejectInviteHandler);
  app.delete('/kick', { preHandler: [app.authenticate] }, kickMemberHandler);
};
