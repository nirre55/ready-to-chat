import { describe, expect, it } from "vitest";
import { formatTradeHistory, parseTradeHistory } from "../Telegram/tradeHistory.js";

const historyOutput = `
Global trade history
====================
Premier trade : 2026-06-05 02:59:59 UTC
Temps ecoule  : 15 jours, 12 heures, 59 minutes, 25 secondes

Dernier trade execute
---------------------
Strategie     : five_year_70pct_btc_5m
Date          : 2026-06-20 15:24:59 UTC
Prix execute  : 0.57
Shares achetes: 5.02
`;

describe("parseTradeHistory", () => {
  it("parses the global trade history output", () => {
    expect(parseTradeHistory(historyOutput)).toEqual({
      firstTrade: "2026-06-05 02:59:59 UTC",
      elapsed: "15 jours, 12 heures, 59 minutes, 25 secondes",
      lastStrategy: "five_year_70pct_btc_5m",
      lastTradeDate: "2026-06-20 15:24:59 UTC",
      executedPrice: "0.57",
      sharesBought: "5.02",
    });
  });

  it("returns null for unrecognized output", () => {
    expect(parseTradeHistory("no trade data")).toBeNull();
  });
});

describe("formatTradeHistory", () => {
  it("formats a compact mobile-friendly summary", () => {
    const formatted = formatTradeHistory(historyOutput);

    expect(formatted).toContain("Premier trade\n2026-06-05 02:59:59 UTC");
    expect(formatted).toContain("Activite\n15 jours, 12 heures, 59 minutes, 25 secondes");
    expect(formatted).toContain("Strategie : five_year_70pct_btc_5m");
    expect(formatted).toContain("Prix      : 0.57");
    expect(formatted).toContain("Shares    : 5.02");
  });
});
