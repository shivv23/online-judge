import mongoose from 'mongoose';
import { env } from './config/env';
import { User } from './models/User';
import { Problem } from './models/Problem';
import { TestCase } from './models/TestCase';

interface SeedTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface SeedProblem {
  title: string;
  slug: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sampleInput: string;
  sampleOutput: string;
  timeLimit: number;
  memoryLimit: number;
  testCases: SeedTestCase[];
}

const seedProblems: SeedProblem[] = [
  {
    title: 'Sum of Two Numbers',
    slug: 'sum-of-two-numbers',
    statement:
      'You are given two integers A and B. Your task is to compute and print their sum.',
    inputFormat: 'A single line containing two space-separated integers A and B.',
    outputFormat: 'Print a single integer, the sum of A and B.',
    constraints: '-10^9 <= A, B <= 10^9',
    tags: ['math', 'basics'],
    difficulty: 'Easy',
    sampleInput: '3 5',
    sampleOutput: '8',
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: '3 5', expectedOutput: '8', isHidden: false },
      { input: '-7 2', expectedOutput: '-5', isHidden: false },
      { input: '0 0', expectedOutput: '0', isHidden: true },
      { input: '1000000000 1000000000', expectedOutput: '2000000000', isHidden: true },
    ],
  },
  {
    title: 'Reverse a String',
    slug: 'reverse-a-string',
    statement:
      'Given a string S, print its reverse. The reverse of a string is formed by reading the characters from right to left.',
    inputFormat: 'A single line containing the string S.',
    outputFormat: 'Print the reversed string.',
    constraints: '1 <= |S| <= 100. S consists of lowercase English letters and digits.',
    tags: ['strings', 'basics'],
    difficulty: 'Easy',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'openai', expectedOutput: 'ianepo', isHidden: false },
      { input: 'a', expectedOutput: 'a', isHidden: true },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: true },
      { input: 'abc123xyz', expectedOutput: 'zyx321cba', isHidden: true },
    ],
  },
  {
    title: 'Palindrome Check',
    slug: 'palindrome-check',
    statement:
      'A string is a palindrome if it reads the same forward and backward. Given a string S, print YES if it is a palindrome, otherwise print NO.',
    inputFormat: 'A single line containing the string S.',
    outputFormat: 'Print YES or NO.',
    constraints: '1 <= |S| <= 100. S consists of lowercase English letters only.',
    tags: ['strings', 'two-pointers'],
    difficulty: 'Medium',
    sampleInput: 'madam',
    sampleOutput: 'YES',
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: 'madam', expectedOutput: 'YES', isHidden: false },
      { input: 'hello', expectedOutput: 'NO', isHidden: false },
      { input: 'a', expectedOutput: 'YES', isHidden: true },
      { input: 'ab', expectedOutput: 'NO', isHidden: true },
      { input: 'abcba', expectedOutput: 'YES', isHidden: true },
    ],
  },
];

async function seed(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Seeding database...');

    let admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin12345',
        fullName: 'System Admin',
        role: 'admin',
      });
      console.log('Created admin user: admin@example.com / admin12345');
    }

    for (const problemData of seedProblems) {
      const existing = await Problem.findOne({ slug: problemData.slug }).select('_id');
      if (existing) {
        console.log(`Skipping existing problem: ${problemData.slug}`);
        continue;
      }

      const { testCases, ...problemFields } = problemData;
      const problem = await Problem.create({
        ...problemFields,
        createdBy: admin._id,
      });
      console.log(`Created problem: ${problemData.slug} (${problem._id})`);

      await TestCase.insertMany(
        testCases.map((tc, index) => ({
          ...tc,
          problemId: problem._id,
          order: index,
        })),
      );
      console.log(`  Seeded ${testCases.length} test cases`);
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
