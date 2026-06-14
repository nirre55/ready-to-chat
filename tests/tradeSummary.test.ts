import { describe, expect, it } from "vitest";
import { formatTradeSummary, parseTradeSummary } from "../Telegram/tradeSummary.js";

const wrappedSummary = `
strategy                  total      win
loss  winrate   pending   no_entry     other
avg_win_px avg_loss_px    rr_real      rr_be
--------              ----   ---   ---
----  -------   -------   --------     -----
btc_15m_ensemble                 16        10
5   66.7%        0          0           1
0.5575      0.5475       0.81       0.50
btc_1h_ensemble                  23        16
7   69.6%        0          0           0
0.5793      0.5940       0.71       0.44
TOTAL                            96        64
31  67.4%        0          0           1
0.5747      0.5783       0.74       0.48
`;

describe("parseTradeSummary", () => {
  it("parses wrapped trade summary rows", () => {
    const rows = parseTradeSummary(wrappedSummary);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      strategy: "btc_15m_ensemble",
      total: "16",
      win: "10",
      loss: "5",
      winrate: "66.7%",
      rrReal: "0.81",
      rrBe: "0.50",
    });
    expect(rows[2]?.strategy).toBe("TOTAL");
  });
});

describe("formatTradeSummary", () => {
  it("formats rows into mobile-readable blocks", () => {
    const formatted = formatTradeSummary(wrappedSummary);

    expect(formatted).toContain("btc_15m_ensemble");
    expect(formatted).toContain("total 16 | win 10 | loss 5 | winrate 66.7%");
    expect(formatted).toContain("pending 0 | no_entry 0 | other 1");
    expect(formatted).toContain("avg +0.5575 | avg -0.5475 | rr 0.81 | be 0.50");
    expect(formatted).toContain("TOTAL");
  });

  it("returns null for unrecognized output", () => {
    expect(formatTradeSummary("hello world")).toBeNull();
  });
});
