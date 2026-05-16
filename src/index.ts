import { execute, testEnvironment, sessionCodec } from './server/index.js';
export { execute, testEnvironment, sessionCodec };
export type { MnemoPayAdapterConfig, MnemoPaySession, ExecutionRecord } from './types.js';

export const ADAPTER_TYPE = 'mnemopay';

// Required by Paperclip's plugin-loader — must export createServerAdapter()
export function createServerAdapter() {
  return { execute, testEnvironment, type: ADAPTER_TYPE };
}

export const adapterInfo = {
  type: ADAPTER_TYPE,
  label: 'MnemoPay Agent Memory',
  description:
    'Injects Agent Credit Score behavioral scoring (300-850, FICO-style; not affiliated with Fair Isaac Corporation) and persistent memory into any Paperclip-managed agent. ' +
    'The score is computed from real execution history using five weighted components. ' +
    'Optional MnemoPay server integration adds semantic memory recall. ' +
    'Built on @mnemopay/sdk — Apache 2.0.',
  version: '0.3.0',
  homepage: 'https://getbizsuite.com/mnemopay/',
  models: [
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6',
    'claude-opus-4-6',
  ],
  configSchema: {
    anthropicApiKey: {
      type: 'string' as const,
      label: 'Anthropic API Key',
      description: 'Your Claude API key. Overrides ANTHROPIC_API_KEY env var.',
      secret: true,
      required: false,
    },
    mnemoPayServerUrl: {
      type: 'string' as const,
      label: 'MnemoPay Server URL (optional)',
      description: 'URL of a running MnemoPay MCP server (e.g. http://localhost:3200). Enables persistent semantic memory recall.',
      required: false,
    },
    mnemoPayToken: {
      type: 'string' as const,
      label: 'MnemoPay Server Token (optional)',
      description: 'Bearer token for the MnemoPay server (MNEMOPAY_MCP_TOKEN).',
      secret: true,
      required: false,
    },
    taskPrompt: {
      type: 'string' as const,
      label: 'Task Prompt',
      description: 'Standing instruction for this agent on each heartbeat.',
      required: false,
      multiline: true,
    },
    model: {
      type: 'string' as const,
      label: 'Model',
      description: 'Claude model. Default: claude-haiku-4-5-20251001.',
      required: false,
      default: 'claude-haiku-4-5-20251001',
    },
    enableScoreGating: {
      type: 'boolean' as const,
      label: 'Enable Agent Credit Score Gating',
      description: "Block execution if this agent's Agent Credit Score drops below the minimum threshold.",
      required: false,
      default: false,
    },
    minAgentScore: {
      type: 'number' as const,
      label: 'Minimum Agent Credit Score',
      description: 'Agents below this score are blocked when score gating is on. Range 300-850.',
      required: false,
      default: 500,
    },
    /** @deprecated Use enableScoreGating. Will be removed in v1.0.0. */
    enableFicoGating: {
      type: 'boolean' as const,
      label: '[deprecated] Enable FICO Gating',
      description: 'Deprecated alias for enableScoreGating. Will be removed in v1.0.0.',
      required: false,
      default: false,
    },
    /** @deprecated Use minAgentScore. Will be removed in v1.0.0. */
    minFicoScore: {
      type: 'number' as const,
      label: '[deprecated] Minimum FICO Score',
      description: 'Deprecated alias for minAgentScore. Will be removed in v1.0.0.',
      required: false,
      default: 500,
    },
  },
};
