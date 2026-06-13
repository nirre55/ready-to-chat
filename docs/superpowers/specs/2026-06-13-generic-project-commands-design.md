# Generic Project Commands Design

Date: 2026-06-13

## Goal

Turn Ready To Chat from a trading-only Telegram controller into a reusable server command controller.

The app should let the owner configure projects and safe commands in a JSON file, then request information quickly through Telegram. The first reusable targets are trading bot balances, trade summaries, and error/status commands, but the design must work for other servers and unrelated projects later.

## Scope

This change includes:

- A `config/projects.example.json` file committed to git.
- A real `config/projects.json` file ignored by git.
- A project configuration loader and validator.
- Generic command execution by project id and command id.
- Telegram commands for listing projects and running configured commands.
- Backward-friendly shortcuts for the current trading workflow.

This change does not include:

- Discord support.
- Arbitrary shell commands sent from Telegram.
- A web UI.
- Remote SSH execution.
- Scheduled monitoring or automatic alerts.

## Recommended Approach

Use a JSON configuration file with explicit projects and explicit allowed commands.

Reasons:

- It is easy to copy to a new Ubuntu server.
- Adding a new project does not require code changes.
- It keeps command execution secure because Telegram can only select known command ids.
- It prepares the app for Discord or other notification channels later.

## Configuration Files

### `config/projects.example.json`

Committed example file showing the expected shape.

### `config/projects.json`

Real server-local configuration. This file is ignored by git because it may contain server paths, service names, or sensitive operational details.

### `.env`

Still owns secrets and global runtime settings:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_ID`
- `EXECUTION_MODE`
- `COMMAND_TIMEOUT_MS`
- `PROJECTS_CONFIG_PATH`

`PROJECTS_CONFIG_PATH` defaults to `config/projects.json`.

## Projects JSON Shape

```json
{
  "projects": [
    {
      "id": "trading-main",
      "name": "Trading Main",
      "path": "/home/mehdi/rusty-poly-signal-runner",
      "commands": {
        "balance": {
          "label": "Solde USDC",
          "command": "cargo",
          "args": ["run", "--release", "--bin", "balance_latency"],
          "env": {
            "BALANCE_LATENCY_SAMPLES": "1"
          }
        },
        "summary": {
          "label": "Trade summary",
          "shell": "chmod +x ./trade_summary.sh && ./trade_summary.sh"
        },
        "errors": {
          "label": "Dernieres erreurs",
          "shell": "journalctl -u trading-main -n 100 --no-pager"
        }
      }
    }
  ]
}
```

Each project has:

- `id`: stable short id used in Telegram commands.
- `name`: human readable display name.
- `path`: working directory for commands.
- `commands`: object keyed by command id.

Each command has:

- `label`: display label.
- Either `command` plus optional `args`, or `shell`.
- Optional `env` object.

The config loader rejects:

- Missing or duplicate project ids.
- Missing project paths.
- Projects with no commands.
- Empty command ids.
- Commands that define both `command` and `shell`.
- Commands that define neither `command` nor `shell`.
- Empty project ids.

## Telegram Commands

### `/projects`

Lists configured projects and available command ids.

Example:

```text
trading-main - Trading Main
commands: balance, summary, errors
```

### `/run <project|all> <command>`

Runs a configured command.

Examples:

```text
/run trading-main balance
/run trading-main errors
/run all balance
```

`all` means all projects that define the requested command id. Projects that do not define the command are skipped and reported.

### Existing Trading Shortcuts

Keep these shortcuts:

- `/balance`: equivalent to `/run all balance`
- `/summary`: equivalent to `/run all summary`
- `/all`: runs `balance` and `summary` for every project that supports them.

These shortcuts preserve the current workflow while the generic `/run` command enables new use cases.

## Architecture

```text
Telegram/
  bot.ts
  format.ts
config/
  projects.example.json
src/
  config.ts
  projectConfig.ts
  commandRunner.ts
  taskRunner.ts
  botReports.ts
```

### `src/projectConfig.ts`

Loads and validates `projects.json`.

Returns typed project definitions used by the rest of the app.

### `src/taskRunner.ts`

Runs configured commands by project and command id.

Responsibilities:

- Find matching project and command.
- Set the working directory to the project path.
- Merge process env, app env, and command env.
- Apply timeout.
- Return structured results for formatting.

### `src/botReports.ts`

Keeps user-friendly shortcuts:

- Balance reports.
- Summary reports.
- Balance plus summary reports.

Internally it delegates to `taskRunner.ts`.

### `Telegram/bot.ts`

Owns Telegram-specific routing:

- Auth check by `TELEGRAM_ALLOWED_USER_ID`.
- `/projects`.
- `/run`.
- Existing shortcuts.
- Friendly usage messages when command syntax is invalid.

### `Telegram/format.ts`

Formats generic project command results and splits long messages safely for Telegram.

## Security

The app must keep the same safety model:

- Only `TELEGRAM_ALLOWED_USER_ID` can use the bot.
- Telegram messages can only select project ids and command ids.
- Telegram messages can never provide raw shell text.
- Secrets stay out of `projects.example.json`.
- `config/projects.json` is ignored by git.

Shell commands are allowed only when they are explicitly configured in `projects.json` by the server owner.

## Error Handling

For each run, the response should include:

- Project id and name.
- Command id and label.
- Success, failure, timeout, or skipped status.
- stdout.
- stderr when present.
- error message when process spawning fails.

If one project fails during `/run all <command>`, the app continues with the other projects.

If `projects.json` is invalid or missing, the app fails at startup with a clear error.

## Testing

Add focused tests for:

- Valid project config loading.
- Duplicate project id rejection.
- Invalid command definitions.
- `/run all <command>` behavior when some projects do not define that command.
- Existing message splitting tests.
- Existing `.env` parsing tests adjusted for `PROJECTS_CONFIG_PATH`.

Manual verification on Ubuntu:

1. Copy `config/projects.example.json` to `config/projects.json`.
2. Adjust project paths and commands.
3. Start the bot.
4. Send `/projects`.
5. Send `/run trading-main balance`.
6. Send `/run all balance`.
7. Send `/balance` and `/summary` to confirm shortcuts still work.

## Future Extensions

Later changes can add:

- `Discord/` adapter using the same `taskRunner.ts`.
- Groups such as `trading`, `infra`, or `apps`.
- Scheduled checks and alerts.
- Optional per-command output limits.
- Optional command cooldowns.
