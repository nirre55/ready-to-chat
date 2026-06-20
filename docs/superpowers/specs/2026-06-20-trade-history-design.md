# Trade History Telegram Design

Date: 2026-06-20

## Goal

Expose each trading repository's `trade_history_summary.sh` output through Telegram in a compact mobile-friendly format.

## Configuration

Add an allowed `history` command to each trading project in `config/projects.example.json`:

```json
"history": {
  "label": "Historique global",
  "shell": "chmod +x ./trade_history_summary.sh && ./trade_history_summary.sh"
}
```

Server owners must add the same command to their local ignored `config/projects.json`.

## Telegram Commands

- `/history` runs the `history` command for all configured projects.
- `/run trading-main history` runs it for one project.
- `/run all history` remains equivalent to the global run.
- `/all` remains balance plus summary only.

Projects without a `history` command are reported as skipped.

## Telegram Format

Recognized output is converted from:

```text
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
```

Into a compact project message:

```text
Premier trade
2026-06-05 02:59:59 UTC

Activite
15 jours, 12 heures, 59 minutes, 25 secondes

Dernier trade
Strategie : five_year_70pct_btc_5m
Date      : 2026-06-20 15:24:59 UTC
Prix      : 0.57
Shares    : 5.02
```

The existing project heading and command status remain visible.

If parsing fails because the shell script output changes, Telegram falls back to the escaped raw output.

## Architecture

- Add `getHistoryReports` to `src/botReports.ts`.
- Add `/history` routing to `Telegram/bot.ts`.
- Add a focused parser/formatter in `Telegram/tradeHistory.ts`.
- Call the parser from `Telegram/format.ts` when `commandId` is `history`.

## Testing

Tests must cover:

- Parsing the sample output.
- Compact formatted output.
- Returning `null` for unrecognized output.
- Telegram report integration.
- Existing build, tests, and audit.
