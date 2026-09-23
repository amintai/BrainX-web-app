import { AINotConfiguredError } from './errors.js';
import { createAnthropicProvider } from './providers/anthropic.js';
import { createOpenAIProvider } from './providers/openai.js';

// Registry keyed by AI_PROVIDER. Each entry dynamically imports only the SDK
// it needs, so choosing 'anthropic' never loads the 'openai' package and
// vice versa.
const registry = {
  anthropic: async (aiConfig) => {
    const sdkModule = await import('@anthropic-ai/sdk');
    return createAnthropicProvider(aiConfig, sdkModule);
  },
  openai: async (aiConfig) => {
    const sdkModule = await import('openai');
    return createOpenAIProvider(aiConfig, sdkModule);
  },
};

/**
 * Creates an AI provider adapter selected purely by config.ai.provider
 * (AI_PROVIDER). Switching provider + model + key requires no code change
 * at any call site (FR-012).
 */
export async function createAIProvider(aiConfig = {}) {
  const { provider, model, apiKey } = aiConfig;

  if (!provider || !registry[provider]) {
    throw new AINotConfiguredError(
      `Unsupported or missing AI_PROVIDER: "${provider}". Supported: ${Object.keys(registry).join(', ')}.`,
    );
  }
  if (!model || !apiKey) {
    throw new AINotConfiguredError('AI_MODEL and AI_API_KEY must be set to use the AI provider.');
  }

  return registry[provider]({ apiKey, model });
}
