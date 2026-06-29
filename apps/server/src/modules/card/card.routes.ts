import { FastifyInstance } from 'fastify';
import { createCardHandler, getCardsByColumnHandler, updateCardHandler, deleteCardHandler } from './card.controller.js';

export const cardRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate, app.checkBoardAccess] }, createCardHandler);
  app.get('/:columnId', { preHandler: [app.authenticate, app.checkBoardAccess] }, getCardsByColumnHandler);
  app.patch('/:id', { preHandler: [app.authenticate, app.checkBoardAccess] }, updateCardHandler);
  app.delete('/:id', { preHandler: [app.authenticate, app.checkBoardAccess] }, deleteCardHandler);
};
