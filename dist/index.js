// Main adapter export — Paperclip loads this to discover adapter metadata
export { execute, testEnvironment, sessionCodec } from './server/index.js';
export const ADAPTER_TYPE = 'mnemopay';
export const adapterInfo = {
    type: ADAPTER_TYPE,
    label: 'MnemoPay Agent Memory',
    description: 'Injects Agent FICO behavioral scoring and persistent memory into any Paperclip-managed agent. ' +
        'Scores degrade on anomalous behavior and recover with consistent performance. ' +
        'Built on @mnemopay/sdk — Apache 2.0.',
    version: '0.1.0',
    homepage: 'https://getbizsuite.com/mnemopay/',
    models: [
        'claude-haiku-4-5-20251001',
        'claude-sonnet-4-6',
        'claude-opus-4-6',
    ],
    configSchema: {
        mnemoPayApiKey: {
            type: 'string',
            label: 'Anthropic API Key (optional)',
            description: 'Overrides ANTHROPIC_API_KEY env var. Used to call Claude for task execution.',
            secret: true,
            required: false,
        },
        taskPrompt: {
            type: 'string',
            label: 'Task Prompt',
            description: 'The standing instruction for this agent. What should it do on each heartbeat?',
            required: false,
            multiline: true,
        },
        model: {
            type: 'string',
            label: 'Model',
            description: 'Claude model to use. Defaults to claude-haiku-4-5-20251001 (fastest, cheapest).',
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
            description: 'Agents with a FICO below this value will be blocked (only if FICO Gating is on).',
            required: false,
            default: 500,
        },
    },
};
//# sourceMappingURL=index.js.map