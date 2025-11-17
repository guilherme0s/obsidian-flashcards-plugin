import type { ILLMModelConfiguration, ILLMProviderConfiguration } from '@/llm/types';
import { HttpClient } from '@/utils/httpClient';

export abstract class LLMProvider {
  protected readonly httpClient: HttpClient;

  protected constructor(protected readonly configuration: ILLMProviderConfiguration) {
    this.httpClient = new HttpClient({
      baseUrl: configuration.auth.endpoint,
      timeout: 3000,
    });
  }

  public abstract getAvailableModels(): Promise<ILLMModelConfiguration[]>;
}
