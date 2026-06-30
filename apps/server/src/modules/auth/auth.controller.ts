import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import { and, gt, or, eq } from 'drizzle-orm';
import { users } from '@termiboard/core';
import { sendOtpEmail } from '../../utils/mailer.ts';

// Define the structure of auth Request Body
interface ProfileBody {
  username: string;
  email: string;
  password: string;
}

interface UpdateProfileBody {
  username?: string;
  email?: string;
  password?: string;
  passwordHash?: string;
}

interface VerifyOtpBody {
  email: string;
  otp: string;
}

export const registerHandler = async (request: FastifyRequest<{ Body: ProfileBody }>, reply: FastifyReply) => {
  const { username, email, password } = request.body;
  const { db } = request.server; // Access the database pool via app.db

  try {
    // Check if username or email already exists
    const userCheck = await db
      .select({ id: users.id, isVerified: users.isVerified })
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

    // Generate 6-digit cryptographic otp code string
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in T-Minus 5 minutes

    // Insert the new user into Database
    await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        isVerified: false,
        otpCode,
        otpExpiresAt,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      });

    await sendOtpEmail(email, username, otpCode);

    // Return success response prompting client to route to OTP panel
    return reply.status(200).send({
      status: 'success',
      message: 'Registration initial sequence complete. OTP code dispatched to email.',
      data: {
        email,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Registration failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// verifyOtpHandler to authorize unverified deployment records
export const verifyOtpHandler = async (request: FastifyRequest<{ Body: VerifyOtpBody }>, reply: FastifyReply) => {
  const { email, otp } = request.body;
  const { db } = request.server;

  try {
    // Check user records matching email, non-expired OTP, and current match validation
    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.otpCode, otp),
          gt(users.otpExpiresAt, new Date()), // Check if current timestamp hasn't crossed expiration
        ),
      );

    if (userResult.length === 0) {
      return reply.status(400).send({
        status: 'fail',
        message: 'Invalid or expired OTP authentication code.',
      });
    }

    const user = userResult[0];

    // Activate the user record status inside database matrix and clear OTP records
    await db
      .update(users)
      .set({
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    // Sign the secure JWT access certificate token payload
    const token = request.server.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '1d' });

    return reply.status(200).send({
      status: 'success',
      message: 'OTP verification successful. Channel secured.',
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
    request.server.log.error(err, 'OTP Verification failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const loginHandler = async (request: FastifyRequest<{ Body: ProfileBody }>, reply: FastifyReply) => {
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

    if (!user.isVerified) {
      return reply.status(403).send({
        status: 'fail',
        message: 'Account authentication is unverified. Please execute OTP protocol validation.',
      });
    }

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
    request.server.log.error(err, 'Login failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

interface ResendOtpBody {
  email: string;
}

export const resendOtpHandler = async (request: FastifyRequest<{ Body: ResendOtpBody }>, reply: FastifyReply) => {
  const { email } = request.body;
  const { db } = request.server;

  try {
    // Check if user exist based on email
    const userResult = await db.select().from(users).where(eq(users.email, email));

    if (userResult.length === 0) {
      return reply.status(404).send({
        status: 'fail',
        message: 'No account matches this email address.',
      });
    }

    const user = userResult[0];

    // Prevent resend if the user is already verified
    if (user.isVerified) {
      return reply.status(400).send({
        status: 'fail',
        message: 'This account is already verified. Resend command aborted.',
      });
    }

    // Rate-limit to prevent spamming resend email
    if (user.otpExpiresAt) {
      const currentTimestamp = new Date().getTime();
      const existingExpiry = new Date(user.otpExpiresAt).getTime();
      const timeLeft = existingExpiry - currentTimestamp;

      if (timeLeft > 4 * 60 * 1000) {
        return reply.status(429).send({
          status: 'fail',
          message: 'Rate limit hit. Please wait 60 seconds before requesting another token code.',
        });
      }
    }

    // Re-generate a new 6-digit OTP & set expiry time T-Minus 5 minutes
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Update new OTP data to the database
    await db
      .update(users)
      .set({
        otpCode: newOtpCode,
        otpExpiresAt: newOtpExpiresAt,
      })
      .where(eq(users.id, user.id));

    // Send a new OTP email using the mailer utility
    await sendOtpEmail(email, user.username, newOtpCode);

    return reply.status(200).send({
      status: 'success',
      message: 'New dynamic OTP code generated and dispatched to your inbox.',
      data: {
        email,
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Resend OTP sequence failed');
    return reply.status(500).send({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const updateProfileHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as any).id;
  const { username, email, password } = request.body as UpdateProfileBody;
  const { db } = request.server;

  try {
    const updatePayload: UpdateProfileBody = {};

    if (username !== undefined) updatePayload.username = username;
    if (email !== undefined) updatePayload.email = email;

    // Hash the password if it's being updated
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updatePayload.passwordHash = await bcrypt.hash(password, salt);
    }

    // Execute partial update query
    const updatedUserResult = await db.update(users).set(updatePayload).where(eq(users.id, userId)).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt,
    });

    if (updatedUserResult.length === 0) {
      return reply.status(404).send({ status: 'fail', message: 'User identity not found.' });
    }

    return reply.status(200).send({
      status: 'success',
      message: 'Profile database parameters updated successfully.',
      data: {
        user: updatedUserResult[0],
      },
    });
  } catch (err: any) {
    request.server.log.error(err, 'Profile update sequence execution failed');
    return reply.status(500).send({ status: 'error', message: 'Internal server error' });
  }
};
