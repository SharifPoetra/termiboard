import { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { boards } from '../../database/schema.ts';

// Request body and params interfaces
interface CreateBoardBody {
  name: string;
  description?: string;
}

interface UpdateBoardBody {
  name?: string;
  description?: string;
}

interface BoardParams {
  id: string;
}

// Handler to create a new board
export const createBoardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { name, description } = request.body as CreateBoardBody;
  const { db } = request.server;

  // request.user is automatically populated by @fastify/jwt after successful authentication
  const userId = (request.user as any).id;

  try {
    const newBoard = await db
      .insert(boards)
      .values({
        userId,
        name,
        description: description || null,
      })
      .returning({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        createdAt: boards.createdAt,
      });

    return reply.status(201).send({
      status: 'success',
      message: 'Board created successfully',
      data: {
        board: newBoard[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Create board failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Handler to get all boards for the logged-in user
export const getBoardsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { db } = request.server;
  const userId = (request.user as any).id;

  try {
    const userBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        createdAt: boards.createdAt,
      })
      .from(boards)
      .where(eq(boards.userId, userId));

    return reply.status(200).send({
      status: 'success',
      data: {
        boards: userBoards,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Get boards failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Handler to Get a Single Board Detail By ID
export const getBoardByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as BoardParams;
  const { db } = request.server;

  try {
    const targetBoard = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        createdAt: boards.createdAt,
      })
      .from(boards)
      .where(eq(boards.id, id));

    if (targetBoard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board not found' });
    }

    return reply.status(200).send({
      status: 'success',
      data: { board: targetBoard[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Get board detail failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};

// Handler to Update Board Name/Description
export const updateBoardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as BoardParams;
  const { name, description } = request.body as UpdateBoardBody;
  const { db, io } = request.server;

  try {
    const updatedBoards = await db
      .update(boards)
      .set({
        name: name ?? undefined,
        description: description ?? undefined,
      })
      .where(eq(boards.id, id))
      .returning();

    if (updatedBoards.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board not found' });
    }

    // BROADCAST EVENT: Notify that this board is updated
    io.to(id).emit('board_updated', updatedBoards[0]);

    return reply.status(200).send({
      status: 'success',
      message: 'Board updated successfully',
      data: { board: updatedBoards[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Board update failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};

// Handler to Delete a Board
export const deleteBoardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as BoardParams;
  const { db, io } = request.server;

  try {
    const targetBoard = await db.select().from(boards).where(eq(boards.id, id));
    if (targetBoard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board not found' });
    }

    await db.delete(boards).where(eq(boards.id, id));

    // BROADCAST EVENT:
    // Force clients who are currently opening this board to redirect back to the dashboard because the board was deleted by the owner.
    io.to(id).emit('board_deleted', { id });

    return reply.status(200).send({
      status: 'success',
      message: 'Board deleted successfully',
    });
  } catch (err: any) {
    request.server.log.error(err, 'Delete board failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};
