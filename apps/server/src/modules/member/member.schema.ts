export const addMemberSchema = {
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
};

export const getBoardMembersSchema = {
  schema: {
    tags: ['Boards'],
    description: 'Get all members of a board (active & pending)',
    security: [{ bearerAuth: [] }],
    params: {
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
          data: {
            type: 'object',
            properties: {
              members: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    boardId: { type: 'string' },
                    userId: { type: 'string' },
                    role: { type: 'string' },
                    status: { type: 'string' },
                    joinedAt: { type: 'string', format: 'date-time' },
                    username: { type: 'string' },
                    email: { type: 'string' },
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
};

export const getPendingInvitationsSchema = {
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
};

export const acceptInviteSchema = {
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
};

export const rejectInviteSchema = {
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
};

export const kickMemberSchema = {
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
};
