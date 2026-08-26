import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, closeDb } from './helpers';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await closeDb();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const REGISTER = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';
const ME = '/api/v1/auth/me';

describe('Auth', () => {
  const user = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    fullName: 'Test User',
  };

  describe('POST /register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app).post(REGISTER).send(user);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post(REGISTER).send(user);
      const res = await request(app).post(REGISTER).send({
        ...user,
        username: 'other',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate username', async () => {
      await request(app).post(REGISTER).send(user);
      const res = await request(app).post(REGISTER).send({
        ...user,
        email: 'other@example.com',
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing fields', async () => {
      const res = await request(app).post(REGISTER).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await request(app).post(REGISTER).send(user);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post(LOGIN)
        .send({ email: user.email, password: user.password });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(user.email);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post(LOGIN)
        .send({ email: user.email, password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post(LOGIN)
        .send({ email: 'nope@example.com', password: 'x' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /me', () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app).post(REGISTER).send(user);
      token = res.body.data.token;
    });

    it('should return current user', async () => {
      const res = await request(app)
        .get(ME)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
    });

    it('should reject without token', async () => {
      const res = await request(app).get(ME);
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get(ME)
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });
  });
});
