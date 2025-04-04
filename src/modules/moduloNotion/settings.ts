import ManagementPlugin from "../../main"; // Adjust path as needed
import { PluginSettingTab, Setting, App } from "obsidian";
// Removed import from index

// Define and export the structure for Notion settings
export interface NotionModuleSettings {
    notionApiKey: string;
    campaignDbId: string;
    deliverableDbId: string;
    notionUser: string; // Use notionUser
    // Add other settings as needed, e.g., default mappings, sync options
}

// Define the default values for Notion settings
export const DEFAULT_NOTION_SETTINGS: NotionModuleSettings = {
    notionApiKey: '',
    campaignDbId: '',
    deliverableDbId: '',
    notionUser: '', // Use notionUser
};

export class NotionSettings {
    plugin: ManagementPlugin;
    settings: NotionModuleSettings;

    constructor(plugin: ManagementPlugin) {
        this.plugin = plugin;
        // Initialize with defaults, will be overwritten by loadSettings
        this.settings = { ...DEFAULT_NOTION_SETTINGS };
        console.log("NotionSettings: Constructor called");
    }

    async loadSettings() {
        // Load existing plugin settings
        const allSettings = await this.plugin.loadData();
        console.log("NotionSettings: Raw loaded data (allSettings):", JSON.stringify(allSettings)); // Log raw loaded data
        // Merge Notion settings from the loaded data, falling back to defaults
        this.settings = Object.assign({}, DEFAULT_NOTION_SETTINGS, allSettings?.notionSettings);
        console.log("NotionSettings: Merged notion specific settings:", this.settings); // Log merged settings
    }

    async saveSettings() {
        // Load existing plugin settings to not overwrite other modules' settings
        const allSettings = (await this.plugin.loadData()) || {};
        // Update the notionSettings part
        allSettings.notionSettings = this.settings;
        // Save the entire settings object
        await this.plugin.saveData(allSettings);
        console.log("NotionSettings: Settings saved:", this.settings);

        // Re-initialize client if API key changed (handled by main plugin reload/applyConfiguration)
    }

    getSettings(): NotionModuleSettings {
        return this.settings;
    }

    // Method to add settings UI elements to the main plugin settings tab
    // This needs to be called from PluginMainSettingsTab.display()
    static addSettingsUI(containerEl: HTMLElement, plugin: ManagementPlugin, settings: NotionModuleSettings, saveCallback: () => Promise<void>) {
        containerEl.createEl('h2', { text: 'Configuración de Notion' });

        new Setting(containerEl)
            .setName('Notion API Key')
            .setDesc('Tu clave secreta de integración interna de Notion.')
            .addText(text => text
                .setPlaceholder('secret_...')
                .setValue(settings.notionApiKey)
                .onChange(async (value) => {
                    settings.notionApiKey = value.trim();
                    await saveCallback();
                }));

        new Setting(containerEl)
            .setName('ID Base de Datos Campañas')
            .setDesc('El ID de tu base de datos de Notion para Campañas.')
            .addText(text => text
                .setPlaceholder('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
                .setValue(settings.campaignDbId)
                .onChange(async (value) => {
                    settings.campaignDbId = value.trim();
                    await saveCallback();
                }));

        new Setting(containerEl)
            .setName('ID Base de Datos Entregables')
            .setDesc('El ID de tu base de datos de Notion para Entregables.')
            .addText(text => text
                .setPlaceholder('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy')
                .setValue(settings.deliverableDbId)
                .onChange(async (value) => {
                    settings.deliverableDbId = value.trim();
                    await saveCallback();
                }));

        new Setting(containerEl)
            .setName('Usuario/Subdominio de Notion') // Keep UI text generic
            .setDesc('Tu subdominio público de Notion (ej: "crezco360" si tu URL pública es crezco360.notion.site). Necesario para generar los links públicos.')
            .addText(text => text
                .setPlaceholder('ej: crezco360')
                .setValue(settings.notionUser) // Use notionUser
                .onChange(async (value) => {
                    // Store only the user/subdomain part
                    settings.notionUser = value.trim().replace(/^https?:\/\//, '').split('.')[0].replace(/\/$/, ''); // Save as notionUser
                    await saveCallback();
                }));
    }
}
