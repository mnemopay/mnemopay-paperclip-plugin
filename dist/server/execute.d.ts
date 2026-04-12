import type { AdapterExecutionContext, AdapterExecutionResult, MnemoPaySession } from '../types.js';
/**
 * Builds a prompt that includes recalled MnemoPay memories for the agent,
 * injects FICO context, then executes the task via Claude Haiku.
 */
export declare function executeWithMnemo(ctx: AdapterExecutionContext, session: MnemoPaySession): Promise<{
    result: AdapterExecutionResult;
    updatedSession: MnemoPaySession;
}>;
//# sourceMappingURL=execute.d.ts.map