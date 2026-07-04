import { FastifyInstance } from 'fastify';
import {
  addMemberHandler,
  getPendingInvitationsHandler,
  acceptInviteHandler,
  rejectInviteHandler,
  kickMemberHandler,
} from './member.controller.js';

export const memberRoutes = async (app: FastifyInstance) => {
  // POST /api/boards/invite
  app.post('/invite', {
    schema: {
      tags: ['Boards'],
      description: 'Invite a user to a board by email (admin/owner only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['boardId', 'email'],
        properties: {
          boardId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                member: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    boardId: { type: 'string' },
                    userId: { type: 'string' },
                    role: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        403: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: addMemberHandler,
  });

  // GET /api/boards/invite/pending
  app.get('/invite/pending', {
    schema: {
      tags: ['Boards'],
      description: 'Fetch all pending board invitations for the current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                invitations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      boardId: { type: 'string' },
                      userId: { type: 'string' },
                      role: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: getPendingInvitationsHandler,
  });

  // POST /api/boards/invite/accept
  app.post('/invite/accept', {
    schema: {
      tags: ['Boards'],
      description: 'Accept a pending board invitation',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['boardId'],
        properties: {
          boardId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                member: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    boardId: { type: 'string' },
                    userId: { type: 'string' },
                    role: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: acceptInviteHandler,
  });

  // POST /api/boards/invite/reject
  app.post('/invite/reject', {
    schema: {
      tags: ['Boards'],
      description: 'Reject a pending board invitation',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['boardId'],
        properties: {
          boardId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: rejectInviteHandler,
  });

  // DELETE /api/boards/kick
  app.delete('/kick', {
    schema: {
      tags: ['Boards'],
      description:
        'Kick a member from the board (admin/owner) or leave the board (self-removal). Owner cannot leave or be kicked.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['boardId', 'userId'],
        properties: {
          boardId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        403: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: kickMemberHandler,
  });
};
