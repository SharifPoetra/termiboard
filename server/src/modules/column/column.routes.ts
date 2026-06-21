import { FastifyInstance } from 'fastify';
import {
  createColumnHandler,
  getColumnsByBoardHandler,
  updateColumnHandler,
  deleteColumnHandler,
} from './column.controller.js';

export const columnRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate, app.checkBoardAccess] }, createColumnHandler);
  app.get('/:boardId', { preHandler: [app.authenticate, app.checkBoardAccess] }, getColumnsByBoardHandler);
  app.patch('/:id', { preHandler: [app.authenticate, app.checkBoardAccess] }, updateColumnHandler);
  app.delete('/:id', { preHandler: [app.authenticate, app.checkBoardAccess] }, deleteColumnHandler);
};
