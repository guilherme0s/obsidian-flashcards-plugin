import { Plugin } from 'obsidian';
import { SettingsService } from '@/settings/settingsService';

export default class MyPlugin extends Plugin {
  private settingsService: SettingsService | null = null;

  public override async onload(): Promise<void> {
    this.settingsService = new SettingsService(this);
    await this.settingsService.load();
  }
}
