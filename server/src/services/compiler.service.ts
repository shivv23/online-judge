import { spawn, execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface LanguageConfig {
  image: string;
  file: string;
  compileCommand?: string;
  runCommand: string;
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  cpp: {
    image: 'gcc:14',
    file: 'main.cpp',
    compileCommand: 'g++ -O2 -o main main.cpp',
    runCommand: './main',
  },
  c: {
    image: 'gcc:14',
    file: 'main.c',
    compileCommand: 'gcc -O2 -o main main.c',
    runCommand: './main',
  },
  python: { image: 'python:3.12-slim', file: 'main.py', runCommand: 'python3 main.py' },
  js: { image: 'node:22-alpine', file: 'main.js', runCommand: 'node main.js' },
  java: {
    image: 'eclipse-temurin:21-jdk',
    file: 'Main.java',
    compileCommand: 'javac Main.java',
    runCommand: 'java Main',
  },
};

export interface CompileRequest {
  language: string;
  code: string;
  input?: string;
}

export type CompileStatus = 'success' | 'compile_error' | 'runtime_error' | 'timeout';

export interface CompileResult {
  status: CompileStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
}

export interface CompileSession {
  workDir: string;
  status: 'success' | 'compile_error' | 'timeout';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
}

const COMPILE_TIMEOUT_MS = parseInt(process.env.JUDGE_COMPILE_TIMEOUT_MS || '30000', 10);
const RUN_TIMEOUT_MS = parseInt(process.env.JUDGE_RUN_TIMEOUT_MS || '15000', 10);
const MAX_OUTPUT_BYTES = 1024 * 1024;
const CONTAINER_PREFIX = 'oj-exec-';

export async function cleanupOrphanContainers(): Promise<void> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'ps', '-aq',
      '--filter', `name=${CONTAINER_PREFIX}`,
    ]);
    const ids = stdout.trim().split('\n').filter(Boolean);
    if (ids.length > 0) {
      await execFileAsync('docker', ['rm', '-f', ...ids]);
      console.log(`[docker] cleaned up ${ids.length} orphan container(s)`);
    }
  } catch {
    // Docker may not be available — ignore
  }
}

const CONTAINER_RUNTIME_DIR = process.env.JUDGE_CONTAINER_DIR || os.tmpdir();
const HOST_RUNTIME_DIR = process.env.JUDGE_HOST_DIR || '';

function baseDockerArgs(containerName: string, workDir: string): string[] {
  const hostMountDir = HOST_RUNTIME_DIR
    ? path.join(HOST_RUNTIME_DIR, path.basename(workDir))
    : workDir;
  return [
    'run',
    '--rm',
    `--name=${containerName}`,
    '--network=none',
    '--cpus=0.5',
    '--memory=256m',
    '--memory-swap=256m',
    '--ulimit=fsize=8388608:8388608',
    '--ulimit=nofile=64:64',
    '--pids-limit=50',
    '--read-only',
    '--tmpfs=/tmp:size=64m,exec',
    '--stop-timeout=5',
    '--user=1000:1000',
    '--security-opt=no-new-privileges',
    '--cap-drop=ALL',
    '-e',
    'HOME=/tmp',
    '--workdir=/workspace',
    `-v=${hostMountDir}:/workspace`,
    '--entrypoint',
    'sh',
  ];
}

const MAX_CODE_BYTES = 50 * 1024;

interface ContainerRun {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  overflow: boolean;
}

function runInContainer(args: string[], stdin?: string, timeoutMs = RUN_TIMEOUT_MS): Promise<ContainerRun> {
  return new Promise((resolve) => {
    const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let overflow = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT_BYTES) {
        overflow = true;
        child.kill();
      }
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk;
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, timedOut, overflow });
    });

    child.on('error', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: null, timedOut: false, overflow: false });
    });

    child.stdin.write(stdin ?? '');
    child.stdin.end();
  });
}

