import { Plugin } from 'obsidian';
import { SettingsService } from '@/settings/settingsService';
import { MyPluginSettingTab } from '@/ui/settingsTab';

export default class MyPlugin extends Plugin {
  private settingsService: SettingsService | null = null;

  public override async onload(): Promise<void> {
    this.settingsService = new SettingsService(this);
    await this.settingsService.load();

    this.addSettingTab(new MyPluginSettingTab(this.app, this, this.settingsService));
  }
}
