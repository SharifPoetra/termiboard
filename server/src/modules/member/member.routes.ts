import { FastifyInstance } from 'fastify';
import { addMemberHandler, kickMemberHandler } from './member.controller.js';

export const memberRoutes = async (app: FastifyInstance) => {
  app.post('/invite', { preHandler: [app.authenticate] }, addMemberHandler);
  app.delete('/kick', { preHandler: [app.authenticate] }, kickMemberHandler);
};
