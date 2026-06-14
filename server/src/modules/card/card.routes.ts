import { FastifyInstance } from 'fastify';
import { createCardHandler, getCardsByColumnHandler, updateCardHandler, deleteCardHandler } from './card.controller.js';

export const cardRoutes = async (app: FastifyInstance) => {
  app.post('/', { preHandler: [app.authenticate] }, createCardHandler);
  app.get('/:columnId', { preHandler: [app.authenticate] }, getCardsByColumnHandler);
  app.patch('/:id', { preHandler: [app.authenticate] }, updateCardHandler);
  app.delete('/:id', { preHandler: [app.authenticate] }, deleteCardHandler);
};
