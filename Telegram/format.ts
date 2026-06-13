import type { RepoReport } from "../src/botReports.js";
import type { CommandResult } from "../src/commandRunner.js";

const TELEGRAM_SAFE_MESSAGE_LENGTH = 3_800;

export const HELP_MESSAGE = [
  "Commandes disponibles:",
  "/balance - Solde USDC de chaque bot",
  "/summary - Trade summary de chaque bot",
  "/all - Solde + trade summary de chaque bot",
].join("\n");

export function formatReports(reports: RepoReport[]): string[] {
  const fullText = reports.map(formatRepoReport).join("\n\n");
  return splitTelegramMessage(fullText);
}

export function splitTelegramMessage(text: string, limit = TELEGRAM_SAFE_MESSAGE_LENGTH): string[] {
  if (text.length <= limit) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf("\n", limit);

    if (splitAt <= 0) {
      splitAt = limit;
    }

    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function formatRepoReport(report: RepoReport): string {
  const sections = report.sections.map(formatSection).join("\n\n");
  return [`Repo: ${report.repo}`, "========================================", sections].join("\n");
}

function formatSection(section: { title: string; result: CommandResult }): string {
  const status = getStatus(section.result);
  const pieces = [`${section.title}: ${status}`];

  if (section.result.stdout.trim()) {
    pieces.push(section.result.stdout.trim());
  }

  if (section.result.stderr.trim()) {
    pieces.push(`stderr:\n${section.result.stderr.trim()}`);
  }

  if (section.result.error) {
    pieces.push(`error:\n${section.result.error}`);
  }

  return pieces.join("\n");
}

function getStatus(result: CommandResult): string {
  if (result.timedOut) {
    return "TIMEOUT";
  }

  if (result.error) {
    return "ERROR";
  }

  return result.exitCode === 0 ? "OK" : `FAILED (${result.exitCode ?? "unknown"})`;
}
