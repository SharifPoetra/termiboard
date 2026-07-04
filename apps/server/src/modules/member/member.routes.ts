import { FastifyInstance } from 'fastify';
import {
  addMemberHandler,
  getPendingInvitationsHandler,
  acceptInviteHandler,
  rejectInviteHandler,
  kickMemberHandler,
} from './member.controller.ts';
import {
  addMemberSchema,
  getPendingInvitationsSchema,
  acceptInviteSchema,
  rejectInviteSchema,
  kickMemberSchema,
} from './member.schema.ts';

export const memberRoutes = async (app: FastifyInstance) => {
  app.post('/invite', { ...addMemberSchema, preHandler: [app.authenticate], handler: addMemberHandler });
  app.get('/invite/pending', {
    ...getPendingInvitationsSchema,
    preHandler: [app.authenticate],
    handler: getPendingInvitationsHandler,
  });
  app.post('/invite/accept', { ...acceptInviteSchema, preHandler: [app.authenticate], handler: acceptInviteHandler });
  app.post('/invite/reject', { ...rejectInviteSchema, preHandler: [app.authenticate], handler: rejectInviteHandler });
  app.delete('/kick', { ...kickMemberSchema, preHandler: [app.authenticate], handler: kickMemberHandler });
};
