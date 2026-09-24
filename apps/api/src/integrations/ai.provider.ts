import config from '../config';

type MessageRole = 'user' | 'assistant';

export interface AIMessage {
  role: MessageRole;
  content: string;
}

export interface AICompleteOptions {
  systemPrompt?: string;
  /** Ask the provider to return a single JSON object */
  json?: boolean;
  maxTokens?: number;
}

export interface AICompletion {
  text: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface AIProvider {
  complete(messages: AIMessage[], options?: AICompleteOptions): Promise<AICompletion>;
}

// SDK-level timeout and retry (retries cover 408/409/429/5xx and connection errors)
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const DEFAULT_MAX_TOKENS = 4096;

const JSON_INSTRUCTION =
  'Respond with a single valid JSON object only. Do not wrap it in markdown or add any text outside the JSON.';

const withJsonInstruction = (systemPrompt: string | undefined, json: boolean | undefined) =>
  json ? [systemPrompt, JSON_INSTRUCTION].filter(Boolean).join('\n\n') : systemPrompt;

class AnthropicProvider implements AIProvider {
  private client?: import('@anthropic-ai/sdk').default;

  private async getClient() {
    if (!this.client) {
      // Dynamic import to avoid loading SDK when provider is not Anthropic
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.client = new Anthropic({
        apiKey: config.aiApiKey,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: MAX_RETRIES,
      });
    }
    return this.client;
  }

  async complete(messages: AIMessage[], options: AICompleteOptions = {}): Promise<AICompletion> {
    const client = await this.getClient();
    const system = withJsonInstruction(options.systemPrompt, options.json);

    const response = await client.messages.create({
      model: config.aiModel,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(system && { system }),
      messages,
    });

    const block = response.content[0];
    if (!block || block.type !== 'text') throw new Error('Unexpected Anthropic response type');

    return {
      text: block.text,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

class OpenAIProvider implements AIProvider {
  private client?: import('openai').default;

  private async getClient() {
    if (!this.client) {
      const { default: OpenAI } = await import('openai');
      this.client = new OpenAI({
        apiKey: config.aiApiKey,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: MAX_RETRIES,
      });
    }
    return this.client;
  }

  async complete(messages: AIMessage[], options: AICompleteOptions = {}): Promise<AICompletion> {
    const client = await this.getClient();
    // JSON mode requires the word "JSON" in the prompt — the instruction guarantees it
    const system = withJsonInstruction(options.systemPrompt, options.json);

    const response = await client.chat.completions.create({
      model: config.aiModel,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(options.json && { response_format: { type: 'json_object' as const } }),
      messages: [...(system ? [{ role: 'system' as const, content: system }] : []), ...messages],
    });

    return {
      text: response.choices[0]?.message.content ?? '',
      model: response.model,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }
}

const createAIProvider = (): AIProvider => {
  switch (config.aiProvider.toLowerCase()) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown AI provider: ${config.aiProvider}. Supported: anthropic, openai`);
  }
};

export const aiProvider = createAIProvider();
