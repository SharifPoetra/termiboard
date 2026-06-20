import { FastifyReply, FastifyRequest } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { boardMembers, boards, users } from '../../database/schema.ts';

interface AddMemberBody {
  boardId: string;
  email: string;
}

interface KickMemberBody {
  boardId: string;
  userId: string;
}

export const addMemberHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId, email } = request.body as AddMemberBody;
  const { db, io } = request.server;
  const requesterId = (request.user as any).id;

  try {
    // SECURITY LAYER 1: Check if the requester is an ADMIN on board_members
    const isRequesterAdmin = await db
      .select()
      .from(boardMembers)
      .where(
        and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, requesterId), eq(boardMembers.role, 'admin')),
      );

    // SECURITY LAYER 2: Check if the requester is the original OWNER in the boards table
    const isOwner = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, requesterId)));

    if (isRequesterAdmin.length === 0 && isOwner.length === 0) {
      return reply.status(403).send({
        status: 'fail',
        message: 'ACCESS_DENIED: Only board administrators can inject new members into this stream.',
      });
    }

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

    // BROADCAST EVENT: Notify that a new member has successfully joined the stream matrix
    io.to(boardId).emit('member_joined', newMember[0]);

    return reply.status(201).send({
      status: 'success',
      message: 'Member added successfully to the board',
      data: {
        member: newMember[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Add member failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const kickMemberHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId, userId } = request.body as KickMemberBody;
  const { db, io } = request.server;
  const requesterId = (request.user as any).id;

  try {
    // Prevent administrators from kicking out the original board owner
    const boardData = await db.select({ ownerId: boards.userId }).from(boards).where(eq(boards.id, boardId));

    if (boardData.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'Board matrix not found.' });
    }

    const boardOwnerId = boardData[0].ownerId;
    if (userId === boardOwnerId) {
      return reply.status(400).send({
        status: 'fail',
        message: 'CRITICAL_ERR: Cannot sever connection of the core system creator (Owner).',
      });
    }

    // If the user is purging THEMSELVES, grant permission immediately (Leave Board flow)
    if (requesterId !== userId) {
      // If purging someone else, verify if the requester has Admin or Owner privileges
      const isRequesterAdmin = await db
        .select()
        .from(boardMembers)
        .where(
          and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, requesterId), eq(boardMembers.role, 'admin')),
        );

      const isOwner = requesterId === boardOwnerId;

      if (isRequesterAdmin.length === 0 && !isOwner) {
        return reply.status(403).send({
          status: 'fail',
          message: 'ACCESS_DENIED: Operational privileges insufficient to execute member purging.',
        });
      }
    }

    // Execute connection severance (Delete entry from database records)
    const deletedMember = await db
      .delete(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)))
      .returning();

    if (deletedMember.length === 0) {
      return reply.status(404).send({
        status: 'fail',
        message: 'Target entity is not registered as a member of this board.',
      });
    }

    // BROADCAST EVENT: Force client frontend to intercept this and boot the kicked user out of the stream room
    io.to(boardId).emit('member_kicked', { boardId, userId });

    return reply.status(200).send({
      status: 'success',
      message: 'Connection severed successfully. Member purged from board matrix.',
      data: {
        purgedUserId: userId,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Kick member execution failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
