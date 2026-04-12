export { execute, testEnvironment, sessionCodec } from './server/index.js';
export const ADAPTER_TYPE = 'mnemopay';
export const adapterInfo = {
    type: ADAPTER_TYPE,
    label: 'MnemoPay Agent Memory',
    description: 'Injects Agent FICO behavioral scoring (300-850) and persistent memory into any Paperclip-managed agent. ' +
        'FICO is computed from real execution history using five weighted components (payment history, utilization, ' +
        'account age, diversity, fraud record). Optional MnemoPay server integration adds semantic memory recall. ' +
        'Built on @mnemopay/sdk — Apache 2.0.',
    version: '0.2.0',
    homepage: 'https://getbizsuite.com/mnemopay/',
    models: [
        'claude-haiku-4-5-20251001',
        'claude-sonnet-4-6',
        'claude-opus-4-6',
    ],
    configSchema: {
        anthropicApiKey: {
            type: 'string',
            label: 'Anthropic API Key',
            description: 'Your Claude API key. Overrides ANTHROPIC_API_KEY env var.',
            secret: true,
            required: false,
        },
        mnemoPayServerUrl: {
            type: 'string',
            label: 'MnemoPay Server URL (optional)',
            description: 'URL of a running MnemoPay MCP server (e.g. http://localhost:3200). Enables persistent semantic memory recall across agents.',
            required: false,
        },
        mnemoPayToken: {
            type: 'string',
            label: 'MnemoPay Server Token (optional)',
            description: 'Bearer token for the MnemoPay server. Check MNEMOPAY_MCP_TOKEN in your MnemoPay .env.',
            secret: true,
            required: false,
        },
        taskPrompt: {
            type: 'string',
            label: 'Task Prompt',
            description: 'Standing instruction for this agent. What should it do on each heartbeat?',
            required: false,
            multiline: true,
        },
        model: {
            type: 'string',
            label: 'Model',
            description: 'Claude model. Default: claude-haiku-4-5-20251001 (fastest).',
            required: false,
            default: 'claude-haiku-4-5-20251001',
        },
        enableFicoGating: {
            type: 'boolean',
            label: 'Enable FICO Gating',
            description: 'Block execution if this agent\'s FICO score drops below the minimum threshold.',
            required: false,
            default: false,
        },
        minFicoScore: {
            type: 'number',
            label: 'Minimum FICO Score',
            description: 'Agents below this score are blocked when FICO Gating is enabled. Range 300-850.',
            required: false,
            default: 500,
        },
    },
};
//# sourceMappingURL=index.js.map