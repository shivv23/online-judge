import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface LanguageConfig {
  image: string;
  file: string;
  command: string;
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  cpp: { image: 'gcc:14', file: 'main.cpp', command: 'g++ -O2 -o /tmp/main main.cpp && /tmp/main' },
  c: { image: 'gcc:14', file: 'main.c', command: 'gcc -O2 -o /tmp/main main.c && /tmp/main' },
  python: { image: 'python:3.12-slim', file: 'main.py', command: 'python3 main.py' },
  js: { image: 'node:22-alpine', file: 'main.js', command: 'node main.js' },
  java: { image: 'eclipse-temurin:21-jdk', file: 'Main.java', command: 'javac Main.java && java Main' },
};

export interface CompileRequest {
  language: string;
  code: string;
}

export interface CompileResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  timedOut: boolean;
  error?: string;
}

const RUN_TIMEOUT_MS = 10000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

export async function runCode(req: CompileRequest): Promise<CompileResult> {
  const config = LANGUAGE_CONFIGS[req.language];
  const containerName = `oj-exec-${crypto.randomBytes(6).toString('hex')}`;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'oj-exec-'));

  const startedAt = Date.now();
  try {
    await fs.writeFile(path.join(workDir, config.file), req.code, 'utf8');

    const args = [
      'run',
      '--rm',
      `--name=${containerName}`,
      '--network=none',
      '--cpus=0.5',
      '--memory=256m',
      '--pids-limit=50',
      '--read-only',
      '--tmpfs=/tmp:size=64m,exec',
      '--stop-timeout=5',
      '--user=1000:1000',
      '-e',
      'HOME=/tmp',
      '--workdir=/workspace',
      `-v=${workDir}:/workspace`,
      '--entrypoint',
      'sh',
      config.image,
      '-c',
      config.command,
    ];

    try {
      const { stdout, stderr } = await execFileAsync('docker', args, {
        timeout: RUN_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
      });
      return {
        stdout,
        stderr,
        exitCode: 0,
        executionTimeMs: Date.now() - startedAt,
        timedOut: false,
      };
    } catch (error: any) {
      const timedOut = error.killed === true;
      if (timedOut) {
        try {
          await execFileAsync('docker', ['rm', '-f', containerName]);
        } catch {
          // Container already removed.
        }
      }
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: typeof error.code === 'number' ? error.code : null,
        executionTimeMs: Date.now() - startedAt,
        timedOut,
        error: timedOut ? 'Execution timed out' : (error.message as string),
      };
    }
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
