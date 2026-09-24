import { ZodSchema } from 'zod';
import { aiProvider, AIMessage } from '../../integrations/ai.provider';
import logger from '../../utils/logger';

export interface AgentRunOptions<T> {
  messages: AIMessage[];
  systemPrompt?: string;
  outputSchema: ZodSchema<T>;
  workflowId: string;
  maxTokens?: number;
}

export class AgentOutputError extends Error {
  constructor(
    public readonly agent: string,
    message: string,
  ) {
    super(message);
    this.name = 'AgentOutputError';
  }
}

// Fallback for providers without a native JSON mode that still wrap output in fences
const stripCodeFences = (raw: string) =>
  raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

export abstract class BaseAgent {
  abstract readonly name: string;

  async run<T>({
    messages,
    systemPrompt,
    outputSchema,
    workflowId,
    maxTokens,
  }: AgentRunOptions<T>): Promise<T> {
    const start = Date.now();
    const base = { workflowId, agent: this.name };
    logger.info({ ...base, status: 'started' }, 'Agent started');

    try {
      const { text, model, usage } = await aiProvider.complete(messages, {
        systemPrompt,
        json: true,
        maxTokens,
      });
      const meta = { ...base, model, usage };

      let json: unknown;
      try {
        json = JSON.parse(stripCodeFences(text));
      } catch {
        logger.warn(
          { ...meta, status: 'validation_failed', reason: 'non_json' },
          'Agent validation failed',
        );
        throw new AgentOutputError(this.name, `Agent ${this.name} returned non-JSON output`);
      }

      const parsed = outputSchema.safeParse(json);
      if (!parsed.success) {
        logger.warn(
          { ...meta, status: 'validation_failed', issues: parsed.error.issues },
          'Agent validation failed',
        );
        throw new AgentOutputError(this.name, `Agent ${this.name} output failed schema validation`);
      }

      logger.info(
        { ...meta, status: 'completed', duration: Date.now() - start },
        'Agent completed',
      );
      return parsed.data;
    } catch (err) {
      logger.error(
        { ...base, status: 'failed', duration: Date.now() - start, err },
        'Agent failed',
      );
      throw err;
    }
  }
}
