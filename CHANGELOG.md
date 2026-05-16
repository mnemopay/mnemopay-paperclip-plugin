# Changelog

## [0.4.0] — 2026-05-16 — Trademark scrub: FICO → Agent Credit Score

**Breaking-by-rename (graceful):** "Agent FICO" branding is replaced by **"Agent Credit Score"** throughout the public surface to remove any implied association with Fair Isaac Corporation. The 300–850 range and five-component methodology are unchanged. FICO is a registered trademark of Fair Isaac Corporation; this plugin is not affiliated with or endorsed by them.

Changed:
- `package.json` description rewritten; keyword `agent-fico` → `agent-credit-score`.
- `adapterInfo.description` rewritten; UI config labels now reference "Agent Credit Score" instead of "FICO".
- Stdout log lines now read `Agent Credit Score: …` instead of `Agent FICO: …`.
- `README.md` rewritten with an added Trademark notice section.

Added (new public surface):
- Config fields `enableScoreGating` (boolean) and `minAgentScore` (number) on `MnemoPayAdapterConfig` and in the adapter `configSchema`.
- Session fields `agentScore` and `agentRating` on `MnemoPaySession`.
- Internal `computeAgentScore()` helper (was `computeFico()`).

Deprecated (kept for back-compat, removed in v1.0.0):
- Config fields `enableFicoGating` and `minFicoScore` still accepted on `MnemoPayAdapterConfig`; the new field names take precedence when both are set.
- Session fields `ficoScore` and `ficoRating` still written on every persist and read on every load so sessions persisted under <= 0.3.x continue to work.

Migration:
- Reading the score: prefer `session.agentScore` / `session.agentRating`. The deprecated `ficoScore` / `ficoRating` are mirrored on every write.
- Configuring gating: prefer `enableScoreGating` + `minAgentScore`. Old keys still work.
- No code changes required to upgrade — old configs and persisted sessions continue to function until v1.0.0.

## [0.3.0] — Prior

Initial public release. Paperclip adapter with Agent FICO scoring (renamed in 0.4.0) and persistent memory.
