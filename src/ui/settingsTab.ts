import {
  type App,
  type DropdownComponent,
  Notice,
  type Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian';
import { createLLMProvider, LLMProviderType } from '@/llm/llmFactory';
import type { SettingsService } from '@/settings/settingsService';
import type { ILLMModelConfiguration } from '@/settings/settingsTypes';

const resolveModelName = (
  current: string | undefined,
  models: readonly ILLMModelConfiguration[],
): string => {
  if (current && models.some((m) => m.name === current)) {
    return current;
  }
  return models[0]?.name ?? '';
};

export class MyPluginSettingTab extends PluginSettingTab {
  public constructor(
    app: App,
    plugin: Plugin,
    private readonly settingsService: SettingsService,
  ) {
    super(app, plugin);
    void this.loadModels(false);
  }

  public override display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const settings = this.settingsService.getSettings();

    new Setting(containerEl).setName('LLM Provider').addDropdown((dropdown) => {
      dropdown
        .addOption(LLMProviderType.OLLAMA, 'Ollama')
        .setValue(settings.llm.provider)
        .onChange(async (value) => {
          await this.settingsService.update({
            llm: {
              provider: value as LLMProviderType,
            },
          });
        });
    });

    new Setting(containerEl).setName('Endpoint URL').addText((text) => {
      text
        .setPlaceholder('http://localhost:11434')
        .setValue(settings.llm.auth.endpoint)
        .onChange(async (value) => {
          await this.settingsService.update({
            llm: {
              auth: {
                endpoint: value,
              },
            },
          });
        });
    });

    new Setting(containerEl)
      .setName('Model')
      .addExtraButton((button) => {
        button
          .setIcon('refresh-ccw')
          .setTooltip('Reload models')
          .onClick(() => this.loadModels(true));
      })
      .addDropdown((dropdown) => this.populateModelDropdown(dropdown));
  }

  private populateModelDropdown(dropdown: DropdownComponent): void {
    const settings = this.settingsService.getSettings();

    const availableModels = settings.llm.availableModels ?? [];
    const currentModelName = settings.llm.model?.name;

    if (availableModels.length === 0) {
      dropdown.addOption('', 'None');
      dropdown.setValue('');
      return;
    }

    for (const model of availableModels) {
      dropdown.addOption(model.name, model.name);
    }

    const valueToSet = resolveModelName(currentModelName, availableModels);

    dropdown.setValue(valueToSet);
    dropdown.onChange(async (value: string) => {
      await this.settingsService.update({
        llm: {
          model: {
            name: value,
          },
        },
      });
    });
  }

  private async loadModels(notify: boolean): Promise<void> {
    try {
      const settings = this.settingsService.getSettings();
      const provider = createLLMProvider(settings.llm);
      const models = await provider.getAvailableModels();

      await this.updateModelSettings(models);

      if (notify) {
        new Notice('Models reloaded');
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      if (notify) {
        new Notice('Failed to load models. Check your endpoint URL.');
      }
      await this.settingsService.update({
        llm: {
          model: {
            name: undefined,
          },
          availableModels: [],
        },
      });
    } finally {
      this.display();
    }
  }

  private async updateModelSettings(models: ILLMModelConfiguration[]): Promise<void> {
    const settings = this.settingsService.getSettings();
    const currentModelName = settings.llm.model?.name;

    const selectedModel = models.find((m) => m.name === currentModelName) ?? models[0];

    await this.settingsService.update({
      llm: {
        model: {
          name: selectedModel.name,
        },
        availableModels: models,
      },
    });
  }
}
