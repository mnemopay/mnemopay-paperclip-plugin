import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  AdapterEnvironmentTestResult,
  MnemoPaySession,
  ServerAdapterModule,
} from '../types.js';
import { executeWithMnemo } from './execute.js';

const SESSION_KEY = 'mnemo';

function loadSession(ctx: AdapterExecutionContext): MnemoPaySession {
  const stored = ctx.runtime.sessionParams?.[SESSION_KEY] as Partial<MnemoPaySession> | undefined;
  return {
    agentId: stored?.agentId ?? ctx.agent.id,
    ficoScore: stored?.ficoScore ?? null,
    ficoRating: stored?.ficoRating ?? null,
    trustLevel: stored?.trustLevel ?? null,
    executionHistory: stored?.executionHistory ?? [],
    memoryContext: stored?.memoryContext ?? '',
    executionCount: stored?.executionCount ?? 0,
    lastExecutedAt: stored?.lastExecutedAt ?? null,
    createdAt: stored?.createdAt ?? new Date().toISOString(),
  };
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const session = loadSession(ctx);
  const { result, updatedSession } = await executeWithMnemo(ctx, session);
  return {
    ...result,
    sessionParams: {
      ...ctx.runtime.sessionParams,
      [SESSION_KEY]: updatedSession,
    },
  };
}

export async function testEnvironment(): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentTestResult['details'] = [];

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  checks.push({
    label: 'ANTHROPIC_API_KEY set',
    ok: hasApiKey,
    message: hasApiKey ? 'Found in environment' : 'Set ANTHROPIC_API_KEY or configure anthropicApiKey in agent settings',
  });

  try {
    await import('@mnemopay/sdk');
    checks.push({ label: '@mnemopay/sdk installed', ok: true, message: 'AgentCreditScore available' });
  } catch {
    checks.push({ label: '@mnemopay/sdk installed', ok: false, message: 'Run: npm install @mnemopay/sdk' });
  }

  const mnemoUrl = process.env.MNEMOPAY_URL;
  if (mnemoUrl) {
    try {
      const { MnemoPayClient } = await import('@mnemopay/sdk/client');
      const client = new MnemoPayClient(mnemoUrl, process.env.MNEMOPAY_TOKEN);
      const health = await client.health();
      checks.push({ label: `MnemoPay server (${mnemoUrl})`, ok: health.status === 'ok', message: `mode: ${health.mode}` });
    } catch (e) {
      checks.push({ label: `MnemoPay server (${mnemoUrl})`, ok: false, message: String(e) });
    }
  } else {
    checks.push({
      label: 'MnemoPay server (optional)',
      ok: true,
      message: 'Not configured — FICO scoring works locally, memory persistence disabled. Set MNEMOPAY_URL to enable.',
    });
  }

  const [major] = process.versions.node.split('.').map(Number);
  const nodeOk = major >= 20;
  checks.push({
    label: `Node.js >= 20 (current: ${process.versions.node})`,
    ok: nodeOk,
    message: nodeOk ? undefined : 'Upgrade Node.js to v20+',
  });

  return { ok: checks.every(c => c.ok), details: checks };
}

// Session codec — Paperclip calls these to persist state across heartbeats
export const sessionCodec = {
  encode(session: MnemoPaySession): Record<string, unknown> {
    return { [SESSION_KEY]: session };
  },
  decode(params: Record<string, unknown>): MnemoPaySession | null {
    const s = params?.[SESSION_KEY] as Partial<MnemoPaySession> | undefined;
    if (!s?.agentId) return null;
    return {
      agentId: s.agentId,
      ficoScore: s.ficoScore ?? null,
      ficoRating: s.ficoRating ?? null,
      trustLevel: s.trustLevel ?? null,
      executionHistory: s.executionHistory ?? [],
      memoryContext: s.memoryContext ?? '',
      executionCount: s.executionCount ?? 0,
      lastExecutedAt: s.lastExecutedAt ?? null,
      createdAt: s.createdAt ?? new Date().toISOString(),
    };
  },
};

const serverAdapter: ServerAdapterModule = { execute, testEnvironment };
export default serverAdapter;
