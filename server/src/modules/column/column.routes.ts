import { FastifyInstance } from 'fastify';
import { createColumnHandler, getColumnsByBoardHandler } from './column.controller.js';

export const columnRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate] }, createColumnHandler);
  app.get('/:boardId', { preHandler: [app.authenticate] }, getColumnsByBoardHandler);
};
