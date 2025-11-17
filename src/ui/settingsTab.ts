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

export class MyPluginSettingTab extends PluginSettingTab {
  public constructor(
    app: App,
    plugin: Plugin,
    private readonly settingsService: SettingsService,
  ) {
    super(app, plugin);
    void this.reloadModels(false);
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
          .onClick(() => this.reloadModels(true));
      })
      .addDropdown((dropdown) => this.populateModelDropdown(dropdown));
  }

  private populateModelDropdown(dropdown: DropdownComponent): void {
    const settings = this.settingsService.getSettings();
    const currentModel = settings.llm.model?.name;
    const availableModels = settings.llm.availableModels ?? [];

    if (availableModels.length === 0) {
      dropdown.addOption('', 'No models available');
      dropdown.setValue('');
      return;
    }

    availableModels.forEach((model) => {
      dropdown.addOption(model.name, model.name);
    });

    const valueToSet =
      currentModel && availableModels.some((m) => m.name === currentModel)
        ? currentModel
        : (availableModels[0]?.name ?? '');

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

  private async reloadModels(notify: boolean): Promise<void> {
    try {
      const models = await this.fetchModelsFromProvider();

      if (!models || models.length === 0) {
        if (notify) {
          new Notice('No models found. Please check your endpoint URL.');
        }
        await this.clearModelSettings();
        return;
      }

      await this.updateModelSettings(models);

      if (notify) {
        new Notice('Models reloaded');
      }
      this.display();
    } catch (error) {
      console.error('Failed to load models:', error);
      if (notify) {
        new Notice('Failed to reload models.');
      }
      await this.clearModelSettings();
    }
  }

  private async fetchModelsFromProvider(): Promise<ILLMModelConfiguration[]> {
    const settings = this.settingsService.getSettings();
    const provider = createLLMProvider(settings.llm);
    return await provider.getAvailableModels();
  }

  private async updateModelSettings(models: ILLMModelConfiguration[]): Promise<void> {
    const settings = this.settingsService.getSettings();
    const currentModel = settings.llm.model;

    const selectedModel = models.find((m) => m.name === currentModel?.name) ?? models[0];

    await this.settingsService.update({
      llm: {
        model: {
          name: selectedModel.name,
        },
        availableModels: models,
      },
    });

    this.display();
  }

  private async clearModelSettings() {
    await this.settingsService.update({
      llm: {
        model: undefined,
        availableModels: [],
      },
    });
    this.display();
  }
}
