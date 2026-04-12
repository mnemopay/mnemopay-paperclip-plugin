import type { AdapterExecutionContext, AdapterExecutionResult, AdapterEnvironmentTestResult, MnemoPaySession, ServerAdapterModule } from '../types.js';
export declare function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult>;
export declare function testEnvironment(): Promise<AdapterEnvironmentTestResult>;
export declare const sessionCodec: {
    encode(session: MnemoPaySession): Record<string, unknown>;
    decode(params: Record<string, unknown>): MnemoPaySession | null;
};
declare const serverAdapter: ServerAdapterModule;
export default serverAdapter;
//# sourceMappingURL=index.d.ts.map