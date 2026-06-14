import { Context, Telegraf } from "telegraf";
import {
  getAllReports,
  getBalanceReports,
  getSummaryReports,
  type ProjectReport,
} from "../src/botReports.js";
import { loadConfig, type AppConfig } from "../src/config.js";
import { loadProjectsConfig } from "../src/projectConfig.js";
import { runCommandForAllProjects, runProjectCommand } from "../src/taskRunner.js";
import { formatProjects, formatReports, HELP_MESSAGE } from "./format.js";

type ReportBuilder = (config: AppConfig) => Promise<ProjectReport[]>;

const config = loadConfig();
const projectsConfig = loadProjectsConfig(config.projectsConfigPath);
const bot = new Telegraf(config.telegramBotToken);

bot.start(async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await replyText(ctx, HELP_MESSAGE);
});

bot.help(async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await replyText(ctx, HELP_MESSAGE);
});

bot.command("balance", async (ctx) => {
  await handleReportCommand(ctx, "Je calcule les soldes USDC...", (appConfig) =>
    getBalanceReports(appConfig, projectsConfig),
  );
});

bot.command("summary", async (ctx) => {
  await handleReportCommand(ctx, "Je genere les trade summaries...", (appConfig) =>
    getSummaryReports(appConfig, projectsConfig),
  );
});

bot.command("all", async (ctx) => {
  await handleReportCommand(ctx, "Je genere les soldes et trade summaries...", (appConfig) =>
    getAllReports(appConfig, projectsConfig),
  );
});

bot.command("projects", async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  for (const message of formatProjects(projectsConfig)) {
    await replyHtml(ctx, message);
  }
});

bot.command("run", async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  const [target, commandId] = getCommandArgs(ctx);
  if (!target || !commandId) {
    await replyText(ctx, "Usage: /run <projet|all> <commande>\nExemple: /run trading-main balance");
    return;
  }

  await handleReportCommand(ctx, `J'execute ${commandId} pour ${target}...`, (appConfig) => {
    if (target === "all") {
      return runCommandForAllProjects(appConfig, projectsConfig, commandId);
    }

    return runProjectCommand(appConfig, projectsConfig, target, commandId);
  });
});

bot.on("text", async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await replyText(ctx, HELP_MESSAGE);
});

bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

bot.launch().then(() => {
  console.log("Ready To Chat Telegram controller is running");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

async function handleReportCommand(
  ctx: Context,
  progressMessage: string,
  buildReports: ReportBuilder,
): Promise<void> {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await replyText(ctx, progressMessage);

  try {
    const reports = await buildReports(config);
    for (const message of formatReports(reports)) {
      await replyHtml(ctx, message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await replyText(ctx, `Erreur pendant l'execution: ${message}`);
  }
}

function isAllowed(userId: number | undefined): boolean {
  return userId === config.telegramAllowedUserId;
}

function getCommandArgs(ctx: Context): string[] {
  const text = getMessageText(ctx);
  return text.split(/\s+/).slice(1);
}

function getMessageText(ctx: Context): string {
  const message = ctx.message;

  if (message && "text" in message && typeof message.text === "string") {
    return message.text.trim();
  }

  return "";
}

function replyText(ctx: Context, message: string): Promise<unknown> {
  return ctx.reply(message);
}

function replyHtml(ctx: Context, message: string): Promise<unknown> {
  return ctx.reply(message, { parse_mode: "HTML" });
}
