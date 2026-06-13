# Ready To Chat

Telegram controller for local trading bot reports.

The app runs on the same Ubuntu server as the Rust bot repositories. It listens for Telegram commands from one allowed Telegram user and runs predefined local report commands.

## Commands

- `/help` - show available commands
- `/balance` - run the USDC balance report for each configured repo
- `/summary` - run the trade summary script for each configured repo
- `/all` - run balance and trade summary for each configured repo

## Setup

Install Node.js 20 or newer on the Ubuntu server, then install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
nano .env
```

Set:

```env
TELEGRAM_BOT_TOKEN=123456:telegram-token
TELEGRAM_ALLOWED_USER_ID=123456789
EXECUTION_MODE=dry-run
BOT_REPOS=/home/mehdi/rusty-poly-signal-runner,/home/mehdi/rusty-poly-signal-runner-fiveyear,/home/mehdi/rusty-poly-signal-runner-single
COMMAND_TIMEOUT_MS=120000
```

`TELEGRAM_ALLOWED_USER_ID` is required. The bot ignores every other Telegram user.

## Run

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## systemd

Example unit file:

```ini
[Unit]
Description=Ready To Chat Telegram Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/mehdi/ready-to-chat
EnvironmentFile=/home/mehdi/ready-to-chat/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
User=mehdi

[Install]
WantedBy=multi-user.target
```

Save it as:

```bash
sudo nano /etc/systemd/system/ready-to-chat.service
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ready-to-chat
sudo systemctl start ready-to-chat
sudo systemctl status ready-to-chat
```

Logs:

```bash
journalctl -u ready-to-chat -f
```

## Test

```bash
npm test
npm run build
```

## Future Discord Support

Discord should be added as a new `Discord/` folder that calls the existing report functions in `src/botReports.ts`.
