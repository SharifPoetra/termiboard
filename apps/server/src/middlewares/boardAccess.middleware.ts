import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq, and, or } from 'drizzle-orm';
import { boardMembers, boards, columns, cards } from '@termiboard/core';

// Expand interface to support all parameter variations across columns and cards
interface RequestParams {
  id?: string;
  boardId?: string;
  columnId?: string;
}

export const initCheckBoardAccessMiddleware = async (app: FastifyInstance): Promise<void> => {
  app.decorate('checkBoardAccess', async (request: FastifyRequest, reply: FastifyReply) => {
    const { db } = request.server;
    const userId = (request.user as any).id;

    const body = request.body as any;
    const params = request.params as RequestParams;

    // Direct extraction from body or URL param
    let boardId = body?.boardId || params?.boardId;

    try {
      // Resolve via body.columnId (e.g., POST /api/cards)
      if (!boardId && body?.columnId) {
        const targetColumn = await db
          .select({ boardId: columns.boardId })
          .from(columns)
          .where(eq(columns.id, body.columnId));

        if (targetColumn.length > 0) boardId = targetColumn[0].boardId;
      }

      // Resolve via URL params.columnId (e.g., GET /api/cards/:columnId)
      if (!boardId && params?.columnId) {
        const targetColumn = await db
          .select({ boardId: columns.boardId })
          .from(columns)
          .where(eq(columns.id, params.columnId));

        if (targetColumn.length > 0) boardId = targetColumn[0].boardId;
      }

      // Resolve via direct entity UUID inside URL parameter (e.g., PATCH/DELETE /:id)
      if (!boardId && params?.id) {
        // Check if the parameter id belongs to a column
        const targetColumn = await db
          .select({ boardId: columns.boardId })
          .from(columns)
          .where(eq(columns.id, params.id));

        if (targetColumn.length > 0) {
          boardId = targetColumn[0].boardId;
        } else {
          // Fallback: Check if the parameter id belongs to a card instead
          const targetCard = await db
            .select({ boardId: columns.boardId })
            .from(cards)
            .innerJoin(columns, eq(cards.columnId, columns.id))
            .where(eq(cards.id, params.id));

          if (targetCard.length > 0) boardId = targetCard[0].boardId;
        }
      }

      // Allow core controllers to handle standard 404 routes naturally if no boardId can be resolved
      if (!boardId) return;

      // ⚡ OPTIMIZATION TRICK: Inject boardId into the request state container
      // This allows downstream handlers to reuse it without querying the DB again for Socket broadcast!
      (request as any).boardId = boardId;

      // AUTHORIZATION MATRIX
      const hasAccess = await db
        .selectDistinct()
        .from(boards)
        .leftJoin(boardMembers, eq(boards.id, boardMembers.boardId))
        .where(
          and(
            eq(boards.id, boardId),
            or(
              eq(boards.userId, userId), // Owner
              and(eq(boardMembers.userId, userId), eq(boardMembers.status, 'active')), // Active Collaborator
            ),
          ),
        );

      if (hasAccess.length === 0) {
        return reply.status(403).send({
          status: 'fail',
          message: 'ACCESS_DENIED: You are not an active collaborator in this board sector.',
        });
      }
    } catch (err) {
      request.server.log.error(err, 'Authorization middleware failure');
      return reply.status(500).send({
        status: 'error',
        message: 'Internal server error during authorization verification.',
      });
    }
  });
};
