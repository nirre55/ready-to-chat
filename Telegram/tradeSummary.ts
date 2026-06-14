export type TradeSummaryRow = {
  strategy: string;
  total: string;
  win: string;
  loss: string;
  winrate: string;
  pending: string;
  noEntry: string;
  other: string;
  avgWinPx: string;
  avgLossPx: string;
  rrReal: string;
  rrBe: string;
};

const ROW_VALUE_COUNT = 11;

export function formatTradeSummary(output: string): string | null {
  const rows = parseTradeSummary(output);

  if (!rows.length) {
    return null;
  }

  return rows.map(formatRow).join("\n\n");
}

export function parseTradeSummary(output: string): TradeSummaryRow[] {
  const tokens = output
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const rows: TradeSummaryRow[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token || !isStrategyToken(token)) {
      continue;
    }

    const values = tokens.slice(index + 1, index + 1 + ROW_VALUE_COUNT);
    if (values.length < ROW_VALUE_COUNT || !values.every(isSummaryValue)) {
      continue;
    }

    rows.push({
      strategy: token,
      total: values[0] ?? "",
      win: values[1] ?? "",
      loss: values[2] ?? "",
      winrate: values[3] ?? "",
      pending: values[4] ?? "",
      noEntry: values[5] ?? "",
      other: values[6] ?? "",
      avgWinPx: values[7] ?? "",
      avgLossPx: values[8] ?? "",
      rrReal: values[9] ?? "",
      rrBe: values[10] ?? "",
    });

    index += ROW_VALUE_COUNT;
  }

  return rows;
}

function formatRow(row: TradeSummaryRow): string {
  return [
    row.strategy,
    `total ${row.total} | win ${row.win} | loss ${row.loss} | winrate ${row.winrate}`,
    `pending ${row.pending} | no_entry ${row.noEntry} | other ${row.other}`,
    `avg +${row.avgWinPx} | avg -${row.avgLossPx} | rr ${row.rrReal} | be ${row.rrBe}`,
  ].join("\n");
}

function isStrategyToken(token: string): boolean {
  return token === "TOTAL" || /^[a-z0-9][a-z0-9_%-]*$/i.test(token);
}

function isSummaryValue(token: string): boolean {
  return token === "n/a" || /^\d+(?:\.\d+)?%?$/.test(token);
}
