import Anthropic from '@anthropic-ai/sdk';
const MODEL_DEFAULT = 'claude-haiku-4-5-20251001';
// MnemoPay memory key prefix for Paperclip agents
const MEMORY_PREFIX = 'paperclip:agent:';
/**
 * Builds a prompt that includes recalled MnemoPay memories for the agent,
 * injects FICO context, then executes the task via Claude Haiku.
 */
export async function executeWithMnemo(ctx, session) {
    const config = ctx.agent.adapterConfig ?? {};
    const apiKey = config.mnemoPayApiKey || process.env.ANTHROPIC_API_KEY;
    const taskPrompt = config.taskPrompt || '';
    const model = config.model || MODEL_DEFAULT;
    const enableFicoGating = config.enableFicoGating ?? false;
    const minFicoScore = config.minFicoScore ?? 500;
    if (!apiKey) {
        await ctx.onLog('stderr', '[MnemoPay] No API key — set ANTHROPIC_API_KEY or configure mnemoPayApiKey\n');
        return {
            result: { exitCode: 1 },
            updatedSession: session,
        };
    }
    // FICO gating — block execution if agent score is too low
    if (enableFicoGating && session.ficoScore !== null && session.ficoScore < minFicoScore) {
        await ctx.onLog('stderr', `[MnemoPay] Agent FICO score ${session.ficoScore} is below minimum ${minFicoScore}. Execution blocked.\n`);
        return {
            result: { exitCode: 2 },
            updatedSession: session,
        };
    }
    // Build context from recalled memories
    const memoryContext = session.memoryKeys.length > 0
        ? `\n\n## Agent Memory (from MnemoPay)\nThis agent has ${session.memoryKeys.length} stored memory keys: ${session.memoryKeys.join(', ')}. Use this context when relevant.`
        : '';
    const ficoContext = session.ficoScore !== null
        ? `\n\n## Agent Trust Score\nAgent FICO: ${session.ficoScore}/850. ${session.ficoScore >= 700 ? 'High trust.' : session.ficoScore >= 500 ? 'Moderate trust — proceed with normal caution.' : 'Low trust — double-check outputs.'}`
        : '';
    const systemPrompt = `You are a Paperclip-managed AI agent named "${ctx.agent.name}".
Your company context: ${ctx.agent.companyId}.
Task: ${ctx.runtime.taskKey ?? 'general task'}.
${memoryContext}${ficoContext}

Respond concisely and directly. If you complete an action, confirm what was done. If you cannot complete a task, explain why.`;
    const userMessage = taskPrompt || `Execute your assigned task. Task key: ${ctx.runtime.taskKey ?? 'none'}.`;
    await ctx.onLog('stdout', `[MnemoPay] Agent FICO: ${session.ficoScore ?? 'unscored'} | Executing via ${model}\n`);
    const client = new Anthropic({ apiKey });
    let inputTokens = 0;
    let outputTokens = 0;
    let responseText = '';
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
            if (chunk.type === 'message_delta' && chunk.usage) {
                outputTokens = chunk.usage.output_tokens ?? 0;
            }
            if (chunk.type === 'message_start' && chunk.message?.usage) {
                inputTokens = chunk.message.usage.input_tokens ?? 0;
            }
        }
        await ctx.onLog('stdout', '\n');
        // Update session: increment execution count, record timestamp
        const updatedSession = {
            ...session,
            executionCount: session.executionCount + 1,
            lastExecutedAt: new Date().toISOString(),
            // Naive FICO update: successful completions nudge score up slightly
            ficoScore: session.ficoScore !== null
                ? Math.min(850, session.ficoScore + 1)
                : 650, // Default starting score for new agents
        };
        // Haiku pricing: $0.25/1M input, $1.25/1M output (as of 2026)
        const costUsd = (inputTokens * 0.00000025) + (outputTokens * 0.00000125);
        await ctx.onMeta?.({ inputTokens, outputTokens, costUsd });
        return {
            result: {
                exitCode: 0,
                inputTokens,
                outputTokens,
                costUsd,
                sessionParams: { mnemo: updatedSession },
            },
            updatedSession,
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await ctx.onLog('stderr', `[MnemoPay] Execution error: ${msg}\n`);
        return {
            result: { exitCode: 1 },
            updatedSession: session,
        };
    }
}
//# sourceMappingURL=execute.js.map