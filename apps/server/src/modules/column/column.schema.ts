export const createColumnSchema = {
  schema: {
    tags: ['Columns'],
    description: 'Create a new column inside a board',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['boardId', 'name', 'position'],
      properties: {
        boardId: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1 },
        position: { type: 'string' },
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
              column: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  boardId: { type: 'string' },
                  name: { type: 'string' },
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

export const getColumnsByBoardSchema = {
  schema: {
    tags: ['Columns'],
    description: 'Fetch all columns in a board',
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
              columns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    boardId: { type: 'string' },
                    name: { type: 'string' },
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

export const updateColumnSchema = {
  schema: {
    tags: ['Columns'],
    description: 'Update column name or position',
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
              column: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  boardId: { type: 'string' },
                  name: { type: 'string' },
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

export const deleteColumnSchema = {
  schema: {
    tags: ['Columns'],
    description: 'Delete a column and all cards within it',
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
              column: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  boardId: { type: 'string' },
                  name: { type: 'string' },
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
