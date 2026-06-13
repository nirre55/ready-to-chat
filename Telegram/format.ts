import type { CommandResult } from "../src/commandRunner.js";
import type { ProjectsConfig } from "../src/projectConfig.js";
import type { ProjectTaskReport, TaskResult } from "../src/taskRunner.js";

const TELEGRAM_SAFE_MESSAGE_LENGTH = 3_800;

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
      return [`${project.id} - ${project.name}`, `path: ${project.path}`, `commands: ${commands}`].join(
        "\n",
      );
    })
    .join("\n\n");

  return splitTelegramMessage(fullText || "Aucun projet configure.");
}

export function formatReports(reports: ProjectTaskReport[]): string[] {
  const fullText = reports.map(formatProjectReport).join("\n\n");
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

function formatProjectReport(report: ProjectTaskReport): string {
  const sections = report.sections.map(formatSection).join("\n\n");
  return [
    `Project: ${report.projectId} - ${report.projectName}`,
    `Path: ${report.projectPath}`,
    "========================================",
    sections,
  ].join("\n");
}

function formatSection(section: TaskResult): string {
  if (section.status === "skipped") {
    return `${section.commandLabel}: SKIPPED\n${section.skippedReason ?? "Command skipped"}`;
  }

  const result = section.result;
  if (!result) {
    return `${section.commandLabel}: ERROR\nMissing command result`;
  }

  const status = getStatus(result);
  const pieces = [`${section.commandLabel}: ${status}`];

  if (result.stdout.trim()) {
    pieces.push(result.stdout.trim());
  }

  if (result.stderr.trim()) {
    pieces.push(`stderr:\n${result.stderr.trim()}`);
  }

  if (result.error) {
    pieces.push(`error:\n${result.error}`);
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
