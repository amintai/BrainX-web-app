import { ZodSchema } from 'zod';
import { aiProvider, AIMessage } from '../../integrations/ai.provider';
import logger from '../../utils/logger';

export interface AgentRunOptions<T> {
  messages: AIMessage[];
  systemPrompt?: string;
  outputSchema: ZodSchema<T>;
  workflowId: string;
}

export abstract class BaseAgent {
  abstract readonly name: string;

  async run<T>({ messages, systemPrompt, outputSchema, workflowId }: AgentRunOptions<T>): Promise<T> {
    const start = Date.now();
    logger.info({ workflowId, agent: this.name, status: 'started' }, 'Agent started');

    try {
      const raw = await aiProvider.complete(messages, systemPrompt);

      let json: unknown;
      try {
        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
        json = JSON.parse(cleaned);
      } catch {
        throw new Error(`Agent ${this.name} returned non-JSON output`);
      }

      const result = outputSchema.parse(json);

      logger.info(
        { workflowId, agent: this.name, status: 'completed', duration: Date.now() - start },
        'Agent completed',
      );
      return result;
    } catch (err) {
      logger.error(
        { workflowId, agent: this.name, status: 'failed', duration: Date.now() - start, err },
        'Agent failed',
      );
      throw err;
    }
  }
}
