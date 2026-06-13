import { describe, expect, it } from "vitest";
import type { AppConfig } from "../src/config.js";
import type { ProjectsConfig } from "../src/projectConfig.js";
import { runCommandForAllProjects } from "../src/taskRunner.js";

const appConfig: AppConfig = {
  telegramBotToken: "token",
  telegramAllowedUserId: 123,
  executionMode: "dry-run",
  commandTimeoutMs: 10_000,
  projectsConfigPath: "config/projects.json",
};

const projectsConfig: ProjectsConfig = {
  projects: [
    {
      id: "has-errors",
      name: "Has Errors",
      path: ".",
      commands: {
        errors: {
          label: "Errors",
          command: process.execPath,
          args: ["-e", "console.log('ok')"],
        },
      },
    },
    {
      id: "no-errors",
      name: "No Errors",
      path: ".",
      commands: {
        status: {
          label: "Status",
          command: process.execPath,
          args: ["-e", "console.log('status')"],
        },
      },
    },
  ],
};

describe("runCommandForAllProjects", () => {
  it("runs configured commands and reports skipped projects", async () => {
    const reports = await runCommandForAllProjects(appConfig, projectsConfig, "errors");

    expect(reports).toHaveLength(2);
    expect(reports[0]?.sections[0]?.status).toBe("completed");
    expect(reports[0]?.sections[0]?.result?.stdout.trim()).toBe("ok");
    expect(reports[1]?.sections[0]?.status).toBe("skipped");
    expect(reports[1]?.sections[0]?.skippedReason).toContain("errors");
  });
});
