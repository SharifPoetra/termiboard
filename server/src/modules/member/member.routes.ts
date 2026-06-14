import { FastifyInstance } from 'fastify';
import { addMemberHandler } from './member.controller.js';

export const memberRoutes = async (app: FastifyInstance) => {
  app.post('/invite', { preHandler: [app.authenticate] }, addMemberHandler);
};
