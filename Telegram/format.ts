import type { CommandResult } from "../src/commandRunner.js";
import type { ProjectsConfig } from "../src/projectConfig.js";
import type { ProjectTaskReport, TaskResult } from "../src/taskRunner.js";
import { formatTradeSummary } from "./tradeSummary.js";

const TELEGRAM_SAFE_MESSAGE_LENGTH = 3_800;
const TELEGRAM_SAFE_PRE_LENGTH = 3_200;

export const HELP_MESSAGE = [
  "Commandes disponibles:",
  "/projects - Liste les projets et commandes",
  "/run <projet|all> <commande> - Execute une commande configuree",
  "/balance - Solde USDC de chaque bot",
  "/summary - Trade summary de chaque bot",
  "/all - Solde + trade summary de chaque bot",
].join("\n");

export function formatProjects(projectsConfig: ProjectsConfig): string[] {
  const fullText = projectsConfig.projects
    .map((project) => {
      const commands = Object.keys(project.commands).join(", ");
      return [
        `<b>${escapeHtml(project.name)}</b>`,
        `<code>${escapeHtml(project.id)}</code>`,
        `path: <code>${escapeHtml(project.path)}</code>`,
        `commands: <code>${escapeHtml(commands)}</code>`,
      ].join("\n");
    })
    .join("\n\n");

  return splitTelegramMessage(fullText || "Aucun projet configure.");
}

export function formatReports(reports: ProjectTaskReport[]): string[] {
  return reports.flatMap((report) => splitTelegramMessage(formatProjectReport(report)));
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

function formatProjectReport(report: ProjectTaskReport): string {
  const sections = report.sections.map(formatSection).join("\n\n");
  return [
    `<b>${escapeHtml(report.projectName)}</b>`,
    `<code>${escapeHtml(report.projectId)}</code>`,
    `path: <code>${escapeHtml(report.projectPath)}</code>`,
    "",
    sections,
  ].join("\n");
}

function formatSection(section: TaskResult): string {
  if (section.status === "skipped") {
    return [
      `<b>${escapeHtml(section.commandLabel)}</b>: <code>SKIPPED</code>`,
      escapeHtml(section.skippedReason ?? "Command skipped"),
    ].join("\n");
  }

  const result = section.result;
  if (!result) {
    return `<b>${escapeHtml(section.commandLabel)}</b>: <code>ERROR</code>\nMissing command result`;
  }

  const status = getStatus(result);
  const pieces = [`<b>${escapeHtml(section.commandLabel)}</b>: <code>${escapeHtml(status)}</code>`];
  const compactBalance = section.commandId === "balance" ? formatCompactBalance(result.stdout) : null;
  const compactSummary = section.commandId === "summary" ? formatTradeSummary(result.stdout) : null;

  if (compactBalance) {
    pieces.push(`<pre>${escapeHtml(compactBalance)}</pre>`);
  } else if (compactSummary) {
    pieces.push(formatPre(compactSummary));
  } else if (result.stdout.trim()) {
    pieces.push(formatPre(result.stdout));
  }

  if (shouldShowStderr(result) && result.stderr.trim()) {
    pieces.push(`<b>stderr</b>\n${formatPre(result.stderr)}`);
  }

  if (result.error) {
    pieces.push(`<b>error</b>\n${formatPre(result.error)}`);
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

function shouldShowStderr(result: CommandResult): boolean {
  return result.exitCode !== 0 || result.timedOut || Boolean(result.error);
}

function formatCompactBalance(stdout: string): string | null {
  const balance = stdout.match(/balance=([^\s]+)/)?.[1];
  const latency = stdout.match(/latency=([^\s]+)/)?.[1];

  if (!balance && !latency) {
    return null;
  }

  return [balance, latency].filter(Boolean).join(" | ");
}

function formatPre(value: string): string {
  const trimmed = value.trim();
  const output =
    trimmed.length > TELEGRAM_SAFE_PRE_LENGTH
      ? `${trimmed.slice(0, TELEGRAM_SAFE_PRE_LENGTH)}\n\n[output coupe]`
      : trimmed;

  return `<pre>${escapeHtml(output)}</pre>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
