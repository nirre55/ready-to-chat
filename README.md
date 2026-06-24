# Ready To Chat

Telegram controller for safe local server commands.

The app runs on the same Ubuntu server as your projects. It listens for Telegram commands from one allowed Telegram user and runs only predefined commands from `config/projects.json`.

## Commands

- `/help` - show available commands
- `/projects` - list configured projects and available command ids
- `/run <project|all> <command>` - run a configured command
- `/balance` - run the USDC balance report for each configured repo
- `/summary` - run the trade summary script for each configured repo
- `/history` - run the global trade history script for each configured repo
- `/erreurs` - show the last five configured errors for each repo
- `/errors` - English alias for `/erreurs`
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
COMMAND_TIMEOUT_MS=120000
PROJECTS_CONFIG_PATH=config/projects.json
```

`TELEGRAM_ALLOWED_USER_ID` is required. The bot ignores every other Telegram user.

Create your projects config:

```bash
cp config/projects.example.json config/projects.json
nano config/projects.json
```

Example project:

```json
{
  "id": "my-app",
  "name": "My App",
  "path": "/home/mehdi/my-app",
  "commands": {
    "errors": {
      "label": "Dernieres erreurs",
      "shell": "tail -n 100 logs/error.log"
    },
    "status": {
      "label": "Service status",
      "shell": "systemctl status my-app --no-pager"
    }
  }
}
```

Telegram can select `my-app` and `errors`, but it cannot send arbitrary shell text.

Examples:

```text
/projects
/run my-app errors
/run all balance
/history
/erreurs
```

For trading projects, configure:

```json
"history": {
  "label": "Historique global",
  "shell": "chmod +x ./trade_history_summary.sh && ./trade_history_summary.sh"
},
"errors": {
  "label": "Dernieres erreurs",
  "shell": "grep -h \"ERROR\" logs/supervisor/*.console.log | sort | tail -n 5"
}
```

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

## Add A New Server Or Project

Copy the project to the new server, install dependencies, create `.env`, then edit `config/projects.json` for that server's local project paths and allowed commands.

Keep sensitive or server-specific details in `config/projects.json`; that file is ignored by git.

## Future Discord Support

Discord should be added as a new `Discord/` folder that calls the existing report functions in `src/botReports.ts`.
