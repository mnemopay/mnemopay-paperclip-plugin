# mnemopay-paperclip-plugin

Paperclip adapter that injects **Agent FICO behavioral scoring** and **persistent memory** into any [Paperclip](https://github.com/paperclipai/paperclip)-managed agent.

Built on [@mnemopay/sdk](https://www.npmjs.com/package/@mnemopay/sdk) · Apache 2.0 · by [Jerry Omiagbo](https://getbizsuite.com/mnemopay/)

---

## What it does

Every Paperclip agent running this adapter gets:

- **Agent FICO score (300–850)** — behavioral credit score derived from execution history. Scores improve with successful runs, degrade on anomalies.
- **Persistent memory** — execution context, task keys, and memory references survive across Paperclip heartbeats via the session codec.
- **FICO gating** — optionally block execution if an agent's score drops below a threshold (e.g., after detected manipulation or repeated failures).
- **Claude-powered execution** — agents execute tasks via Claude Haiku by default (fastest, cheapest), configurable per-agent.

---

## Install

```bash
npm install mnemopay-paperclip-plugin
```

---

## Adapter config (in Paperclip UI)

| Field | Type | Default | Description |
|---|---|---|---|
| `mnemoPayApiKey` | string | `ANTHROPIC_API_KEY` env | Anthropic API key for this agent |
| `taskPrompt` | string | — | Standing instruction for what this agent does each heartbeat |
| `model` | string | `claude-haiku-4-5-20251001` | Claude model to use |
| `enableFicoGating` | boolean | `false` | Block execution below min FICO |
| `minFicoScore` | number | `500` | Minimum FICO required to execute |

---

## How FICO scoring works

New agents start at **650**. Each successful execution nudges the score up by 1 point (capped at 850). Future versions will integrate full MnemoPay EWMA anomaly detection and Merkle-anchored audit trails for tamper-proof scoring.

FICO gating is optional. When enabled, an agent with a score below `minFicoScore` is blocked at the adapter level — it logs a warning and returns exit code `2`.

---

## Session persistence

The adapter serializes session state (`ficoScore`, `memoryKeys`, `executionCount`, `lastExecutedAt`) into Paperclip's `sessionParams.mnemo` object. This state survives heartbeat cycles and server restarts.

---

## Links

- **MnemoPay SDK**: https://getbizsuite.com/mnemopay/
- **npm**: https://www.npmjs.com/package/@mnemopay/sdk
- **GitHub**: https://github.com/mnemopay
- **Contact**: jeremiah@getbizsuite.com

---

## License

Apache 2.0 — same as @mnemopay/sdk
