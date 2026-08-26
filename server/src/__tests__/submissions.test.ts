import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, closeDb } from './helpers';
import type { Express } from 'express';

let app: Express;

const SUBMISSIONS = '/api/v1/submissions';

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function registerUser(app: Express): Promise<{ token: string; userId: string }> {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const email = `user${suffix}@test.com`;
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ username: `user${suffix}`, email, password: 'testpass123', fullName: 'Test User' });
  return { token: reg.body.data.token, userId: reg.body.data.user.id };
}

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

describe('Submissions', () => {
  describe('POST / (create)', () => {
    it('should reject unauthenticated submission', async () => {
      const res = await request(app)
        .post(SUBMISSIONS)
        .send({ problemId: '507f1f77bcf86cd799439011', language: 'javascript', code: 'print(42)' });
      expect(res.status).toBe(401);
    });

    it('should reject missing fields', async () => {
      const { token } = await registerUser(app);
      const res = await request(app)
        .post(SUBMISSIONS)
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'javascript' });
      expect(res.status).toBe(400);
    });

    it('should reject code over 50KB', async () => {
      const { token } = await registerUser(app);
      const bigCode = 'x'.repeat(51 * 1024);
      const res = await request(app)
        .post(SUBMISSIONS)
        .set('Authorization', `Bearer ${token}`)
        .send({ problemId: '507f1f77bcf86cd799439011', language: 'javascript', code: bigCode });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /user/:userId (list)', () => {
    it('should reject unauthenticated list', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`${SUBMISSIONS}/user/${fakeId}`);
      expect(res.status).toBe(401);
    });

    it('should list submissions for authenticated user', async () => {
      const { token, userId } = await registerUser(app);
      const res = await request(app)
        .get(`${SUBMISSIONS}/user/${userId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /:id (detail)', () => {
    it('should reject unauthenticated detail', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`${SUBMISSIONS}/${fakeId}`);
      expect(res.status).toBe(401);
    });
  });
});
