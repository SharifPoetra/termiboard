import { FastifyInstance } from 'fastify';
import {
  createColumnHandler,
  getColumnsByBoardHandler,
  updateColumnHandler,
  deleteColumnHandler,
} from './column.controller.js';

export const columnRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate] }, createColumnHandler);
  app.get('/:boardId', { preHandler: [app.authenticate] }, getColumnsByBoardHandler);
  app.patch('/:id', { preHandler: [app.authenticate] }, updateColumnHandler);
  app.delete('/:id', { preHandler: [app.authenticate] }, deleteColumnHandler);
};
