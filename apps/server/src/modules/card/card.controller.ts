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
    // Retrieve card data before updating
    const currentCardResult = await db.select().from(cards).where(eq(cards.id, id));
    if (currentCardResult.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Card not found' });
    }
    const currentCard = currentCardResult[0];
    const boardId = (request as any).boardId;

    let targetColumnId = columnId || currentCard.columnId;
    let updatedCardData = currentCard;

    // If there is a POSITION or COLUMNS change, run a full re-indexing logic
    if (position !== undefined || columnId !== undefined) {
      const targetPos = position !== undefined ? parseInt(String(position), 10) : 1;

      // Take all the cards in the target column (except the card currently being shifted)
      const existingCards = await db.select().from(cards).where(eq(cards.columnId, targetColumnId));

      const filteredCards = existingCards
        .filter((c) => c.id !== id)
        .sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10));

      // Insert the currently shifted card into its new position (index)
      const insertIndex = Math.max(0, targetPos - 1);
      filteredCards.splice(insertIndex, 0, {
        ...currentCard,
        columnId: targetColumnId,
      });

      // Perform a batch update to the database to ensure a clean position (1, 2, 3, etc.) without duplicates
      await db.transaction(async (tx) => {
        for (const [index, item] of filteredCards.entries()) {
          const newPosStr = String(index + 1);

          // If this is the card being shifted, also update the title & content if there is any data submission
          const updatePayload: any = {
            columnId: targetColumnId,
            position: newPosStr,
          };
          if (item.id === id) {
            if (title !== undefined) updatePayload.title = title;
            if (content !== undefined) updatePayload.content = content;
          }

          const res = await tx.update(cards).set(updatePayload).where(eq(cards.id, item.id)).returning();

          if (item.id === id) {
            updatedCardData = res[0];
          }
        }

        // If the card moves from another column, clean & rearrange the original column as well so there are no holes in the sequence
        if (columnId && columnId !== currentCard.columnId) {
          const rawSourceCards = await tx.select().from(cards).where(eq(cards.columnId, currentCard.columnId));
          const sourceCards = rawSourceCards.sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10));

          for (const [index, cardItem] of sourceCards.entries()) {
            await tx
              .update(cards)
              .set({ position: String(index + 1) })
              .where(eq(cards.id, cardItem.id));
          }
        }
      });

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
