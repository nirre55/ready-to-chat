export type TradeHistorySummary = {
  firstTrade: string;
  elapsed: string;
  lastStrategy: string;
  lastTradeDate: string;
  executedPrice: string;
  sharesBought: string;
};

export function formatTradeHistory(output: string): string | null {
  const history = parseTradeHistory(output);

  if (!history) {
    return null;
  }

  return [
    "Premier trade",
    history.firstTrade,
    "",
    "Activite",
    history.elapsed,
    "",
    "Dernier trade",
    `Strategie : ${history.lastStrategy}`,
    `Date      : ${history.lastTradeDate}`,
    `Prix      : ${history.executedPrice}`,
    `Shares    : ${history.sharesBought}`,
  ].join("\n");
}

export function parseTradeHistory(output: string): TradeHistorySummary | null {
  const firstTrade = matchValue(output, /^Premier trade\s*:\s*(.+)$/im);
  const elapsed = matchValue(output, /^Temps ecoule\s*:\s*(.+)$/im);
  const lastStrategy = matchValue(output, /^Strategie\s*:\s*(.+)$/im);
  const lastTradeDate = matchValue(output, /^Date\s*:\s*(.+)$/im);
  const executedPrice = matchValue(output, /^Prix execute\s*:\s*(.+)$/im);
  const sharesBought = matchValue(output, /^Shares achetes\s*:\s*(.+)$/im);

  if (
    !firstTrade ||
    !elapsed ||
    !lastStrategy ||
    !lastTradeDate ||
    !executedPrice ||
    !sharesBought
  ) {
    return null;
  }

  return {
    firstTrade,
    elapsed,
    lastStrategy,
    lastTradeDate,
    executedPrice,
    sharesBought,
  };
}

function matchValue(output: string, pattern: RegExp): string | null {
  return output.match(pattern)?.[1]?.trim() || null;
}
