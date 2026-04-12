import type { AdapterExecutionContext, AdapterExecutionResult, MnemoPaySession } from '../types.js';
export declare function executeWithMnemo(ctx: AdapterExecutionContext, session: MnemoPaySession): Promise<{
    result: AdapterExecutionResult;
    updatedSession: MnemoPaySession;
}>;
//# sourceMappingURL=execute.d.ts.map