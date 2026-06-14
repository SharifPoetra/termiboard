import { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { boards } from '../../database/schema.ts';

// Define structure for creating a board
interface CreateBoardBody {
  name: string;
  description?: string;
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
    request.server.log.error(err, '❌ Create board error:');
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
    // Only fetch boards that belong to this specific user
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
    request.server.log.error(err, '❌ Get boards error:');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
