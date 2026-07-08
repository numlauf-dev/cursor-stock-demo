import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { loadTestApp, loadTestPrisma } from './helpers/testConfig.js';

describe('Authentication API', () => {
  let app;
  let prisma;
  const registrationUser = {
    email: `auth-register-${Date.now()}@example.com`,
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
  };
  const loginUser = {
    email: `auth-login-${Date.now()}@example.com`,
    password: 'Password123',
    firstName: 'Login',
    lastName: 'User',
  };

  beforeAll(async () => {
    app = await loadTestApp();
    prisma = await loadTestPrisma();

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [registrationUser.email, loginUser.email],
        },
      },
    });

    const seedUserResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(loginUser);

    expect(seedUserResponse.status).toBe(201);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [registrationUser.email, loginUser.email],
        },
      },
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', registrationUser.email);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginUser.email,
          password: loginUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginUser.email,
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
