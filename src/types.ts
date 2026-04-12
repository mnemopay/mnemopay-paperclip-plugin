// Paperclip adapter types — sourced from @paperclipai/adapter-utils interfaces

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
  details: Array<{ label: string; ok: boolean; message?: string }>;
}

export interface ServerAdapterModule {
  execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult>;
  testEnvironment?(): Promise<AdapterEnvironmentTestResult>;
}

// One execution record — used by AgentCreditScore to compute FICO
export interface ExecutionRecord {
  id: string;
  amount: number; // cost in USD (used as proxy for credit utilization)
  status: 'completed' | 'failed' | 'blocked';
  createdAt: string; // ISO string
  completedAt?: string;
  reason: string; // task key or prompt summary
  riskScore?: number;
}

// MnemoPay session state persisted across Paperclip heartbeats via sessionParams
export interface MnemoPaySession {
  agentId: string;
  ficoScore: number | null;
  ficoRating: string | null;
  trustLevel: string | null;
  executionHistory: ExecutionRecord[];
  memoryContext: string; // last recalled memories, cached
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
}

// Config fields shown in Paperclip UI
export interface MnemoPayAdapterConfig {
  anthropicApiKey?: string;
  mnemoPayServerUrl?: string; // Optional: URL of running MnemoPay MCP server
  mnemoPayToken?: string;     // Optional: Bearer token for MnemoPay server
  taskPrompt?: string;
  model?: string;
  enableFicoGating?: boolean;
  minFicoScore?: number;
}
