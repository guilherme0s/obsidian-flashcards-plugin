import type { LLMProvider } from '@/llm/llmProvider';
import { OllamaLLMProvider } from '@/llm/ollamaProvider';
import { LLMProviderType } from '@/llm/types';
import type { ILLMProviderConfiguration } from '@/settings/settingsTypes';

export function createLLMProvider(configuration: ILLMProviderConfiguration): LLMProvider {
  switch (configuration.provider) {
    case LLMProviderType.OLLAMA:
      return new OllamaLLMProvider(configuration);
    default:
      throw new Error('Unsupported LLM provider');
  }
}
