import { AppError } from '../../utils/AppError.js';

export class AINotConfiguredError extends AppError {
  constructor(
    message = 'AI provider is not configured. Set AI_PROVIDER, AI_MODEL, and AI_API_KEY.',
  ) {
    super(500, 'AI_NOT_CONFIGURED', message);
    this.name = 'AINotConfiguredError';
  }
}

export class AIProviderError extends AppError {
  constructor(message, cause) {
    super(502, 'AI_PROVIDER_ERROR', message, cause);
    this.name = 'AIProviderError';
  }
}

export class AIOutputValidationError extends AppError {
  constructor(message, issues) {
    super(502, 'AI_OUTPUT_INVALID', message);
    this.name = 'AIOutputValidationError';
    this.issues = issues;
  }
}
