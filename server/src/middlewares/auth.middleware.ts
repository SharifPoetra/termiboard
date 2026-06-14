import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export const initAuthMiddleware = async (app: FastifyInstance): Promise<void> => {
  // Decorate the app instance with an 'authenticate' hook function
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // app.jwt.verify will automatically look for the "Authorization: Bearer <TOKEN>" header
      await request.jwtVerify();
    } catch (err) {
      // If the token is missing, expired, or invalid, throw a 401 Unauthorized error
      return reply.status(401).send({
        status: 'fail',
        message: 'Unauthorized. Please provide a valid authentication token.',
      });
    }
  });
};
