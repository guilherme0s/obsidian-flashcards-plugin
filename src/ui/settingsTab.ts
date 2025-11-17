import { type App, Notice, type Plugin, PluginSettingTab, Setting } from 'obsidian';
import { createLLMProvider, LLMProviderType } from '@/llm/llmFactory';
import type { SettingsService } from '@/settings/settingsService';

export class MyPluginSettingTab extends PluginSettingTab {
  public constructor(
    app: App,
    plugin: Plugin,
    private readonly settingsService: SettingsService,
  ) {
    super(app, plugin);
    void this.fetchLLMProviderModels(false);
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
          .onClick(() => this.fetchLLMProviderModels(true));
      })
      .addDropdown((dropdown) => {
        const currentModel = settings.llm.model?.name;
        const availableModels = settings.llm.availableModels ?? [];
        const modelList = [...availableModels];

        const currentModelInList = modelList.find((m) => m.name === currentModel);
        if (currentModel && !currentModelInList) {
          modelList.unshift({ name: currentModel });
        }

        for (const m of modelList) {
          dropdown.addOption(m.name, m.name);
        }
        dropdown.addOption('none', 'None');

        dropdown.setValue(currentModel ?? 'none');
        dropdown.onChange(async (value) => {
          const newValue = value === 'none' ? undefined : value;
          await this.settingsService.update({
            llm: {
              model: {
                name: newValue,
              },
            },
          });
        });
      });
  }

  private async fetchLLMProviderModels(notify: boolean): Promise<void> {
    const settings = this.settingsService.getSettings();

    const provider = createLLMProvider(settings.llm);

    try {
      const models = await provider.getAvailableModels();

      if (!models || models.length === 0) {
        if (notify) {
          new Notice('No models found');
        }
        await this.resetModelsState();
        return;
      }

      const currentModel = settings.llm.model;
      const currentModelStillExists = models.find((m) => m.name === currentModel?.name);

      const newModel = currentModelStillExists ? currentModel : models[0];

      await this.settingsService.update({
        llm: {
          model: {
            name: newModel?.name,
          },
          availableModels: models,
        },
      });
      if (notify) {
        new Notice('Models reloaded');
      }
      this.display();
    } catch {
      if (notify) {
        new Notice('Failed to reload models.');
      }
      await this.resetModelsState();
    }
  }

  private async resetModelsState() {
    await this.settingsService.update({
      llm: {
        model: undefined,
        availableModels: [],
      },
    });
    this.display();
  }
}
