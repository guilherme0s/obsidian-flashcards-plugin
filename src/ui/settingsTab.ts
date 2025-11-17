import { type App, Notice, type Plugin, PluginSettingTab, Setting } from 'obsidian';
import { createLLMProvider, LLMProviderType } from '@/llm/llmFactory';
import type { SettingsService } from '@/settings/settingsService';
import type { ILLMModelConfiguration } from '@/settings/settingsTypes';

export class MyPluginSettingTab extends PluginSettingTab {
  private availableModels: ILLMModelConfiguration[] = [];

  public constructor(
    app: App,
    plugin: Plugin,
    private readonly settingsService: SettingsService,
  ) {
    super(app, plugin);
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
          .onClick(() => this.fetchLLMProviderModels());
      })
      .addDropdown((dropdown) => {
        const currentModel = settings.llm.model?.name;

        for (const m of this.availableModels) {
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

  private async fetchLLMProviderModels(): Promise<void> {
    const settings = this.settingsService.getSettings();

    const provider = createLLMProvider(settings.llm);
    const models = await provider.getAvailableModels();

    if (models.length === 0) {
      new Notice('No models found');
      return;
    }

    this.availableModels = models;
    this.display();
  }
}
