export const createBoardSchema = {
  schema: {
    tags: ['Boards'],
    description: 'Create a new project board and auto-assign creator as admin',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
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
              board: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
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

export const getBoardsSchema = {
  schema: {
    tags: ['Boards'],
    description: 'Retrieve all boards where user is owner or active member',
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              boards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
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

export const getBoardByIdSchema = {
  schema: {
    tags: ['Boards'],
    description: 'Get a single board detail by ID (owner or member access required)',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
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
              board: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  userId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
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

export const updateBoardSchema = {
  schema: {
    tags: ['Boards'],
    description: 'Update board name or description (owner or admin only)',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
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
              board: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
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

export const deleteBoardSchema = {
  schema: {
    tags: ['Boards'],
    description: 'Delete a board permanently (only original owner can execute)',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
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
