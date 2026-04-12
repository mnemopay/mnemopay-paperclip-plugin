export interface AdapterExecutionContext {
    runId: string;
    agent: {
        id: string;
        companyId: string;
        name: string;
        adapterType: string | null;
        adapterConfig: unknown;
    };
    runtime: {
        sessionId: string | null;
        sessionParams: Record<string, unknown>;
        sessionDisplayId: string | null;
        taskKey: string | null;
    };
    config: Record<string, unknown>;
    onLog: (stream: 'stdout' | 'stderr', chunk: string) => Promise<void>;
    onMeta?: (meta: AdapterInvocationMeta) => Promise<void>;
    authToken?: string;
}
export interface AdapterInvocationMeta {
    inputTokens?: number;
    outputTokens?: number;
    costUsd?: number;
}
export interface AdapterExecutionResult {
    exitCode: number;
    inputTokens?: number;
    outputTokens?: number;
    costUsd?: number;
    sessionParams?: Record<string, unknown>;
}
export interface AdapterEnvironmentTestResult {
    ok: boolean;
    details: Array<{
        label: string;
        ok: boolean;
        message?: string;
    }>;
}
export interface ServerAdapterModule {
    execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult>;
    testEnvironment?(): Promise<AdapterEnvironmentTestResult>;
}
export interface MnemoPaySession {
    agentId: string;
    ficoScore: number | null;
    memoryKeys: string[];
    executionCount: number;
    lastExecutedAt: string | null;
}
export interface MnemoPayAdapterConfig {
    mnemoPayApiKey?: string;
    taskPrompt?: string;
    model?: string;
    enableFicoGating?: boolean;
    minFicoScore?: number;
}
//# sourceMappingURL=types.d.ts.map