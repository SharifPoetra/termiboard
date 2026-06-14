import { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { columns } from '../../database/schema.js';

interface CreateColumnBody {
  boardId: string;
  name: string;
  position: string;
}

interface GetColumnsParams {
  boardId: string;
}

// Handler to Create a Column
export const createColumnHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId, name, position } = request.body as CreateColumnBody;
  const { db } = request.server;

  try {
    const newColumn = await db
      .insert(columns)
      .values({
        boardId,
        name,
        position,
      })
      .returning();

    return reply.status(201).send({
      status: 'success',
      message: 'Column created successfully',
      data: {
        column: newColumn[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, '❌ Create column error:');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Handler to Get Columns by Board ID
export const getColumnsByBoardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId } = request.params as GetColumnsParams;
  const { db } = request.server;

  try {
    const boardColumns = await db.select().from(columns).where(eq(columns.boardId, boardId));

    return reply.status(200).send({
      status: 'success',
      data: {
        columns: boardColumns,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, '❌ Get columns error:');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
