import { describe, expect, it } from "vitest";
import { escapeHtml, formatReports, splitTelegramMessage } from "../Telegram/format.js";

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
});

describe("escapeHtml", () => {
  it("escapes Telegram HTML control characters", () => {
    expect(escapeHtml("<tag>&value</tag>")).toBe("&lt;tag&gt;&amp;value&lt;/tag&gt;");
  });
});
