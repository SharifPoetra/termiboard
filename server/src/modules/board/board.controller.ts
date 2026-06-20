import { FastifyReply, FastifyRequest } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { boards, boardMembers } from '../../database/schema.ts';

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

    const createdBoard = newBoard[0];

    // Automatically register the creator as an 'admin' in the collaboration matrix
    await db.insert(boardMembers).values({
      boardId: createdBoard.id,
      userId: userId,
      role: 'admin',
    });

    return reply.status(201).send({
      status: 'success',
      message: 'Board created successfully',
      data: {
        board: createdBoard,
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
    // SECURITY PATCH: Fetch boards where the user is either the owner OR a registered member
    const ownedBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        createdAt: boards.createdAt,
      })
      .from(boards)
      .where(eq(boards.userId, userId));

    const collaboratedBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        createdAt: boards.createdAt,
      })
      .from(boardMembers)
      .innerJoin(boards, eq(boardMembers.boardId, boards.id))
      .where(eq(boardMembers.userId, userId));

    // Merge and filter duplicate entries if any
    const allBoardsMap = new Map();
    ownedBoards.forEach((b) => allBoardsMap.set(b.id, b));
    collaboratedBoards.forEach((b) => allBoardsMap.set(b.id, b));
    const mergedBoards = Array.from(allBoardsMap.values());

    return reply.status(200).send({
      status: 'success',
      data: {
        boards: mergedBoards,
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
  const userId = (request.user as any).id;

  try {
    const targetBoard = await db.select().from(boards).where(eq(boards.id, id));

    if (targetBoard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board not found' });
    }

    // SECURITY LAYER: Check if the requester is the owner or a member of the board
    const isOwner = targetBoard[0].userId === userId;
    const isMember = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, id), eq(boardMembers.userId, userId)));

    if (!isOwner && isMember.length === 0) {
      return reply.status(403).send({
        status: 'fail',
        message: 'ACCESS_DENIED: You are not authorized to view this board ecosystem.',
      });
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
  const userId = (request.user as any).id;

  try {
    const targetBoard = await db.select().from(boards).where(eq(boards.id, id));
    if (targetBoard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board not found' });
    }

    // SECURITY LAYER: Check if requester is Owner OR an Admin member
    const isOwner = targetBoard[0].userId === userId;
    const isAdmin = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, id), eq(boardMembers.userId, userId), eq(boardMembers.role, 'admin')));

    if (!isOwner && isAdmin.length === 0) {
      return reply.status(403).send({
        status: 'fail',
        message: 'ACCESS_DENIED: Operational privileges insufficient to modify board metadata.',
      });
    }

    const updatedBoards = await db
      .update(boards)
      .set({
        name: name ?? undefined,
        description: description ?? undefined,
      })
      .where(eq(boards.id, id))
      .returning();

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
  const userId = (request.user as any).id;

  try {
    const targetBoard = await db.select().from(boards).where(eq(boards.id, id));
    if (targetBoard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board not found' });
    }

    // SECURITY LAYER: Absolute enforcement - Only the original OWNER can destroy a board matrix
    const isOwner = targetBoard[0].userId === userId;
    if (!isOwner) {
      return reply.status(403).send({
        status: 'fail',
        message: 'CRITICAL_ACCESS_DENIED: Only the system creator (Owner) can execute an absolute drop sequence.',
      });
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
