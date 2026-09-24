import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const { complete } = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock('../integrations/ai.provider', () => ({ aiProvider: { complete } }));

import { BaseAgent, AgentOutputError } from '../agents/base/base.agent';

class TestAgent extends BaseAgent {
  readonly name = 'test-agent';
}

const schema = z.object({ verdict: z.enum(['keep', 'remove']) });
const run = () =>
  new TestAgent().run({
    messages: [{ role: 'user', content: 'classify' }],
    outputSchema: schema,
    workflowId: 'wf-1',
  });

const completion = (text: string) => ({
  text,
  model: 'test-model',
  usage: { inputTokens: 10, outputTokens: 5 },
});

describe('BaseAgent', () => {
  beforeEach(() => complete.mockReset());

  it('requests JSON mode and returns validated output', async () => {
    complete.mockResolvedValue(completion('{"verdict":"remove"}'));
    await expect(run()).resolves.toEqual({ verdict: 'remove' });
    expect(complete.mock.calls[0][1]).toMatchObject({ json: true });
  });

  it('accepts JSON wrapped in markdown fences', async () => {
    complete.mockResolvedValue(completion('```json\n{"verdict":"keep"}\n```'));
    await expect(run()).resolves.toEqual({ verdict: 'keep' });
  });

  it('rejects non-JSON output', async () => {
    complete.mockResolvedValue(completion('I think you should remove it'));
    await expect(run()).rejects.toBeInstanceOf(AgentOutputError);
  });

  it('rejects output that fails the schema', async () => {
    complete.mockResolvedValue(completion('{"verdict":"maybe"}'));
    await expect(run()).rejects.toThrow(/schema validation/);
  });
});
