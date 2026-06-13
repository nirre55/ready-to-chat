import { spawn } from "node:child_process";

export type CommandResult = {
  command: string;
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  error?: string;
};

export type RunCommandOptions = {
  cwd: string;
  command: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  shell?: boolean;
};

export function runCommand(options: RunCommandOptions): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(options.command, options.args ?? [], {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
      shell: options.shell ?? false,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");

      setTimeout(() => {
        if (!settled) {
          child.kill("SIGKILL");
        }
      }, 5_000).unref();
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      resolve({
        command: renderCommand(options.command, options.args),
        cwd: options.cwd,
        exitCode: null,
        stdout,
        stderr,
        timedOut,
        error: error.message,
      });
    });

    child.on("close", (exitCode) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      resolve({
        command: renderCommand(options.command, options.args),
        cwd: options.cwd,
        exitCode,
        stdout,
        stderr,
        timedOut,
      });
    });
  });
}

function renderCommand(command: string, args?: string[]): string {
  if (!args?.length) {
    return command;
  }

  return [command, ...args].join(" ");
}
