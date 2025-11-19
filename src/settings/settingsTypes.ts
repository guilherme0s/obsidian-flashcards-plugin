import type { LLMProviderType } from '@/llm/llmFactory';

export interface IPluginSettings {
  readonly llm: ILLMProviderConfiguration;
}

export interface ILLMModelConfiguration {
  readonly name: string;
}

export interface ILLMAuthenticationConfiguration {
  readonly endpoint: string;
}

export interface ILLMProviderConfiguration {
  readonly provider: LLMProviderType;
  readonly auth: ILLMAuthenticationConfiguration;
  readonly model?: ILLMModelConfiguration;
  readonly availableModels?: readonly ILLMModelConfiguration[];
}
