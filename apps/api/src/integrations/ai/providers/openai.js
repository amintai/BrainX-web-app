import { AIProviderError } from '../errors.js';

/**
 * Adapter over the official OpenAI SDK. Dynamically imported only when
 * AI_PROVIDER=openai.
 */
export function createOpenAIProvider({ apiKey, model }, sdkModule) {
  const OpenAI = sdkModule.default ?? sdkModule.OpenAI;
  const client = new OpenAI({ apiKey });

  return {
    async complete({ system, messages, maxTokens = 1024, temperature = 0, jsonSchema }) {
      const start = Date.now();
      try {
        const params = {
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, ...messages],
        };

        // Constrain the model's output to the given schema via Structured
        // Outputs, rather than only asking for JSON in the prompt text.
        if (jsonSchema) {
          params.response_format = {
            type: 'json_schema',
            json_schema: { name: 'structured_output', schema: jsonSchema },
          };
        }

        const response = await client.chat.completions.create(params);

        const text = response.choices?.[0]?.message?.content ?? '';

        return {
          text,
          model,
          provider: 'openai',
          usage: {
            inputTokens: response.usage?.prompt_tokens ?? 0,
            outputTokens: response.usage?.completion_tokens ?? 0,
          },
          durationMs: Date.now() - start,
        };
      } catch (err) {
        throw new AIProviderError('OpenAI API call failed', err);
      }
    },
  };
}
