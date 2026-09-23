import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { BaseAgent } from '../src/agents/base/BaseAgent.js';
import { Orchestrator } from '../src/agents/orchestrator/Orchestrator.js';
import { createAIProvider } from '../src/integrations/ai/index.js';

const anthropicCreate = vi.hoisted(() => vi.fn());
const openaiCreate = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = { create: anthropicCreate };
    }
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor() {
      this.chat = { completions: { create: openaiCreate } };
    }
  },
}));

const silentLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

class TestAgent extends BaseAgent {
  name = 'test-agent';
  outputSchema = z.object({ ok: z.boolean() });

  buildPrompt(input) {
    return { system: 'sys', messages: [{ role: 'user', content: String(input) }] };
  }
}

describe('integrations/ai provider registry — routes by AI_PROVIDER only', () => {
  it('routes complete() calls to the Anthropic mock when provider is anthropic', async () => {
    anthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"ok":true}' }],
      usage: { input_tokens: 3, output_tokens: 4 },
    });

    const provider = await createAIProvider({
      provider: 'anthropic',
      model: 'claude-x',
      apiKey: 'k',
    });
    const result = await provider.complete({ system: 's', messages: [] });

    expect(anthropicCreate).toHaveBeenCalledTimes(1);
    expect(openaiCreate).not.toHaveBeenCalled();
    expect(result.provider).toBe('anthropic');
    expect(result.usage).toEqual({ inputTokens: 3, outputTokens: 4 });
  });

  it('routes the same call site to the OpenAI mock when only the provider field changes', async () => {
    anthropicCreate.mockClear();
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: '{"ok":true}' } }],
      usage: { prompt_tokens: 5, completion_tokens: 6 },
    });

    const provider = await createAIProvider({ provider: 'openai', model: 'gpt-x', apiKey: 'k' });
    const result = await provider.complete({ system: 's', messages: [] });

    expect(openaiCreate).toHaveBeenCalledTimes(1);
    expect(anthropicCreate).not.toHaveBeenCalled();
    expect(result.provider).toBe('openai');
  });

  it('throws AI_NOT_CONFIGURED for an unsupported provider string', async () => {
    await expect(
      createAIProvider({ provider: 'not-a-real-provider', model: 'm', apiKey: 'k' }),
    ).rejects.toMatchObject({ code: 'AI_NOT_CONFIGURED' });
  });

  it('forces a tool_use call built from jsonSchema on the Anthropic mock', async () => {
    anthropicCreate.mockClear();
    anthropicCreate.mockResolvedValue({
      content: [{ type: 'tool_use', name: 'structured_output', input: { ok: true } }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    const jsonSchema = { type: 'object', properties: { ok: { type: 'boolean' } } };

    const provider = await createAIProvider({
      provider: 'anthropic',
      model: 'claude-x',
      apiKey: 'k',
    });
    const result = await provider.complete({ system: 's', messages: [], jsonSchema });

    const callArgs = anthropicCreate.mock.calls[0][0];
    expect(callArgs.tools).toEqual([
      expect.objectContaining({ name: 'structured_output', input_schema: jsonSchema }),
    ]);
    expect(callArgs.tool_choice).toEqual({ type: 'tool', name: 'structured_output' });
    expect(JSON.parse(result.text)).toEqual({ ok: true });
  });

  it('forwards jsonSchema as response_format.json_schema on the OpenAI mock', async () => {
    openaiCreate.mockClear();
    openaiCreate.mockResolvedValue({
      choices: [{ message: { content: '{"ok":true}' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    });
    const jsonSchema = { type: 'object', properties: { ok: { type: 'boolean' } } };

    const provider = await createAIProvider({ provider: 'openai', model: 'gpt-x', apiKey: 'k' });
    await provider.complete({ system: 's', messages: [], jsonSchema });

    const callArgs = openaiCreate.mock.calls[0][0];
    expect(callArgs.response_format).toEqual({
      type: 'json_schema',
      json_schema: { name: 'structured_output', schema: jsonSchema },
    });
  });
});

describe('BaseAgent — Zod validation before use (FR-013)', () => {
  it('returns the validated object when the provider response conforms to the schema', async () => {
    const mockProvider = {
      complete: vi.fn().mockResolvedValue({ text: '{"ok":true}', usage: {} }),
    };
    const agent = new TestAgent({ aiProvider: mockProvider, logger: silentLogger });

    const result = await agent.run('hello');

    expect(result.output).toEqual({ ok: true });
    const callArgs = mockProvider.complete.mock.calls[0][0];
    expect(callArgs.jsonSchema).toMatchObject({ type: 'object' });
  });

  it('throws AIOutputValidationError and logs validation failed when the response does not conform', async () => {
    const mockProvider = {
      complete: vi.fn().mockResolvedValue({ text: '{"ok":"not-a-boolean"}', usage: {} }),
    };
    const warnSpy = vi.fn();
    const agent = new TestAgent({
      aiProvider: mockProvider,
      logger: { ...silentLogger, warn: warnSpy },
    });

    await expect(agent.run('hello')).rejects.toMatchObject({ code: 'AI_OUTPUT_INVALID' });
    expect(warnSpy).toHaveBeenCalledWith(expect.anything(), 'validation failed');
  });

  it('logs workflowId, agent name, model, and usage on both start and completion', async () => {
    const mockProvider = {
      complete: vi
        .fn()
        .mockResolvedValue({
          text: '{"ok":true}',
          model: 'claude-x',
          usage: { inputTokens: 1, outputTokens: 2 },
        }),
    };
    const infoSpy = vi.fn();
    const agent = new TestAgent({
      aiProvider: mockProvider,
      logger: { ...silentLogger, info: infoSpy },
    });

    await agent.run('hello', 'wf-123');

    expect(infoSpy).toHaveBeenCalledWith(
      { agent: 'test-agent', workflowId: 'wf-123' },
      'agent started',
    );
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: 'test-agent',
        workflowId: 'wf-123',
        model: 'claude-x',
        usage: { inputTokens: 1, outputTokens: 2 },
      }),
      'agent completed',
    );
  });

  it('retries up to maxRetries times on invalid JSON before succeeding', async () => {
    class RetryingAgent extends TestAgent {
      maxRetries = 2;
    }
    const mockProvider = {
      complete: vi
        .fn()
        .mockResolvedValueOnce({ text: 'not json', usage: {} })
        .mockResolvedValueOnce({ text: '{"ok":true}', usage: {} }),
    };
    const warnSpy = vi.fn();
    const agent = new RetryingAgent({
      aiProvider: mockProvider,
      logger: { ...silentLogger, warn: warnSpy },
    });

    const result = await agent.run('hello');

    expect(result.output).toEqual({ ok: true });
    expect(mockProvider.complete).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 1, maxRetries: 2 }),
      'validation failed',
    );
  });

  it('throws after exhausting all retries when every attempt is invalid', async () => {
    class RetryingAgent extends TestAgent {
      maxRetries = 1;
    }
    const mockProvider = {
      complete: vi.fn().mockResolvedValue({ text: 'not json', usage: {} }),
    };
    const agent = new RetryingAgent({ aiProvider: mockProvider, logger: silentLogger });

    await expect(agent.run('hello')).rejects.toMatchObject({ code: 'AI_OUTPUT_INVALID' });
    expect(mockProvider.complete).toHaveBeenCalledTimes(2);
  });
});

