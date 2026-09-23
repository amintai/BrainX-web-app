import config from '../config';

type MessageRole = 'user' | 'assistant';

export interface AIMessage {
  role: MessageRole;
  content: string;
}

export interface AIProvider {
  complete(messages: AIMessage[], systemPrompt?: string): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  async complete(messages: AIMessage[], systemPrompt?: string): Promise<string> {
    // Dynamic import to avoid loading SDK when provider is not Anthropic
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: config.aiApiKey });

    const response = await client.messages.create({
      model: config.aiModel,
      max_tokens: 4096,
      ...(systemPrompt && { system: systemPrompt }),
      messages,
    });

    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type');
    return block.text;
  }
}

class OpenAIProvider implements AIProvider {
  async complete(messages: AIMessage[], systemPrompt?: string): Promise<string> {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: config.aiApiKey });

    const response = await client.chat.completions.create({
      model: config.aiModel,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...messages,
      ],
    });

    return response.choices[0].message.content || '';
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
