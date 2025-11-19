import { LLMProvider } from '@/llm/llmProvider';
import type { ILLMModelConfiguration, ILLMProviderConfiguration } from '@/settings/settingsTypes';

export interface IOllamaTagsResponse {
  readonly models: Array<{
    readonly name: string;
  }>;
}

export class OllamaLLMProvider extends LLMProvider {
  public constructor(configuration: ILLMProviderConfiguration) {
    super(configuration);
  }

  public override async getAvailableModels(): Promise<ILLMModelConfiguration[]> {
    const res = await this.httpClient.get<IOllamaTagsResponse>('/api/tags');
    const list = res.data?.models ?? [];

    return list.map((m) => ({
      name: m.name,
    }));
  }
}
