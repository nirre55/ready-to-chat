# Telegram Output Format Design

Date: 2026-06-13

## Goal

Make Telegram responses readable on mobile by replacing raw command dumps with compact project messages and monospace output blocks.

## Scope

This change affects Telegram formatting only. It does not change command execution, project configuration, authentication, or Discord plans.

## Format Rules

- Send each project result as its own Telegram message.
- Use Telegram HTML formatting.
- Use short project and command headings.
- Wrap raw command output in `<pre>` blocks so tables keep alignment on mobile.
- Hide `stderr` when a command succeeds, because successful Rust builds print normal progress there.
- Show `stderr` when a command fails, times out, or reports a spawn error.
- For balance commands, extract the most useful line into a compact summary when possible.
- Keep long messages under a safe Telegram size by splitting output.

## Balance Display

When command output includes `balance=...` and `latency=...`, show:

```text
Trading Main
balance: OK
216.70USDC | 547ms
```

If parsing fails, fall back to the normal monospace output block.

## Generic Output Display

For summaries, errors, status commands, and other configured commands:

```text
Trading Five Year
summary: OK

<monospace output>
```

## Security

All output must be HTML-escaped before sending to Telegram.
