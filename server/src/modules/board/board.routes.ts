import { FastifyInstance } from 'fastify';
import {
  createBoardHandler,
  getBoardsHandler,
  getBoardByIdHandler,
  updateBoardHandler,
  deleteBoardHandler,
} from './board.controller.ts';

export const boardRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate] }, createBoardHandler);
  app.get('/', { preHandler: [app.authenticate] }, getBoardsHandler);
  app.get('/:id', { preHandler: [app.authenticate] }, getBoardByIdHandler);
  app.patch('/:id', { preHandler: [app.authenticate] }, updateBoardHandler);
  app.delete('/:id', { preHandler: [app.authenticate] }, deleteBoardHandler);
};
