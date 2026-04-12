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
export interface ExecutionRecord {
    id: string;
    amount: number;
    status: 'completed' | 'failed' | 'blocked';
    createdAt: string;
    completedAt?: string;
    reason: string;
    riskScore?: number;
}
export interface MnemoPaySession {
    agentId: string;
    ficoScore: number | null;
    ficoRating: string | null;
    trustLevel: string | null;
    executionHistory: ExecutionRecord[];
    memoryContext: string;
    executionCount: number;
    lastExecutedAt: string | null;
    createdAt: string;
}
export interface MnemoPayAdapterConfig {
    anthropicApiKey?: string;
    mnemoPayServerUrl?: string;
    mnemoPayToken?: string;
    taskPrompt?: string;
    model?: string;
    enableFicoGating?: boolean;
    minFicoScore?: number;
}
//# sourceMappingURL=types.d.ts.map