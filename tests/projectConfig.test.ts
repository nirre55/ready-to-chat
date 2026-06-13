import { describe, expect, it } from "vitest";
import { parseProjectsConfig } from "../src/projectConfig.js";

const validProjectsConfig = {
  projects: [
    {
      id: "trading-main",
      name: "Trading Main",
      path: "/repo/trading-main",
      commands: {
        balance: {
          label: "Solde USDC",
          command: "cargo",
          args: ["run", "--release", "--bin", "balance_latency"],
          env: {
            BALANCE_LATENCY_SAMPLES: "1",
          },
        },
        summary: {
          label: "Trade summary",
          shell: "chmod +x ./trade_summary.sh && ./trade_summary.sh",
        },
      },
    },
  ],
};

describe("parseProjectsConfig", () => {
  it("loads valid projects and commands", () => {
    const config = parseProjectsConfig(validProjectsConfig);

    expect(config.projects).toHaveLength(1);
    expect(config.projects[0]?.id).toBe("trading-main");
    expect(config.projects[0]?.commands.balance?.command).toBe("cargo");
    expect(config.projects[0]?.commands.summary?.shell).toContain("trade_summary.sh");
  });

  it("rejects duplicate project ids", () => {
    expect(() =>
      parseProjectsConfig({
        projects: [validProjectsConfig.projects[0], validProjectsConfig.projects[0]],
      }),
    ).toThrow("duplicate project id: trading-main");
  });

  it("rejects projects without commands", () => {
    expect(() =>
      parseProjectsConfig({
        projects: [
          {
            id: "empty",
            name: "Empty",
            path: "/repo/empty",
            commands: {},
          },
        ],
      }),
    ).toThrow("project empty must define at least one command");
  });

  it("rejects commands with command and shell", () => {
    expect(() =>
      parseProjectsConfig({
        projects: [
          {
            id: "bad",
            name: "Bad",
            path: "/repo/bad",
            commands: {
              errors: {
                label: "Errors",
                command: "tail",
                shell: "tail -n 100 error.log",
              },
            },
          },
        ],
      }),
    ).toThrow("command bad.errors cannot define both command and shell");
  });
});
