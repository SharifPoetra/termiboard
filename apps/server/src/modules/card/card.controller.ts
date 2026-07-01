import { FastifyReply, FastifyRequest } from 'fastify';
import { eq, desc, asc } from 'drizzle-orm';
import { cards } from '@termiboard/core';
import { getRankBetween } from '../../utils/lexorank.ts';

interface CreateCardBody {
  columnId: string;
  title: string;
  content?: string;
}

interface GetCardsParams {
  columnId: string;
}

interface UpdateCardBody {
  columnId?: string;
  title?: string;
  content?: string;
  position?: string;
  prevRank?: string | null;
  nextRank?: string | null;
}

interface CardParams {
  id: string;
}

// Handler to Create a Card
export const createCardHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { columnId, title, content } = request.body as CreateCardBody;
  const { db, io } = request.server;

  try {
    const boardId = (request as any).boardId;

    // Take the card that is currently at the bottom of the column
    const lastCardResult = await db
      .select({ position: cards.position })
      .from(cards)
      .where(eq(cards.columnId, columnId))
      .orderBy(desc(cards.position)) // Sort from largest/lowest
      .limit(1);

    let initialPosition: string;

    if (lastCardResult.length > 0) {
      // If there is a previous card, create a new rank below the last card
      initialPosition = getRankBetween(lastCardResult[0].position, null);
    } else {
      // If the column is still empty, create a default middle value
      initialPosition = getRankBetween(null, null);
    }

    const newCard = await db
      .insert(cards)
      .values({
        columnId,
        title,
        content: content || null,
        position: initialPosition,
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
    const columnCards = await db.select().from(cards).where(eq(cards.columnId, columnId)).orderBy(asc(cards.position));

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
  const { columnId, title, content, position, prevRank, nextRank } = request.body as UpdateCardBody;
  const { db, io } = request.server;

  try {
    // Retrieve card data before updating
    const currentCardResult = await db.select().from(cards).where(eq(cards.id, id));
    if (currentCardResult.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Card not found' });
    }
    const currentCard = currentCardResult[0];
    const boardId = (request as any).boardId;

    let targetColumnId = columnId || currentCard.columnId;
    let updatedCardData = currentCard;

    // Check if there is a POSITION or COLUMNS change
    if (position !== undefined || columnId !== undefined || prevRank !== undefined || nextRank !== undefined) {
      const updatePayload: any = {
        columnId: targetColumnId,
      };

      if (title !== undefined) updatePayload.title = title;
      if (content !== undefined) updatePayload.content = content;

      // Calculate the new fractional string position using Lexorank
      if (prevRank !== undefined || nextRank !== undefined) {
        updatePayload.position = getRankBetween(prevRank, nextRank);
      } else if (position !== undefined) {
        updatePayload.position = position;
      }

      const res = await db.update(cards).set(updatePayload).where(eq(cards.id, id)).returning();

      updatedCardData = res[0];

      // BROADCAST EVENT: Notify that a card is moved
      io.to(boardId).emit('card_moved', updatedCardData);
    } else {
      // If only change the text content (not shifting the position/column)
      const res = await db
        .update(cards)
        .set({
          title: title ?? undefined,
          content: content ?? undefined,
        })
        .where(eq(cards.id, id))
        .returning();

      updatedCardData = res[0];
      // BROADCAST EVENT: Notify that a card is updated
      io.to(boardId).emit('card_updated', updatedCardData);
    }

    return reply.status(200).send({
      status: 'success',
      message: 'Card updated successfully',
      data: { card: updatedCardData },
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
