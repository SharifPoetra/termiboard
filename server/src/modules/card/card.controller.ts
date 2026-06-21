import { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { cards } from '../../database/schema.js';

interface CreateCardBody {
  columnId: string;
  title: string;
  content?: string;
  position: string;
}

interface GetCardsParams {
  columnId: string;
}

interface UpdateCardBody {
  columnId?: string;
  title?: string;
  content?: string;
  position?: string;
}

interface CardParams {
  id: string;
}

// Handler to Create a Card
export const createCardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { columnId, title, content, position } = request.body as CreateCardBody;
  const { db, io } = request.server;

  try {
    const boardId = (request as any).boardId;

    const newCard = await db
      .insert(cards)
      .values({
        columnId,
        title,
        content: content || null,
        position,
      })
      .returning();

    // BROADCAST EVENT: Notify that a card is created
    io.to(boardId).emit('card_created', newCard[0]);

    return reply.status(201).send({
      status: 'success',
      message: 'Card created successfully',
      data: {
        card: newCard[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Create card failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Handler to Get Cards by Column ID
export const getCardsByColumnHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { columnId } = request.params as GetCardsParams;
  const { db } = request.server;

  try {
    const columnCards = await db.select().from(cards).where(eq(cards.columnId, columnId));

    return reply.status(200).send({
      status: 'success',
      data: {
        cards: columnCards,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Get cards failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// Handler to Update / Move a Card
export const updateCardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as CardParams;
  const { columnId, title, content, position } = request.body as UpdateCardBody;
  const { db, io } = request.server;

  try {
    const currentCard = await db.select().from(cards).where(eq(cards.id, id));
    if (currentCard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Card not found' });
    }

    const boardId = (request as any).boardId;

    // Update the card data
    const updatedCards = await db
      .update(cards)
      .set({
        columnId: columnId ?? undefined,
        title: title ?? undefined,
        content: content ?? undefined,
        position: position ?? undefined,
      })
      .where(eq(cards.id, id))
      .returning();

    // BROADCAST EVENT: Notify that a card is moved/changed
    if (columnId || position) {
      io.to(boardId).emit('card_moved', updatedCards[0]);
    } else {
      io.to(boardId).emit('card_updated', updatedCards[0]);
    }

    return reply.status(200).send({
      status: 'success',
      message: 'Card updated successfully',
      data: { card: updatedCards[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Card update failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};

// Handler to Delete a Card
export const deleteCardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as CardParams;
  const { db, io } = request.server;

  try {
    const targetCard = await db.select().from(cards).where(eq(cards.id, id));

    if (targetCard.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Card not found' });
    }
    const boardId = (request as any).boardId;

    await db.delete(cards).where(eq(cards.id, id));

    // BROADCAST EVENT: Notify that a card is deleted
    io.to(boardId).emit('card_deleted', targetCard[0]);

    return reply.status(200).send({
      status: 'success',
      message: 'Card deleted successfully',
      data: { card: targetCard[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Delete card failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};
