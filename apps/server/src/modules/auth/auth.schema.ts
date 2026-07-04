export const registerSchema = {
  schema: {
    tags: ['Auth'],
    description: 'Register a new account (or re-register unverified) and send OTP code to email',
    body: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
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
            properties: { email: { type: 'string' } },
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

export const loginSchema = {
  schema: {
    tags: ['Auth'],
    description: 'Authenticate user with username/email and password',
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string' },
        password: { type: 'string', minLength: 6 },
        username: { type: 'string' },
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
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
      401: {
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

export const verifyOtpSchema = {
  schema: {
    tags: ['Auth'],
    description: 'Verify OTP code sent to email and activate account',
    body: {
      type: 'object',
      required: ['email', 'otp'],
      properties: {
        email: { type: 'string', format: 'email' },
        otp: { type: 'string', pattern: '^\\d{6}$' },
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
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
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

export const resendOtpSchema = {
  schema: {
    tags: ['Auth'],
    description: 'Generate a new OTP code and send to email (60s cooldown applies)',
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
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
            properties: { email: { type: 'string' } },
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
      429: {
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

export const updateProfileSchema = {
  schema: {
    tags: ['Auth'],
    description: 'Update current user profile (username, email, or password)',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
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
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
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
