export enum LLMProviderType {
  OLLAMA = 'ollama',
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
}
