import { describe, expect, it } from "vitest";
import { escapeHtml, formatReports, splitTelegramMessage } from "../Telegram/format.js";
import { HELP_MESSAGE } from "../Telegram/format.js";

describe("splitTelegramMessage", () => {
  it("keeps short messages unchanged", () => {
    expect(splitTelegramMessage("hello", 10)).toEqual(["hello"]);
  });

  it("splits long messages under the requested limit", () => {
    const chunks = splitTelegramMessage("aaa\nbbb\nccc\nddd", 7);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 7)).toBe(true);
    expect(chunks.join("\n")).toBe("aaa\nbbb\nccc\nddd");
  });

  it("splits long words when no newline is available", () => {
    const chunks = splitTelegramMessage("abcdefghij", 4);

    expect(chunks).toEqual(["abcd", "efgh", "ij"]);
  });
});

describe("formatReports", () => {
  it("formats balance output as a compact HTML message and hides successful stderr", () => {
    const messages = formatReports([
      {
        projectId: "trading-main",
        projectName: "Trading Main",
        projectPath: "/repo/trading-main",
        sections: [
          {
            projectId: "trading-main",
            projectName: "Trading Main",
            projectPath: "/repo/trading-main",
            commandId: "balance",
            commandLabel: "Solde USDC",
            status: "completed",
            result: {
              command: "cargo run --release --bin balance_latency",
              cwd: "/repo/trading-main",
              exitCode: 0,
              stdout: "sample=1/1 balance=216.70USDC latency=547ms\nsummary samples=1",
              stderr: "Finished release profile",
              timedOut: false,
            },
          },
        ],
      },
    ]);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("<b>Trading Main</b>");
    expect(messages[0]).toContain("<pre>216.70USDC | 547ms</pre>");
    expect(messages[0]).not.toContain("Finished release profile");
  });

  it("shows stderr when a command fails", () => {
    const messages = formatReports([
      {
        projectId: "app",
        projectName: "App",
        projectPath: "/repo/app",
        sections: [
          {
            projectId: "app",
            projectName: "App",
            projectPath: "/repo/app",
            commandId: "errors",
            commandLabel: "Errors",
            status: "completed",
            result: {
              command: "tail",
              cwd: "/repo/app",
              exitCode: 1,
              stdout: "",
              stderr: "cannot open log",
              timedOut: false,
            },
          },
        ],
      },
    ]);

    expect(messages[0]).toContain("<b>stderr</b>");
    expect(messages[0]).toContain("cannot open log");
  });

  it("formats summary output as compact strategy blocks", () => {
    const messages = formatReports([
      {
        projectId: "trading-main",
        projectName: "Trading Main",
        projectPath: "/repo/trading-main",
        sections: [
          {
            projectId: "trading-main",
            projectName: "Trading Main",
            projectPath: "/repo/trading-main",
            commandId: "summary",
            commandLabel: "Trade summary",
            status: "completed",
            result: {
              command: "./trade_summary.sh",
              cwd: "/repo/trading-main",
              exitCode: 0,
              stdout:
                "btc_15m_ensemble 16 10 5 66.7% 0 0 1 0.5575 0.5475 0.81 0.50\nTOTAL 16 10 5 66.7% 0 0 1 0.5575 0.5475 0.81 0.50",
              stderr: "",
              timedOut: false,
            },
          },
        ],
      },
    ]);

    expect(messages[0]).toContain("total 16 | win 10 | loss 5 | winrate 66.7%");
    expect(messages[0]).toContain("avg +0.5575 | avg -0.5475 | rr 0.81 | be 0.50");
  });

  it("formats trade history output as a compact block", () => {
    const messages = formatReports([
      {
        projectId: "trading-main",
        projectName: "Trading Main",
        projectPath: "/repo/trading-main",
        sections: [
          {
            projectId: "trading-main",
            projectName: "Trading Main",
            projectPath: "/repo/trading-main",
            commandId: "history",
            commandLabel: "Historique global",
            status: "completed",
            result: {
              command: "./trade_history_summary.sh",
              cwd: "/repo/trading-main",
              exitCode: 0,
              stdout: [
                "Premier trade : 2026-06-05 02:59:59 UTC",
                "Temps ecoule  : 15 jours, 12 heures",
                "Strategie     : five_year_70pct_btc_5m",
                "Date          : 2026-06-20 15:24:59 UTC",
                "Prix execute  : 0.57",
                "Shares achetes: 5.02",
              ].join("\n"),
              stderr: "",
              timedOut: false,
            },
          },
        ],
      },
    ]);

    expect(messages[0]).toContain("Premier trade");
    expect(messages[0]).toContain("Strategie : five_year_70pct_btc_5m");
    expect(messages[0]).not.toContain("Temps ecoule  :");
  });
});

describe("escapeHtml", () => {
  it("escapes Telegram HTML control characters", () => {
    expect(escapeHtml("<tag>&value</tag>")).toBe("&lt;tag&gt;&amp;value&lt;/tag&gt;");
  });
});

describe("HELP_MESSAGE", () => {
  it("mentions the errors shortcut", () => {
    expect(HELP_MESSAGE).toContain("/erreurs");
  });
});
