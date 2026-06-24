# Errors Telegram Command Design

Date: 2026-06-24

## Goal

Add a Telegram shortcut for showing the last five errors from each configured project.

## Telegram Commands

- `/erreurs` runs the configured `errors` command for all projects.
- `/errors` is an English alias for the same command.
- `/run trading-main errors` continues to work for one project.

Projects without an `errors` command are reported as skipped.

## Recommended Project Command

For trading repositories, configure:

```json
"errors": {
  "label": "Dernieres erreurs",
  "shell": "grep -h \"ERROR\" logs/supervisor/*.console.log | sort | tail -n 5"
}
```

This intentionally does not use `tail -f`, because Telegram commands must finish. The command reads existing supervisor logs, keeps only `ERROR` lines, sorts timestamped lines, and returns the five latest errors.

## Scope

This change does not add live monitoring, alerts, or background subscriptions. It only adds an on-demand Telegram shortcut.

## Testing

Tests should verify:

- `getErrorReports` delegates to the configured `errors` command.
- `/erreurs` and `/errors` are listed in help text.
- Existing build, tests, and audit still pass.
