import { Context, Telegraf } from "telegraf";
import {
  getAllReports,
  getBalanceReports,
  getSummaryReports,
  type RepoReport,
} from "../src/botReports.js";
import { loadConfig, type AppConfig } from "../src/config.js";
import { formatReports, HELP_MESSAGE } from "./format.js";

type ReportBuilder = (config: AppConfig) => Promise<RepoReport[]>;

const config = loadConfig();
const bot = new Telegraf(config.telegramBotToken);

bot.start(async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await ctx.reply(HELP_MESSAGE);
});

bot.help(async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await ctx.reply(HELP_MESSAGE);
});

bot.command("balance", async (ctx) => {
  await handleReportCommand(ctx, "Je calcule les soldes USDC...", getBalanceReports);
});

bot.command("summary", async (ctx) => {
  await handleReportCommand(ctx, "Je genere les trade summaries...", getSummaryReports);
});

bot.command("all", async (ctx) => {
  await handleReportCommand(ctx, "Je genere les soldes et trade summaries...", getAllReports);
});

bot.on("text", async (ctx) => {
  if (!isAllowed(ctx.from?.id)) {
    return;
  }

  await ctx.reply(HELP_MESSAGE);
});

bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

bot.launch().then(() => {
  console.log("Telegram trading bot controller is running");
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

  await ctx.reply(progressMessage);

  try {
    const reports = await buildReports(config);
    for (const message of formatReports(reports)) {
      await ctx.reply(message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ctx.reply(`Erreur pendant l'execution: ${message}`);
  }
}

function isAllowed(userId: number | undefined): boolean {
  return userId === config.telegramAllowedUserId;
}
