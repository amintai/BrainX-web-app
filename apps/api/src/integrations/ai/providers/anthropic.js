import { AIProviderError } from '../errors.js';

/**
 * Adapter over the official Anthropic SDK. Dynamically imported only when
 * AI_PROVIDER=anthropic so the openai SDK is never loaded unnecessarily.
 */
export function createAnthropicProvider({ apiKey, model }, sdkModule) {
  const Anthropic = sdkModule.default ?? sdkModule.Anthropic;
  const client = new Anthropic({ apiKey });

  return {
    async complete({ system, messages, maxTokens = 1024, temperature = 0, jsonSchema }) {
      const start = Date.now();
      try {
        const params = {
          model,
          system,
          messages,
          max_tokens: maxTokens,
          temperature,
        };

        // When a jsonSchema is supplied, force a tool call whose input_schema
        // is that schema so the model's response is structurally constrained
        // rather than merely asked (in prose) to return JSON.
        if (jsonSchema) {
          params.tools = [
            {
              name: 'structured_output',
              description: 'Return the result as structured JSON matching the given schema.',
              input_schema: jsonSchema,
            },
          ];
          params.tool_choice = { type: 'tool', name: 'structured_output' };
        }

        const response = await client.messages.create(params);

        const toolUse = response.content.find((block) => block.type === 'tool_use');
        const text = toolUse
          ? JSON.stringify(toolUse.input)
          : response.content
              .filter((block) => block.type === 'text')
              .map((block) => block.text)
              .join('');

        return {
          text,
          model,
          provider: 'anthropic',
          usage: {
            inputTokens: response.usage?.input_tokens ?? 0,
            outputTokens: response.usage?.output_tokens ?? 0,
          },
          durationMs: Date.now() - start,
        };
      } catch (err) {
        throw new AIProviderError('Anthropic API call failed', err);
      }
    },
  };
}
