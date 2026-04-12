export { execute, testEnvironment, sessionCodec } from './server/index.js';
export type { MnemoPayAdapterConfig, MnemoPaySession, ExecutionRecord } from './types.js';
export declare const ADAPTER_TYPE = "mnemopay";
export declare const adapterInfo: {
    type: string;
    label: string;
    description: string;
    version: string;
    homepage: string;
    models: string[];
    configSchema: {
        anthropicApiKey: {
            type: "string";
            label: string;
            description: string;
            secret: boolean;
            required: boolean;
        };
        mnemoPayServerUrl: {
            type: "string";
            label: string;
            description: string;
            required: boolean;
        };
        mnemoPayToken: {
            type: "string";
            label: string;
            description: string;
            secret: boolean;
            required: boolean;
        };
        taskPrompt: {
            type: "string";
            label: string;
            description: string;
            required: boolean;
            multiline: boolean;
        };
        model: {
            type: "string";
            label: string;
            description: string;
            required: boolean;
            default: string;
        };
        enableFicoGating: {
            type: "boolean";
            label: string;
            description: string;
            required: boolean;
            default: boolean;
        };
        minFicoScore: {
            type: "number";
            label: string;
            description: string;
            required: boolean;
            default: number;
        };
    };
};
//# sourceMappingURL=index.d.ts.map