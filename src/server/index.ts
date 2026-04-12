import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  AdapterEnvironmentTestResult,
  MnemoPaySession,
  ServerAdapterModule,
} from '../types.js';
import { executeWithMnemo } from './execute.js';

// Deserialize MnemoPay session from Paperclip's sessionParams
function loadSession(ctx: AdapterExecutionContext): MnemoPaySession {
  const stored = ctx.runtime.sessionParams?.mnemo as Partial<MnemoPaySession> | undefined;
  return {
    agentId: stored?.agentId ?? ctx.agent.id,
    ficoScore: stored?.ficoScore ?? null,
    memoryKeys: stored?.memoryKeys ?? [],
    executionCount: stored?.executionCount ?? 0,
    lastExecutedAt: stored?.lastExecutedAt ?? null,
  };
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const session = loadSession(ctx);
  const { result, updatedSession } = await executeWithMnemo(ctx, session);

  // Merge updated MnemoPay session back into sessionParams for next heartbeat
  return {
    ...result,
    sessionParams: {
      ...ctx.runtime.sessionParams,
      mnemo: updatedSession,
    },
  };
}

export async function testEnvironment(): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentTestResult['details'] = [];

  // Check Anthropic API key
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  checks.push({
    label: 'ANTHROPIC_API_KEY set',
    ok: hasApiKey,
    message: hasApiKey ? 'Found in environment' : 'Set ANTHROPIC_API_KEY or configure mnemoPayApiKey in agent settings',
  });

  // Check MnemoPay SDK is importable
  try {
    await import('@mnemopay/sdk');
    checks.push({ label: '@mnemopay/sdk installed', ok: true });
  } catch {
    checks.push({
      label: '@mnemopay/sdk installed',
      ok: false,
      message: 'Run: npm install @mnemopay/sdk',
    });
  }

  // Check Node.js version
  const [major] = process.versions.node.split('.').map(Number);
  const nodeOk = major >= 20;
  checks.push({
    label: `Node.js >= 20 (current: ${process.versions.node})`,
    ok: nodeOk,
    message: nodeOk ? undefined : 'Upgrade Node.js to v20+',
  });

  return {
    ok: checks.every(c => c.ok),
    details: checks,
  };
}

// Session codec — Paperclip uses this to serialize/deserialize state across heartbeats
export const sessionCodec = {
  serialize(session: MnemoPaySession): Record<string, unknown> {
    return { mnemo: session };
  },
  deserialize(params: Record<string, unknown>): MnemoPaySession | null {
    const mnemo = params?.mnemo as Partial<MnemoPaySession> | undefined;
    if (!mnemo) return null;
    return {
      agentId: mnemo.agentId ?? '',
      ficoScore: mnemo.ficoScore ?? null,
      memoryKeys: mnemo.memoryKeys ?? [],
      executionCount: mnemo.executionCount ?? 0,
      lastExecutedAt: mnemo.lastExecutedAt ?? null,
    };
  },
};

const serverAdapter: ServerAdapterModule = { execute, testEnvironment };
export default serverAdapter;
