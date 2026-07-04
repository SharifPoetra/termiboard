import { FastifyInstance } from 'fastify';
import {
  createBoardHandler,
  getBoardsHandler,
  getBoardByIdHandler,
  updateBoardHandler,
  deleteBoardHandler,
} from './board.controller.ts';
import {
  createBoardSchema,
  getBoardsSchema,
  getBoardByIdSchema,
  updateBoardSchema,
  deleteBoardSchema,
} from './board.schema.ts';

export const boardRoutes = async (app: FastifyInstance) => {
  app.post('/', { ...createBoardSchema, preHandler: [app.authenticate], handler: createBoardHandler });
  app.get('/', { ...getBoardsSchema, preHandler: [app.authenticate], handler: getBoardsHandler });
  app.get('/:id', { ...getBoardByIdSchema, preHandler: [app.authenticate], handler: getBoardByIdHandler });
  app.patch('/:id', { ...updateBoardSchema, preHandler: [app.authenticate], handler: updateBoardHandler });
  app.delete('/:id', { ...deleteBoardSchema, preHandler: [app.authenticate], handler: deleteBoardHandler });
};
