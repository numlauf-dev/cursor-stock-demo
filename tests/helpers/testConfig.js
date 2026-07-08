import path from 'node:path';

const workspaceRoot = process.cwd();

export const testDatabasePath = path.join(workspaceRoot, 'prisma', 'test.db');
export const testDatabaseUrl = `file:${testDatabasePath}`;

export const configureTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.STOCK_API_PROVIDER = 'mock';
  process.env.STOCK_API_KEY = 'test-key';
  process.env.STOCK_NEWS_PROVIDER = 'mock';
  process.env.PORT = '0';
};

export const loadTestApp = async () => {
  configureTestEnv();
  const { default: app } = await import('../../backend/app.js');
  return app;
};

export const loadTestPrisma = async () => {
  configureTestEnv();
  const { default: prisma } = await import('../../backend/config/database.js');
  return prisma;
};
