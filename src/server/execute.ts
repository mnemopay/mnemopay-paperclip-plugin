import Anthropic from '@anthropic-ai/sdk';
import { AgentCreditScore } from '@mnemopay/sdk';
import { MnemoPayClient } from '@mnemopay/sdk/client';
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
  ExecutionRecord,
  MnemoPaySession,
} from '../types.js';

const MODEL_DEFAULT = 'claude-haiku-4-5-20251001';
const scorer = new AgentCreditScore();

// Build an optional MnemoPayClient if server URL is configured
function makeMemoryClient(config: Record<string, unknown>): MnemoPayClient | null {
  const url = (config.mnemoPayServerUrl as string) || process.env.MNEMOPAY_URL;
  if (!url) return null;
  const token = (config.mnemoPayToken as string) || process.env.MNEMOPAY_TOKEN;
  return new MnemoPayClient(url, token);
}

// Compute real Agent Credit Score from stored execution history
function computeAgentScore(session: MnemoPaySession): { score: number; rating: string; trustLevel: string } {
  if (session.executionHistory.length === 0) {
    return { score: 650, rating: 'good', trustLevel: 'standard' };
  }

  const result = scorer.compute({
    transactions: session.executionHistory.map(r => ({
      id: r.id,
      amount: r.amount,
      status: r.status === 'completed' ? 'completed'
        : r.status === 'failed' ? 'disputed'
        : 'expired',
      createdAt: new Date(r.createdAt),
      completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      reason: r.reason,
      riskScore: r.riskScore,
    })),
    createdAt: new Date(session.createdAt),
    fraudFlags: session.executionHistory.filter(r => r.riskScore && r.riskScore > 0.8).length,
    disputeCount: session.executionHistory.filter(r => r.status === 'failed').length,
    disputesLost: 0,
    warnings: 0,
    memoriesCount: session.executionHistory.length,
  });

  return { score: result.score, rating: result.rating, trustLevel: result.trustLevel };
}

