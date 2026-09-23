import { z } from 'zod';
import { extractJson } from '../../utils/extractJson.js';
import { logger as defaultLogger } from '../../utils/logger.js';
import { AIProviderError, AIOutputValidationError } from '../../integrations/ai/errors.js';

/**
 * Subclass contract: declare `name`, `outputSchema` (a Zod schema), implement
 * `buildPrompt(input)` returning { system, messages }, and optionally set
 * `requiresApproval = true` for steps that must stop the orchestrator before
 * running (human approval required for irreversible/high-stakes actions).
 *
 * `run()` is the single enforcement point for FR-013: raw provider output is
 * always JSON-extracted, parsed, and Zod-validated before being returned —
 * nothing downstream ever sees unvalidated AI output.
 */
export class BaseAgent {
  requiresApproval = false;
  maxRetries = 0;

  constructor({ aiProvider, logger = defaultLogger } = {}) {
    if (new.target === BaseAgent) {
      throw new TypeError('BaseAgent is abstract and must be subclassed');
    }
    this.aiProvider = aiProvider;
    this.logger = logger;
  }

  // eslint-disable-next-line no-unused-vars
  buildPrompt(input) {
    throw new Error(`${this.constructor.name} must implement buildPrompt(input)`);
  }

  async run(input, workflowId) {
    const start = Date.now();
    this.logger.info({ agent: this.name, workflowId }, 'agent started');

    const prompt = this.buildPrompt(input);
    let jsonSchema;
    try {
      jsonSchema = z.toJSONSchema(this.outputSchema);
    } catch {
      jsonSchema = undefined;
    }

    // Total attempts = 1 initial call + maxRetries re-prompts. Retries only
    // cover JSON-parse/schema-validation failures — a provider/network error
    // is thrown immediately, since re-sending an identical request is unlikely
    // to fix a transport failure.
    const attempts = this.maxRetries + 1;
    let lastValidationError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      let result;
      try {
        result = await this.aiProvider.complete({ ...prompt, jsonSchema });
      } catch (err) {
        this.logger.error({ agent: this.name, workflowId, err }, 'agent provider call failed');
        throw err instanceof AIProviderError
          ? err
          : new AIProviderError('AI provider call failed', err);
      }

      let parsed;
      try {
        parsed = JSON.parse(extractJson(result.text));
      } catch {
        lastValidationError = new AIOutputValidationError(
          `${this.name}: AI output was not valid JSON`,
        );
        this.logger.warn(
          { agent: this.name, workflowId, attempt, maxRetries: this.maxRetries },
          'validation failed',
        );
        if (attempt < attempts) continue;
        throw lastValidationError;
      }

      const validated = this.outputSchema.safeParse(parsed);
      if (!validated.success) {
        lastValidationError = new AIOutputValidationError(
          `${this.name}: AI output failed schema validation`,
          validated.error.issues,
        );
        this.logger.warn(
          {
            agent: this.name,
            workflowId,
            attempt,
            maxRetries: this.maxRetries,
            issues: validated.error.issues,
          },
          'validation failed',
        );
        if (attempt < attempts) continue;
        throw lastValidationError;
      }

      const durationMs = Date.now() - start;
      this.logger.info(
        { agent: this.name, workflowId, model: result.model, usage: result.usage, durationMs },
        'agent completed',
      );

      return {
        agent: this.name,
        output: validated.data,
        usage: result.usage,
        durationMs,
      };
    }

    // Unreachable: the loop above always returns or throws on its final
    // iteration, but keep a defensive throw so a future refactor can't fall
    // through silently.
    throw lastValidationError;
  }
}
