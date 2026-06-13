import "dotenv/config";

export type AppConfig = {
  telegramBotToken: string;
  telegramAllowedUserId: number;
  executionMode: string;
  botRepos: string[];
  commandTimeoutMs: number;
};

type Env = NodeJS.ProcessEnv;

const DEFAULT_EXECUTION_MODE = "dry-run";
const DEFAULT_COMMAND_TIMEOUT_MS = 120_000;

export function loadConfig(env: Env = process.env): AppConfig {
  const telegramBotToken = requiredString(env.TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN");
  const telegramAllowedUserId = requiredNumber(
    env.TELEGRAM_ALLOWED_USER_ID,
    "TELEGRAM_ALLOWED_USER_ID",
  );
  const botRepos = parseRepos(env.BOT_REPOS);
  const commandTimeoutMs = optionalPositiveNumber(
    env.COMMAND_TIMEOUT_MS,
    "COMMAND_TIMEOUT_MS",
    DEFAULT_COMMAND_TIMEOUT_MS,
  );

  return {
    telegramBotToken,
    telegramAllowedUserId,
    executionMode: env.EXECUTION_MODE?.trim() || DEFAULT_EXECUTION_MODE,
    botRepos,
    commandTimeoutMs,
  };
}

function requiredString(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }

  return trimmed;
}

function requiredNumber(value: string | undefined, name: string): number {
  const trimmed = requiredString(value, name);
  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${name} must be an integer`);
  }

  return parsed;
}

function optionalPositiveNumber(
  value: string | undefined,
  name: string,
  fallback: number,
): number {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseRepos(value: string | undefined): string[] {
  const repos = value
    ?.split(",")
    .map((repo) => repo.trim())
    .filter(Boolean);

  if (!repos?.length) {
    throw new Error("BOT_REPOS must contain at least one repository path");
  }

  return repos;
}
