import "dotenv/config";

export type AppConfig = {
  telegramBotToken: string;
  telegramAllowedUserId: number;
  executionMode: string;
  commandTimeoutMs: number;
  projectsConfigPath: string;
};

type Env = NodeJS.ProcessEnv;

const DEFAULT_EXECUTION_MODE = "dry-run";
const DEFAULT_COMMAND_TIMEOUT_MS = 120_000;
const DEFAULT_PROJECTS_CONFIG_PATH = "config/projects.json";

export function loadConfig(env: Env = process.env): AppConfig {
  const telegramBotToken = requiredString(env.TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN");
  const telegramAllowedUserId = requiredNumber(
    env.TELEGRAM_ALLOWED_USER_ID,
    "TELEGRAM_ALLOWED_USER_ID",
  );
  const commandTimeoutMs = optionalPositiveNumber(
    env.COMMAND_TIMEOUT_MS,
    "COMMAND_TIMEOUT_MS",
    DEFAULT_COMMAND_TIMEOUT_MS,
  );

  return {
    telegramBotToken,
    telegramAllowedUserId,
    executionMode: env.EXECUTION_MODE?.trim() || DEFAULT_EXECUTION_MODE,
    commandTimeoutMs,
    projectsConfigPath: env.PROJECTS_CONFIG_PATH?.trim() || DEFAULT_PROJECTS_CONFIG_PATH,
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