export async function executeWithMnemo(
  ctx: AdapterExecutionContext,
  session: MnemoPaySession
): Promise<{ result: AdapterExecutionResult; updatedSession: MnemoPaySession }> {
  const config = (ctx.agent.adapterConfig as Record<string, unknown>) ?? {};
  const apiKey = (config.anthropicApiKey as string) || process.env.ANTHROPIC_API_KEY;
  const taskPrompt = (config.taskPrompt as string) || '';
  const model = (config.model as string) || MODEL_DEFAULT;
  // Accept new and legacy config field names; new names take precedence.
  const enableScoreGating =
    (config.enableScoreGating as boolean | undefined) ??
    (config.enableFicoGating as boolean | undefined) ??
    false;
  const minAgentScore =
    (config.minAgentScore as number | undefined) ??
    (config.minFicoScore as number | undefined) ??
    500;

  if (!apiKey) {
    await ctx.onLog('stderr', '[MnemoPay] No Anthropic API key — set ANTHROPIC_API_KEY or configure anthropicApiKey\n');
    return { result: { exitCode: 1 }, updatedSession: session };
  }

  // Compute real Agent Credit Score from execution history
  const scored = computeAgentScore(session);
  const updatedScoredSession = {
    ...session,
    agentScore: scored.score,
    agentRating: scored.rating,
    // legacy mirror (will be removed in v1.0.0)
    ficoScore: scored.score,
    ficoRating: scored.rating,
    trustLevel: scored.trustLevel,
  };

  await ctx.onLog('stdout',
    `[MnemoPay] Agent Credit Score: ${scored.score} (${scored.rating}) · Trust: ${scored.trustLevel} · Runs: ${session.executionCount}\n`
  );

  // Score gating — block before any API calls
  if (enableScoreGating && scored.score < minAgentScore) {
    await ctx.onLog('stderr',
      `[MnemoPay] Execution blocked — Agent Credit Score ${scored.score} below minimum ${minAgentScore}\n`
    );
    return { result: { exitCode: 2 }, updatedSession: updatedScoredSession };
  }

  // Recall memories from MnemoPay server (if configured)
  const memClient = makeMemoryClient(config);
  let memoryContext = session.memoryContext;

  if (memClient) {
    try {
      const taskQuery = ctx.runtime.taskKey ?? taskPrompt.slice(0, 80);
      memoryContext = await memClient.recall(taskQuery, 5);
      await ctx.onLog('stdout', `[MnemoPay] Recalled ${memoryContext ? 'context' : 'no memories'} for task\n`);
    } catch {
      // Memory server unavailable — proceed without context
    }
  }

  const systemPrompt = [
    `You are a Paperclip-managed AI agent named "${ctx.agent.name}".`,
    `Company: ${ctx.agent.companyId}.`,
    `Task key: ${ctx.runtime.taskKey ?? 'general'}.`,
    memoryContext ? `\n## Prior context (from MnemoPay memory)\n${memoryContext}` : '',
    `\n## Agent trust profile\nAgent Credit Score: ${scored.score}/850 (${scored.rating}) · Trust: ${scored.trustLevel}`,
    `\nRespond directly and concisely. Confirm actions taken. Explain blockers.`,
  ].filter(Boolean).join('\n');

  const userMessage = taskPrompt || `Execute your assigned task. Task key: ${ctx.runtime.taskKey ?? 'none'}.`;

  const client = new Anthropic({ apiKey });
  let responseText = '';
  let inputTokens = 0;
  let outputTokens = 0;

  const executionId = `${ctx.agent.id}-${Date.now()}`;
  const executionStart = new Date().toISOString();

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        responseText += chunk.delta.text;
        await ctx.onLog('stdout', chunk.delta.text);
      }
    }
    await ctx.onLog('stdout', '\n');

    // Use finalMessage() for accurate token counts — avoids NaN from early stream events
    const final = await stream.finalMessage();
    inputTokens = final.usage.input_tokens;
    outputTokens = final.usage.output_tokens;

    // Haiku pricing: $0.25/1M input, $1.25/1M output
    const costUsd = (inputTokens * 0.00000025) + (outputTokens * 0.00000125);
    await ctx.onMeta?.({ inputTokens, outputTokens, costUsd });

    // Store outcome in MnemoPay memory server (if configured)
    if (memClient && responseText) {
      try {
        await memClient.remember(
          `Task "${ctx.runtime.taskKey}" completed. Result: ${responseText.slice(0, 300)}`,
          { importance: 0.6, tags: ['execution', ctx.agent.id] }
        );
      } catch {
        // Non-fatal — memory store failure shouldn't fail the execution
      }
    }

    // Record this execution for Agent Credit Score
    const record: ExecutionRecord = {
      id: executionId,
      amount: costUsd,
      status: 'completed',
      createdAt: executionStart,
      completedAt: new Date().toISOString(),
      reason: ctx.runtime.taskKey ?? (taskPrompt.slice(0, 80) || 'general'),
      riskScore: 0,
    };

    const newHistory = [...session.executionHistory, record].slice(-200); // keep last 200
    const newScore = computeAgentScore({ ...updatedScoredSession, executionHistory: newHistory });

    const finalSession: MnemoPaySession = {
      ...updatedScoredSession,
      agentScore: newScore.score,
      agentRating: newScore.rating,
      // legacy mirror (will be removed in v1.0.0)
      ficoScore: newScore.score,
      ficoRating: newScore.rating,
      trustLevel: newScore.trustLevel,
      executionHistory: newHistory,
      memoryContext,
      executionCount: session.executionCount + 1,
      lastExecutedAt: new Date().toISOString(),
    };

    return {
      result: {
        exitCode: 0,
        inputTokens,
        outputTokens,
        costUsd,
        sessionParams: { mnemo: finalSession },
      },
      updatedSession: finalSession,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await ctx.onLog('stderr', `[MnemoPay] Execution error: ${msg}\n`);

    // Record failure for Agent Credit Score
    const failRecord: ExecutionRecord = {
      id: executionId,
      amount: 0,
      status: 'failed',
      createdAt: executionStart,
      reason: ctx.runtime.taskKey ?? 'general',
      riskScore: 0.5,
    };
    const newHistory = [...session.executionHistory, failRecord].slice(-200);
    const failScore = computeAgentScore({ ...updatedScoredSession, executionHistory: newHistory });

    return {
      result: { exitCode: 1 },
      updatedSession: {
        ...updatedScoredSession,
        agentScore: failScore.score,
        agentRating: failScore.rating,
        // legacy mirror (will be removed in v1.0.0)
        ficoScore: failScore.score,
        ficoRating: failScore.rating,
        trustLevel: failScore.trustLevel,
        executionHistory: newHistory,
        executionCount: session.executionCount + 1,
        lastExecutedAt: new Date().toISOString(),
      },
    };
  }
}
