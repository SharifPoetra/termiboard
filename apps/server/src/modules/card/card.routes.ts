import { FastifyInstance } from 'fastify';
import { createCardHandler, getCardsByColumnHandler, updateCardHandler, deleteCardHandler } from './card.controller.ts';
import { createCardSchema, getCardsByColumnSchema, updateCardSchema, deleteCardSchema } from './card.schema.ts';

export const cardRoutes = async (app: FastifyInstance) => {
  app.post('/', {
    ...createCardSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: createCardHandler,
  });
  app.get('/:columnId', {
    ...getCardsByColumnSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: getCardsByColumnHandler,
  });
  app.patch('/:id', {
    ...updateCardSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: updateCardHandler,
  });
  app.delete('/:id', {
    ...deleteCardSchema,
    preHandler: [app.authenticate, app.checkBoardAccess],
    handler: deleteCardHandler,
  });
};
