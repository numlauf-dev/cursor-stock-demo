import { afterAll } from '@jest/globals';

afterAll(async () => {
  const [{ default: prisma }, { disconnectRedis }] = await Promise.all([
    import('../../backend/config/database.js'),
    import('../../backend/config/redis.js'),
  ]);

  await disconnectRedis();
  await prisma.$disconnect();
});