export async function compileCode(req: CompileRequest): Promise<CompileSession> {
  const config = LANGUAGE_CONFIGS[req.language];
  const codeBytes = Buffer.byteLength(req.code, 'utf8');
  const startedAt = Date.now();
  await fs.mkdir(CONTAINER_RUNTIME_DIR, { recursive: true });
  const workDir = await fs.mkdtemp(path.join(CONTAINER_RUNTIME_DIR, 'oj-exec-'));

  if (codeBytes > MAX_CODE_BYTES) {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    return {
      workDir,
      status: 'compile_error',
      stdout: '',
      stderr: `Code size ${codeBytes} bytes exceeds limit of ${MAX_CODE_BYTES} bytes`,
      exitCode: 1,
      executionTimeMs: 0,
    };
  }

  try {
    await fs.chmod(workDir, 0o777);
    await fs.writeFile(path.join(workDir, config.file), req.code, 'utf8');
    await fs.chmod(path.join(workDir, config.file), 0o644);

    if (!config.compileCommand) {
      return {
        workDir,
        status: 'success',
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTimeMs: Date.now() - startedAt,
      };
    }

    const compileName = `oj-exec-${crypto.randomBytes(6).toString('hex')}`;
    const compile = await runInContainer(
      [
        ...baseDockerArgs(compileName, workDir),
        config.image,
        '-c',
        config.compileCommand,
      ],
      undefined,
      COMPILE_TIMEOUT_MS,
    );

    if (compile.timedOut) {
      await execFileAsync('docker', ['rm', '-f', compileName]).catch(() => undefined);
      return {
        workDir,
        status: 'timeout',
        stdout: '',
        stderr: 'Compilation timed out',
        exitCode: null,
        executionTimeMs: Date.now() - startedAt,
      };
    }
    if (compile.exitCode !== 0) {
      return {
        workDir,
        status: 'compile_error',
        stdout: compile.stdout,
        stderr: compile.stderr,
        exitCode: compile.exitCode,
        executionTimeMs: Date.now() - startedAt,
      };
    }

    return {
      workDir,
      status: 'success',
      stdout: compile.stdout,
      stderr: compile.stderr,
      exitCode: 0,
      executionTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

export async function disposeSession(session: CompileSession): Promise<void> {
  await fs.rm(session.workDir, { recursive: true, force: true });
}

export async function runCode(req: CompileRequest): Promise<CompileResult> {
  const session = await compileCode(req);
  try {
    if (session.status === 'compile_error') {
      return {
        status: 'compile_error',
        stdout: session.stdout,
        stderr: session.stderr,
        exitCode: session.exitCode,
        executionTimeMs: session.executionTimeMs,
      };
    }
    if (session.status === 'timeout') {
      return {
        status: 'timeout',
        stdout: '',
        stderr: 'Compilation timed out',
        exitCode: null,
        executionTimeMs: session.executionTimeMs,
      };
    }
    return await runCompiled(session, req);
  } finally {
    await disposeSession(session);
  }
}

export async function runCompiled(
  session: CompileSession,
  req: CompileRequest,
  timeoutMs = RUN_TIMEOUT_MS,
): Promise<CompileResult> {
  const config = LANGUAGE_CONFIGS[req.language];
  const startedAt = Date.now();
  const runName = `oj-exec-${crypto.randomBytes(6).toString('hex')}`;
  const run = await runInContainer(
    [...baseDockerArgs(runName, session.workDir), '--interactive', config.image, '-c', config.runCommand],
    req.input,
    timeoutMs,
  );

  if (run.timedOut) {
    await execFileAsync('docker', ['rm', '-f', runName]).catch(() => undefined);
    return {
      status: 'timeout',
      stdout: '',
      stderr: 'Execution timed out',
      exitCode: null,
      executionTimeMs: Date.now() - startedAt,
    };
  }
  if (run.overflow) {
    return {
      status: 'runtime_error',
      stdout: '',
      stderr: 'Output limit exceeded',
      exitCode: null,
      executionTimeMs: Date.now() - startedAt,
    };
  }
  if (run.exitCode !== 0) {
    return {
      status: 'runtime_error',
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: run.exitCode,
      executionTimeMs: Date.now() - startedAt,
    };
  }

  return {
    status: 'success',
    stdout: run.stdout,
    stderr: run.stderr,
    exitCode: 0,
    executionTimeMs: Date.now() - startedAt,
  };
}
