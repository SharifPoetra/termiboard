import { FastifyReply, FastifyRequest } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { boardMembers, users } from '../../database/schema.js';

interface AddMemberBody {
  boardId: string;
  email: string;
}

export const addMemberHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId, email } = request.body as AddMemberBody;
  const { db } = request.server;

  try {
    // Search user_id based on inputted email
    const targetUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

    if (targetUser.length === 0) {
      return reply.status(404).send({
        status: 'fail',
        message: 'User with this email not found',
      });
    }

    const userId = targetUser[0].id;

    // Check if the user has already registered on this board before
    const existingMember = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)));

    if (existingMember.length > 0) {
      return reply.status(400).send({
        status: 'fail',
        message: 'User is already a member of this board',
      });
    }

    // Enter user as new member
    const newMember = await db
      .insert(boardMembers)
      .values({
        boardId,
        userId,
        role: 'member',
      })
      .returning();

    return reply.status(201).send({
      status: 'success',
      message: 'Member added successfully to the board',
      data: {
        member: newMember[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, '❌ Add member error:');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
