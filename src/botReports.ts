import type { AppConfig } from "./config.js";
import { runCommand, type CommandResult } from "./commandRunner.js";

export type RepoReport = {
  repo: string;
  sections: ReportSection[];
};

export type ReportSection = {
  title: string;
  result: CommandResult;
};

export async function getBalanceReports(config: AppConfig): Promise<RepoReport[]> {
  return runForRepos(config, async (repo) => [
    {
      title: "Solde USDC",
      result: await runBalance(repo, config),
    },
  ]);
}

export async function getSummaryReports(config: AppConfig): Promise<RepoReport[]> {
  return runForRepos(config, async (repo) => [
    {
      title: "Trade summary",
      result: await runTradeSummary(repo, config),
    },
  ]);
}

export async function getAllReports(config: AppConfig): Promise<RepoReport[]> {
  return runForRepos(config, async (repo) => [
    {
      title: "Solde USDC",
      result: await runBalance(repo, config),
    },
    {
      title: "Trade summary",
      result: await runTradeSummary(repo, config),
    },
  ]);
}

async function runForRepos(
  config: AppConfig,
  buildSections: (repo: string) => Promise<ReportSection[]>,
): Promise<RepoReport[]> {
  const reports: RepoReport[] = [];

  for (const repo of config.botRepos) {
    reports.push({
      repo,
      sections: await buildSections(repo),
    });
  }

  return reports;
}

function runBalance(repo: string, config: AppConfig): Promise<CommandResult> {
  return runCommand({
    cwd: repo,
    command: "cargo",
    args: ["run", "--release", "--bin", "balance_latency"],
    env: {
      EXECUTION_MODE: config.executionMode,
      BALANCE_LATENCY_SAMPLES: "1",
    },
    timeoutMs: config.commandTimeoutMs,
  });
}

function runTradeSummary(repo: string, config: AppConfig): Promise<CommandResult> {
  return runCommand({
    cwd: repo,
    command: "chmod +x ./trade_summary.sh && ./trade_summary.sh",
    timeoutMs: config.commandTimeoutMs,
    shell: true,
  });
}
