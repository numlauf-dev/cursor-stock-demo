import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { configureTestEnv, testDatabasePath } from '../helpers/testConfig.js';

const removeTestDatabaseFiles = () => {
  for (const suffix of ['', '-journal', '-shm', '-wal']) {
    const databaseFile = `${testDatabasePath}${suffix}`;
    if (fs.existsSync(databaseFile)) {
      fs.rmSync(databaseFile, { force: true });
    }
  }
};

export default async () => {
  configureTestEnv();
  removeTestDatabaseFiles();

  execFileSync(
    'npx',
    ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'],
    {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: 'inherit',
    }
  );
};
