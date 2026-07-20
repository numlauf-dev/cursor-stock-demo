import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const DEFAULT_USER_EMAIL = 'default@stockdemo.local';
const DEFAULT_USER_PASSWORD = 'default_password_change_in_production';

/**
 * Get or create the default user for single-user mode
 */
export const getOrCreateDefaultUser = async () => {
  // Try to find existing default user
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    // Create the default user. Use upsert so concurrent callers cannot race
    // into a unique-constraint error on `email` — this happens when the
    // frontend auto-calls this endpoint on load, or when parallel test
    // workers share a database. If another caller created the user between
    // the findUnique above and here, the where clause matches and we no-op.
    const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);

    user = await prisma.user.upsert({
      where: { email: DEFAULT_USER_EMAIL },
      update: {},
      create: {
        email: DEFAULT_USER_EMAIL,
        password: hashedPassword,
        firstName: 'Default',
        lastName: 'User',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'default_secret_change_in_production',
    { expiresIn: '365d' } // Long expiration for single-user mode
  );

  return {
    user,
    token,
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return user;
};
