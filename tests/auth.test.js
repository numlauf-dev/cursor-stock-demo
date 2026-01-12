import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Note: This is a basic test structure
// You'll need to set up a test database and configure Jest properly

describe('Authentication API', () => {
  let app;

  beforeAll(async () => {
    // Initialize test app
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    
    // Import app after env vars are set
    const { default: testApp } = await import('../index.js');
    app = testApp;
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
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
          email: 'test@example.com',
          password: 'Password123',
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
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/auth/preferences', () => {
    let authToken;

    beforeAll(async () => {
      // Register and login to get auth token
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'preferences@example.com',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'preferences@example.com',
          password: 'Password123',
        });

      authToken = loginResponse.body.data.token;
    });

    it('should update user theme preference', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'dark',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('theme', 'dark');
    });

    it('should update theme to light', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'light',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user).toHaveProperty('theme', 'light');
    });

    it('should update theme to system', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'system',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user).toHaveProperty('theme', 'system');
    });

    it('should reject invalid theme value', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'invalid',
        });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch('/api/v1/auth/preferences')
        .send({
          theme: 'dark',
        });

      expect(response.status).toBe(401);
    });

    it('should return theme in user object after update', async () => {
      // First update theme
      await request(app)
        .patch('/api/v1/auth/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          theme: 'dark',
        });

      // Then get user info
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.user).toHaveProperty('theme', 'dark');
    });
  });
});
