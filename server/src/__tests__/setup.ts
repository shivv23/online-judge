import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async function globalSetup(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-secret-for-jest';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
}
