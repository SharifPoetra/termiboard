import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import { or, eq } from 'drizzle-orm';
import { users } from '../../database/schema.ts';

// Define the structure of Register Request Body
interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

// Define the structure for Login Request Body
interface LoginBody {
  username: string;
  email: string;
  password: string;
}

export const registerHandler = async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
  const { username, email, password } = request.body;
  const { db } = request.server; // Access the database pool via app.db

  try {
    // Check if username or email already exists
    const userCheck = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));

    if (userCheck.length > 0) {
      return reply.status(400).send({
        status: 'fail',
        message: 'Username or email is already registered',
      });
    }

    // Hash the password securely using bcrypt
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into Database
    const newUser = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      });

    // Return success response with created user data
    return reply.status(201).send({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: newUser[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, '❌ Registration error:');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const loginHandler = async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
  const { username, email, password } = request.body;
  const { db } = request.server;

  try {
    // Check if user exists by username OR email
    const userResult = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));

    if (userResult.length === 0) {
      return reply.status(401).send({
        status: 'fail',
        message: 'Invalid username/email or password',
      });
    }

    const user = userResult[0];

    // Verify the password using bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatch) {
      return reply.status(401).send({
        status: 'fail',
        message: 'Invalid username/email or password',
      });
    }

    // Generate JWT Token
    const token = request.server.jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      {
        expiresIn: '1d',
      },
    );

    // Success response
    return reply.status(200).send({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (err: any) {
    request.server.log.error(err, '❌ Login error:');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
