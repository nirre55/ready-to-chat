import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

const validEnv = {
  TELEGRAM_BOT_TOKEN: "token",
  TELEGRAM_ALLOWED_USER_ID: "12345",
};

describe("loadConfig", () => {
  it("loads required values and defaults", () => {
    const config = loadConfig(validEnv);

    expect(config.telegramBotToken).toBe("token");
    expect(config.telegramAllowedUserId).toBe(12345);
    expect(config.executionMode).toBe("dry-run");
    expect(config.commandTimeoutMs).toBe(120_000);
    expect(config.projectsConfigPath).toBe("config/projects.json");
  });

  it("rejects a missing token", () => {
    expect(() => loadConfig({ ...validEnv, TELEGRAM_BOT_TOKEN: "" })).toThrow(
      "TELEGRAM_BOT_TOKEN is required",
    );
  });

  it("rejects a missing allowed user id", () => {
    expect(() => loadConfig({ ...validEnv, TELEGRAM_ALLOWED_USER_ID: "" })).toThrow(
      "TELEGRAM_ALLOWED_USER_ID is required",
    );
  });

  it("loads a custom projects config path", () => {
    const config = loadConfig({
      ...validEnv,
      PROJECTS_CONFIG_PATH: "/etc/ready-to-chat/projects.json",
    });

    expect(config.projectsConfigPath).toBe("/etc/ready-to-chat/projects.json");
  });
});
