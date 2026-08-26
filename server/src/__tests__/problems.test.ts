import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, closeDb } from './helpers';
import type { Express } from 'express';

let app: Express;

const PROBLEMS = '/api/v1/problems';

const problemData = {
  title: 'Test Problem',
  statement: 'Print the number 42.',
  inputFormat: 'No input.',
  outputFormat: 'Print 42.',
  constraints: 'None.',
  difficulty: 'Easy',
  tags: ['basics'],
  sampleInput: 'None',
  sampleOutput: '42',
};

async function createAdmin(app: Express): Promise<string> {
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const email = `admin${suffix}@test.com`;
  const username = `admin${suffix}`;

  await request(app)
    .post('/api/v1/auth/register')
    .send({ username, email, password: 'admin123', fullName: 'Admin' });

  const User = mongoose.model('User');
  await User.updateOne({ email }, { $set: { role: 'admin' } });

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'admin123' });
  return login.body.data.token;
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

describe('Problems', () => {
  describe('POST / (create)', () => {
    it('should create a problem as admin', async () => {
      const token = await createAdmin(app);
      const res = await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Test Problem');
      expect(res.body.data.slug).toBe('test-problem');
      expect(res.body.data.difficulty).toBe('Easy');
    });

    it('should reject non-admin', async () => {
      const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: `u1${suffix}`, email: `u1${suffix}@t.com`, password: 'pass12345', fullName: 'User' });
      const res = await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${reg.body.data.token}`)
        .send(problemData);
      expect(res.status).toBe(403);
    });

    it('should reject duplicate title', async () => {
      const token = await createAdmin(app);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      const res = await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      expect(res.status).toBe(400);
    });
  });

  describe('GET / (list)', () => {
    it('should list problems with pagination', async () => {
      const token = await createAdmin(app);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...problemData, title: 'Second Problem' });

      const res = await request(app).get(PROBLEMS);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter by difficulty', async () => {
      const token = await createAdmin(app);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...problemData, title: 'Hard Problem', difficulty: 'Hard' });

      const res = await request(app).get(`${PROBLEMS}?difficulty=Easy`);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].difficulty).toBe('Easy');
    });

    it('should search by title', async () => {
      const token = await createAdmin(app);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);

      const res = await request(app).get(`${PROBLEMS}?search=Test`);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /:slug (detail)', () => {
    it('should get problem by slug', async () => {
      const token = await createAdmin(app);
      await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);

      const res = await request(app).get(`${PROBLEMS}/test-problem`);
      expect(res.status).toBe(200);
      expect(res.body.data.statement).toBe('Print the number 42.');
      expect(res.body.data.timeLimit).toBeDefined();
    });

    it('should return 404 for unknown slug', async () => {
      const res = await request(app).get(`${PROBLEMS}/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id (update)', () => {
    it('should update a problem', async () => {
      const token = await createAdmin(app);
      const created = await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      const id = created.body.data.id;

      const res = await request(app)
        .put(`${PROBLEMS}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Problem' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Problem');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete a problem', async () => {
      const token = await createAdmin(app);
      const created = await request(app)
        .post(PROBLEMS)
        .set('Authorization', `Bearer ${token}`)
        .send(problemData);
      const id = created.body.data.id;

      const res = await request(app)
        .delete(`${PROBLEMS}/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const check = await request(app).get(`${PROBLEMS}/test-problem`);
      expect(check.status).toBe(404);
    });
  });
});
