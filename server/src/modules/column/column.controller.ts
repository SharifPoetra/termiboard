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

interface UpdateColumnBody {
  name?: string;
  position?: string;
}

interface ColumnParams {
  id: string;
}

// Handler to Create a Column
export const createColumnHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId, name, position } = request.body as CreateColumnBody;
  const { db, io } = request.server;

  try {
    const newColumn = await db
      .insert(columns)
      .values({
        boardId,
        name,
        position,
      })
      .returning();

    // BROADCAST EVENT: Notify that a column is created
    io.to(boardId).emit('column_created', newColumn[0]);

    return reply.status(201).send({
      status: 'success',
      message: 'Column created successfully',
      data: {
        column: newColumn[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Create column failed');
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
    request.server.log.error(err, 'Get columns failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Handler to Update Column Name or Position
export const updateColumnHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as ColumnParams;
  const { name, position } = request.body as UpdateColumnBody;
  const { db, io } = request.server;

  try {
    const currentColumn = await db.select().from(columns).where(eq(columns.id, id));
    if (currentColumn.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Column not found' });
    }
    const boardId = currentColumn[0].boardId;

    const updatedColumns = await db
      .update(columns)
      .set({
        name: name ?? undefined,
        position: position ?? undefined,
      })
      .where(eq(columns.id, id))
      .returning();

    // BROADCAST EVENT: Notify column has moved/updated
    io.to(boardId).emit('column_updated', updatedColumns[0]);

    return reply.status(200).send({
      status: 'success',
      message: 'Column updated successfully',
      data: { column: updatedColumns[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Update column failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};

// Handler to Delete a Column
export const deleteColumnHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as ColumnParams;
  const { db, io } = request.server;

  try {
    const currentColumn = await db.select().from(columns).where(eq(columns.id, id));
    if (currentColumn.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Column not found' });
    }
    const boardId = currentColumn[0].boardId;

    await db.delete(columns).where(eq(columns.id, id));

    // BROADCAST EVENT: Notify that a column is deleted
    io.to(boardId).emit('column_deleted', currentColumn[0]);

    return reply.status(200).send({
      status: 'success',
      message: 'Column deleted successfully',
      data: { column: currentColumn[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Delete column failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};
