import type { LLMProvider } from '@/llm/llmProvider';
import { OllamaLLMProvider } from '@/llm/ollamaProvider';
import { type ILLMProviderConfiguration, LLMProviderType } from '@/llm/types';

export function createLLMProvider(configuration: ILLMProviderConfiguration): LLMProvider {
  switch (configuration.provider) {
    case LLMProviderType.OLLAMA:
      return new OllamaLLMProvider(configuration);
    default:
      throw new Error('Unsupported LLM provider');
  }
}
