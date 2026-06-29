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

interface ResponseInviteBody {
  boardId: string;
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
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.userId, requesterId),
          eq(boardMembers.role, 'admin'),
          eq(boardMembers.status, 'active'),
        ),
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
        message:
          existingMember[0].status === 'pending'
            ? 'An invitation is already pending for this user.'
            : 'User is already an active member of this board.',
      });
    }

    // Enter user as new member
    const newMember = await db
      .insert(boardMembers)
      .values({
        boardId,
        userId,
        role: 'member',
        status: 'pending',
      })
      .returning();

    // Emit to a specific target user's personal room notification if they are online
    io.to(`user_${userId}`).emit('invitation_received', {
      message: 'You have been invited to a new board matrix',
      data: newMember[0],
    });

    return reply.status(201).send({
      status: 'success',
      message: 'Invitation sent successfully. Waiting for user acceptance.',
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

export const getPendingInvitationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { db } = request.server;
  const userId = (request.user as any).id;

  try {
    // Fetch all pending invitations where the target is the currently authenticated user
    const pendingInvitations = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.userId, userId), eq(boardMembers.status, 'pending')));

    return reply.status(200).send({
      status: 'success',
      data: {
        invitations: pendingInvitations,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Fetch pending invitations failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const acceptInviteHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId } = request.body as ResponseInviteBody;
  const { db, io } = request.server;
  const userId = (request.user as any).id;

  try {
    const updatedMember = await db
      .update(boardMembers)
      .set({ status: 'active' }) // Flip flag to active
      .where(
        and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId), eq(boardMembers.status, 'pending')),
      )
      .returning();

    if (updatedMember.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'No pending invitation found for this board.' });
    }

    // BROADCAST: Notify all other board members that a new collaborator has officially activated their session
    io.to(boardId).emit('member_joined', updatedMember[0]);

    return reply.status(200).send({
      status: 'success',
      message: 'Invitation accepted successfully. Welcome to the board workspace.',
      data: { member: updatedMember[0] },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Accept invitation failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};

export const rejectInviteHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { boardId } = request.body as ResponseInviteBody;
  const { db } = request.server;
  const userId = (request.user as any).id;

  try {
    const deletedMember = await db
      .delete(boardMembers)
      .where(
        and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId), eq(boardMembers.status, 'pending')),
      )
      .returning();

    if (deletedMember.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'No pending invitation found to reject.' });
    }

    return reply.status(200).send({
      status: 'success',
      message: 'Invitation rejected and purged from matrix records.',
    });
  } catch (err: any) {
    request.server.log.error(err, 'Reject invitation failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
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
          and(
            eq(boardMembers.boardId, boardId),
            eq(boardMembers.userId, requesterId),
            eq(boardMembers.role, 'admin'),
            eq(boardMembers.status, 'active'),
          ),
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
