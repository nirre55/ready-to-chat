# Telegram Trading Bot Controller Design

Date: 2026-06-13

## Goal

Build a small server-side application that lets the owner request trading bot reports from Telegram. The application runs on the same Ubuntu server as the trading bot repositories and executes only predefined local commands.

The first version supports Telegram only. The project should be structured so a Discord interface can be added later without rewriting the report execution logic.

## Scope

The application will provide Telegram commands for:

- Showing the USDC balance for each configured bot repository.
- Showing the trade summary for each configured bot repository.
- Showing both reports in one request.
- Showing basic help.

The application will not provide arbitrary shell execution, trading actions, bot restarts, deployment controls, or Discord support in the first version.

## Recommended Approach

Use Node.js with TypeScript.

Reasons:

- It is lightweight and stable on Ubuntu.
- Telegram bot support is mature and simple.
- Discord can be added later with the same service layer.
- The expensive work stays inside the existing Rust repositories, so the TypeScript app only coordinates commands and formats results.

## Directory Structure

```text
Telegram/
  bot.ts
  format.ts
src/
  config.ts
  commandRunner.ts
  botReports.ts
.env.example
package.json
tsconfig.json
README.md
```

## Components

### Telegram/bot.ts

Owns Telegram-specific behavior:

- Starts the Telegram bot.
- Handles `/start`, `/help`, `/balance`, `/summary`, and `/all`.
- Checks that the sender matches `TELEGRAM_ALLOWED_USER_ID`.
- Sends progress and result messages back to Telegram.
- Ignores unauthorized users.

### Telegram/format.ts

Owns Telegram message formatting:

- Adds readable repo headings.
- Preserves command output in code blocks where practical.
- Splits long output into Telegram-safe message chunks.

### src/config.ts

Loads runtime configuration from environment variables:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_ID`
- `EXECUTION_MODE`
- `BOT_REPOS`
- `COMMAND_TIMEOUT_MS`

It validates required values at startup and fails fast with a clear error when configuration is missing or malformed.

### src/commandRunner.ts

Runs predefined commands in a repository directory:

- Executes commands with a timeout.
- Captures stdout, stderr, exit code, and timeout status.
- Does not accept arbitrary commands from Telegram users.

### src/botReports.ts

Contains channel-independent report logic:

- Runs the balance command for each configured repository.
- Runs the trade summary command for each configured repository.
- Combines balance and summary for the `/all` command.

This file is the main reuse point for a future `Discord/` folder.

## Telegram Commands

### `/start` and `/help`

Returns a short command list:

```text
/balance - Solde USDC de chaque bot
/summary - Trade summary de chaque bot
/all - Solde + trade summary de chaque bot
```

### `/balance`

For each configured repository, run:

```bash
EXECUTION_MODE="${EXECUTION_MODE:-dry-run}" BALANCE_LATENCY_SAMPLES=1 cargo run --release --bin balance_latency
```

The TypeScript implementation should set `EXECUTION_MODE` and `BALANCE_LATENCY_SAMPLES` through the child process environment rather than relying on shell interpolation.

### `/summary`

For each configured repository, run:

```bash
chmod +x ./trade_summary.sh
./trade_summary.sh
```

The first version may run this through a shell command because `chmod && ./trade_summary.sh` is a fixed internal command, not user input.

### `/all`

For each configured repository:

1. Run the balance command.
2. Run the trade summary command.
3. Return both outputs under the same repository heading.

## Configuration

Example `.env`:

```env
TELEGRAM_BOT_TOKEN=123456:telegram-token
TELEGRAM_ALLOWED_USER_ID=123456789
EXECUTION_MODE=dry-run
BOT_REPOS=/home/mehdi/rusty-poly-signal-runner,/home/mehdi/rusty-poly-signal-runner-fiveyear,/home/mehdi/rusty-poly-signal-runner-single
COMMAND_TIMEOUT_MS=120000
```

`BOT_REPOS` is a comma-separated list. The application should trim whitespace and reject an empty list.

## Security

The application must:

- Require `TELEGRAM_ALLOWED_USER_ID`.
- Ignore messages from any other Telegram user.
- Never execute raw text received from Telegram.
- Keep supported commands hard-coded.
- Avoid logging the Telegram bot token.
- Run with the normal server user account, not root, unless the deployment environment requires otherwise.

## Error Handling

For each repository command, the app should report:

- Repository path.
- Whether the command succeeded, failed, or timed out.
- Captured output.
- Captured stderr when present.

If one repository fails, the app should continue with the remaining repositories and include the failure in the final Telegram response.

If configuration is invalid, the app should fail at startup.

## Deployment

The first implementation should include README instructions for:

- Installing dependencies with `npm install`.
- Building TypeScript.
- Running the app locally with `.env`.
- Running it persistently on Ubuntu with `systemd`.

The systemd unit can be documented rather than installed automatically.

## Testing

The first implementation should include focused validation:

- Config parsing rejects missing token, missing allowed user id, and empty repository lists.
- Message splitting keeps Telegram messages under the safe size limit.
- Report execution can be tested with mocked or harmless commands if the code structure allows it.

Manual verification on the Ubuntu server:

1. Start the app with valid `.env`.
2. Send `/help` from the allowed Telegram account.
3. Send `/balance` and confirm each configured repository is processed.
4. Send `/summary` and confirm each configured repository is processed.
5. Send a message from another Telegram account and confirm it is ignored.

## Future Discord Extension

Later, add:

```text
Discord/
  bot.ts
  format.ts
```

The Discord bot should call the same `src/botReports.ts` functions. Only authentication, command routing, and message formatting should be Discord-specific.
