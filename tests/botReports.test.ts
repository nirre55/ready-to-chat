import { describe, expect, it } from "vitest";
import { getErrorReports } from "../src/botReports.js";
import type { AppConfig } from "../src/config.js";
import type { ProjectsConfig } from "../src/projectConfig.js";

const appConfig: AppConfig = {
  telegramBotToken: "token",
  telegramAllowedUserId: 123,
  executionMode: "dry-run",
  commandTimeoutMs: 10_000,
  projectsConfigPath: "config/projects.json",
};

describe("getErrorReports", () => {
  it("runs the configured errors command", async () => {
    const projectsConfig: ProjectsConfig = {
      projects: [
        {
          id: "test-project",
          name: "Test Project",
          path: ".",
          commands: {
            errors: {
              label: "Dernieres erreurs",
              command: process.execPath,
              args: ["-e", "console.log('ERROR one')"],
            },
          },
        },
      ],
    };

    const reports = await getErrorReports(appConfig, projectsConfig);

    expect(reports[0]?.sections[0]?.commandId).toBe("errors");
    expect(reports[0]?.sections[0]?.result?.stdout.trim()).toBe("ERROR one");
  });
});
