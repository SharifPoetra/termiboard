import { FastifyInstance } from 'fastify';
import { createBoardHandler, getBoardsHandler } from './board.controller.ts';

export const boardRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate] }, createBoardHandler);
  app.get('/', { preHandler: [app.authenticate] }, getBoardsHandler);
};
