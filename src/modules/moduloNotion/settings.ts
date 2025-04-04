import ManagementPlugin from "../../main"; // Adjust path as needed
import { PluginSettingTab, Setting, App } from "obsidian";
// Removed import from index

// Define the structure for a single Notion connection
export interface NotionConnection {
    id: string; // Unique identifier (e.g., timestamp or UUID)
    name: string; // User-defined name for the connection
    campaignDbId: string;
    deliverableDbId: string;
    // Optional future fields: apiKey, subdomain
}

// Define and export the structure for Notion module settings
export interface NotionModuleSettings {
    notionApiKey: string; // Global API Key for now
    notionUser: string; // Global User/Subdomain for now
    connections: NotionConnection[]; // Array to hold multiple connections
    // Add other global settings as needed
}

// Define the default values for Notion settings
export const DEFAULT_NOTION_SETTINGS: NotionModuleSettings = {
    notionApiKey: '',
    notionUser: '', // Use notionUser
    connections: [], // Initialize connections as an empty array
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

        // --- Settings for individual connections ---
        containerEl.createEl('h3', { text: 'Conexiones de Bases de Datos' });

        const connectionsContainer = containerEl.createDiv('notion-connections-container');

        // Function to render the connections list (to be called initially and after changes)
        const renderConnections = () => {
            connectionsContainer.empty(); // Clear previous connections UI

            if (!Array.isArray(settings.connections)) {
                 console.warn("NotionSettings UI: settings.connections is not an array. Initializing.");
                 settings.connections = []; // Initialize if it's not an array
            }


            settings.connections.forEach((connection, index) => {
                const connectionEl = connectionsContainer.createDiv({ cls: 'notion-connection-item setting-item' }); // Add setting-item class for spacing

                new Setting(connectionEl)
                    .setName(`Conexión: ${connection.name || '(Sin nombre)'}`)
                    .setDesc('Configura los detalles de esta conexión.')
                    .addText(text => text
                        .setPlaceholder('Nombre descriptivo (ej: Proyecto Cliente X)')
                        .setValue(connection.name)
                        .onChange(async (value) => {
                            connection.name = value;
                            await saveCallback();
                            // No need to re-render just for name change display in header
                        }))
                    .addText(text => text
                        .setPlaceholder('ID BD Campañas')
                        .setValue(connection.campaignDbId)
                        .onChange(async (value) => {
                            connection.campaignDbId = value.trim();
                            await saveCallback();
                        }))
                     .addText(text => text
                         .setPlaceholder('ID BD Entregables')
                         .setValue(connection.deliverableDbId)
                         .onChange(async (value) => {
                             connection.deliverableDbId = value.trim();
                             await saveCallback();
                         }))
                    .addButton(button => button
                        .setButtonText('Eliminar')
                        .setWarning() // Make button red
                        .onClick(async () => {
                            settings.connections.splice(index, 1); // Remove connection from array
                            await saveCallback();
                            renderConnections(); // Re-render the connections list
                        }));
            });

            // Add "Add New Connection" button below the list
            new Setting(connectionsContainer)
                .addButton(button => button
                    .setButtonText('Añadir Nueva Conexión')
                    .setCta() // Call to action style
                    .onClick(async () => {
                        const newConnection: NotionConnection = {
                            id: Date.now().toString(), // Simple unique ID
                            name: '',
                            campaignDbId: '',
                            deliverableDbId: ''
                        };
                        settings.connections.push(newConnection);
                        await saveCallback();
                        renderConnections(); // Re-render to show the new connection fields
                    }));
        };

        // Initial rendering of connections
        renderConnections();


        // Keep the global User/Subdomain setting (moved below connections)
        containerEl.createEl('h3', { text: 'Configuración Global' }); // Add header for global settings
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
