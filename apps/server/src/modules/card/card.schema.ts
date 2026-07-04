export const createCardSchema = {
  schema: {
    tags: ['Cards'],
    description: 'Create a new task card at the bottom of a column',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['columnId', 'title'],
      properties: {
        columnId: { type: 'string', format: 'uuid' },
        title: { type: 'string', minLength: 1 },
        content: { type: 'string' },
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
              card: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  columnId: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string', nullable: true },
                  position: { type: 'string' },
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

export const getCardsByColumnSchema = {
  schema: {
    tags: ['Cards'],
    description: 'Fetch all cards in a column, sorted by position ascending',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['columnId'],
      properties: {
        columnId: { type: 'string', format: 'uuid' },
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
              cards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    columnId: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string', nullable: true },
                    position: { type: 'string' },
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

export const updateCardSchema = {
  schema: {
    tags: ['Cards'],
    description: 'Update card title/content or move card (use prevRank/nextRank for Lexorank repositioning)',
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
        title: { type: 'string' },
        content: { type: 'string' },
        columnId: { type: 'string', format: 'uuid' },
        prevRank: { type: 'string', nullable: true },
        nextRank: { type: 'string', nullable: true },
        position: { type: 'string' },
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
              card: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  columnId: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string', nullable: true },
                  position: { type: 'string' },
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

export const deleteCardSchema = {
  schema: {
    tags: ['Cards'],
    description: 'Delete a task card permanently',
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
          data: {
            type: 'object',
            properties: {
              card: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  columnId: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string', nullable: true },
                  position: { type: 'string' },
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
