import type { Plugin } from 'obsidian';
import type { DeepPartial } from '@/commonTypes';
import { LLMProviderType } from '@/llm/types';
import type { IPluginSettings } from '@/settings/settingsTypes';

export const DEFAULT_SETTINGS: IPluginSettings = {
  llm: {
    provider: LLMProviderType.OLLAMA,
    auth: {
      endpoint: 'http://localhost:11434',
    },
  },
};

export class SettingsService {
  private settings: IPluginSettings;

  public constructor(private readonly plugin: Plugin) {
    this.settings = DEFAULT_SETTINGS;
  }

  public async load(): Promise<void> {
    const raw = await this.plugin.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
  }

  public async save(): Promise<void> {
    await this.plugin.saveData(this.settings);
  }

  public async update(newSettings: DeepPartial<IPluginSettings>): Promise<void> {
    this.settings = this.deepMerge(this.settings, newSettings);
    await this.save();
  }

  public getSettings(): IPluginSettings {
    return this.settings;
  }

  private isObject(item: unknown): item is Record<string, unknown> {
    return !!item && typeof item === 'object' && !Array.isArray(item);
  }

  private deepMerge<T extends object>(target: T, source: object): T {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            (output as Record<string, unknown>)[key] = this.deepMerge(
              target[key as keyof T] as object,
              source[key] as object,
            );
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }
}