describe('Orchestrator — sequential run with an approval stop (FR-014)', () => {
  it('stops before a requiresApproval step and never invokes its run()', async () => {
    const step1 = {
      name: 'step1',
      requiresApproval: false,
      run: vi.fn().mockResolvedValue({ agent: 'step1', output: { x: 1 } }),
    };
    const step2Run = vi.fn();
    const step2 = { name: 'step2', requiresApproval: true, run: step2Run };

    const orchestrator = new Orchestrator({ logger: silentLogger });
    const result = await orchestrator.run([step1, step2], { start: true });

    expect(result.status).toBe('awaiting_approval');
    expect(result.pending.agent).toBe('step2');
    expect(step2Run).not.toHaveBeenCalled();
  });

  it('completes with a UUID workflowId when no step requires approval', async () => {
    const step1 = {
      name: 's1',
      requiresApproval: false,
      run: vi.fn().mockResolvedValue({ agent: 's1', output: { a: 1 } }),
    };
    const orchestrator = new Orchestrator({ logger: silentLogger });

    const result = await orchestrator.run([step1], {});

    expect(result.status).toBe('completed');
    expect(result.results).toHaveLength(1);
    expect(result.workflowId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(step1.run).toHaveBeenCalledWith({}, result.workflowId);
  });
});
