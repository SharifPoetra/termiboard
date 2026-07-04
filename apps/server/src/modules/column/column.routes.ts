import { FastifyInstance } from 'fastify';
import {
  createColumnHandler,
  getColumnsByBoardHandler,
  updateColumnHandler,
  deleteColumnHandler,
} from './column.controller.ts';
import {
  createColumnSchema,
  getColumnsByBoardSchema,
  updateColumnSchema,
  deleteColumnSchema,
} from './column.schema.ts';

export const columnRoutes = async (app: FastifyInstance) => {
  app.post('/', {
    ...createColumnSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: createColumnHandler,
  });
  app.get('/:boardId', {
    ...getColumnsByBoardSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: getColumnsByBoardHandler,
  });
  app.patch('/:id', {
    ...updateColumnSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: updateColumnHandler,
  });
  app.delete('/:id', {
    ...deleteColumnSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: deleteColumnHandler,
  });
};
