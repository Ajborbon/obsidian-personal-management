import { Notice, Modal, TFile, App } from "obsidian"; // Import Modal, TFile, App
import ManagementPlugin from "../../main"; // Adjust path as needed
import { NotionApi } from "./api.js";
import { NotionMapper } from "./mapper.js";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"; // Import PageObjectResponse
// Use 'import type' for types when verbatimModuleSyntax is enabled
import type { NotionModuleSettings, NotionConnection } from "./settings.js";
import { DEFAULT_NOTION_SETTINGS } from "./settings.js"; // Import default values separately

// Remove local definitions - they are now imported from settings.ts

export class ModuloNotion {
    plugin: ManagementPlugin;
    api: NotionApi;
    mapper: NotionMapper;
    isLoaded: boolean = false;

    constructor(plugin: ManagementPlugin) {
        this.plugin = plugin;
        this.api = new NotionApi(this.plugin, this.getNotionSettings());
        this.mapper = new NotionMapper(this.plugin);
        console.log("ModuloNotion: Constructor called");
    }

    // Helper to get notion settings from main plugin settings
    private getNotionSettings(): NotionModuleSettings {
        // Ensure the structure exists, merging with imported defaults
        const defaults = DEFAULT_NOTION_SETTINGS;
        const currentPluginSettings = this.plugin.settings; // Get potentially undefined settings

        // If plugin settings or notionSettings within it don't exist, return a fresh default object
        if (!currentPluginSettings || !currentPluginSettings.notionSettings) {
            console.warn("ModuloNotion: notionSettings not found or plugin settings missing. Returning defaults.");
            // Optionally initialize if plugin.settings exists but notionSettings doesn't
            if (currentPluginSettings && !currentPluginSettings.notionSettings) {
                 currentPluginSettings.notionSettings = { ...defaults };
            }
            return { ...defaults };
        }

        const currentNotionSettings = currentPluginSettings.notionSettings;

        // Perform a safer merge, ensuring connections array exists
        const mergedSettings: NotionModuleSettings = {
            ...defaults,
            ...currentNotionSettings, // Override defaults with current settings
            // Ensure connections is an array, otherwise use default empty array
            connections: Array.isArray(currentNotionSettings.connections)
                ? currentNotionSettings.connections
                : defaults.connections,
        };

        // If connections was not an array originally, update the stored settings
        if (!Array.isArray(currentNotionSettings.connections)) {
            console.warn("ModuloNotion: notionSettings.connections was not an array. Resetting to default empty array in stored settings.");
            // We already checked currentPluginSettings exists above
            currentPluginSettings.notionSettings.connections = [...defaults.connections];
            // Consider saving settings here if this correction should persist immediately
            // this.plugin.saveSettings(); // Or let it be saved later
        }

        // console.log("ModuloNotion: getNotionSettings returning:", JSON.stringify(mergedSettings)); // Debug log
        return mergedSettings;
    }


    async load() {
        try {
            const currentSettings = this.getNotionSettings();
            this.api.initializeClient(currentSettings);
            this.registerCommands();
            this.isLoaded = true;
            console.log("ModuloNotion: Loaded successfully");
        } catch (error) {
             console.error("ModuloNotion: Error during load():", error);
             this.isLoaded = false;
        }
    }

    unload() {
        this.isLoaded = false;
        console.log("ModuloNotion: Unloaded");
    }

    registerCommands() {
        console.log("ModuloNotion: Registering dynamic commands based on connections...");
        const settings = this.getNotionSettings();

        if (!settings.notionApiKey) {
            console.log("ModuloNotion: Skipping command registration, API key not set.");
            return;
        }

        if (!Array.isArray(settings.connections) || settings.connections.length === 0) {
            console.log("ModuloNotion: Skipping command registration, no connections configured.");
            return;
        }

        settings.connections.forEach(connection => {
            if (!connection.id || !connection.name) {
                 console.warn(`ModuloNotion: Skipping command registration for connection with missing id or name:`, connection);
                 return; // Skip incomplete connections
            }

            // --- Register Campaign Command for this connection ---
            if (connection.campaignDbId) {
                this.plugin.addCommand({
                    id: `notion-sync-campaigns-${connection.id}`,
                    name: `Notion: Enviar nota a Campañas - ${connection.name}`,
                    checkCallback: (checking: boolean) => {
                        const activeFile = this.plugin.app.workspace.getActiveFile();
                        // Check API key globally and specific DB ID for this connection
                        if (this.isLoaded && activeFile && settings.notionApiKey && connection.campaignDbId) {
                            if (!checking) {
                                console.log(`ModuloNotion: Triggering sendNoteToNotion for Campaign DB: ${connection.name} (${connection.id})`);
                                this.sendNoteToNotion(connection, 'campaign'); // Pass connection object
                            }
                            return true;
                        }
                        return false;
                    },
                });
            } else {
                 console.log(`ModuloNotion: Skipping Campaign command for connection "${connection.name}" (no campaignDbId).`);
            }

            // --- Register Deliverable Command for this connection ---
            if (connection.deliverableDbId) {
                this.plugin.addCommand({
                    id: `notion-sync-deliverables-${connection.id}`,
                    name: `Notion: Enviar nota a Entregables - ${connection.name}`,
                    checkCallback: (checking: boolean) => {
                        const activeFile = this.plugin.app.workspace.getActiveFile();
                         // Check API key globally and specific DB ID for this connection
                        if (this.isLoaded && activeFile && settings.notionApiKey && connection.deliverableDbId) {
                            if (!checking) {
                                console.log(`ModuloNotion: Triggering sendNoteToNotion for Deliverable DB: ${connection.name} (${connection.id})`);
                                this.sendNoteToNotion(connection, 'deliverable'); // Pass connection object
                            }
                            return true;
                        }
                        return false;
                    },
                });
            } else {
                 console.log(`ModuloNotion: Skipping Deliverable command for connection "${connection.name}" (no deliverableDbId).`);
            }
        });
         console.log("ModuloNotion: Dynamic command registration complete."); // Updated log message
    }

    // Refactored function signature to accept the specific connection
    async sendNoteToNotion(connection: NotionConnection, databaseType: 'campaign' | 'deliverable') {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No hay archivo activo para enviar a Notion.");
            return;
        }

        console.log(`ModuloNotion: Processing note "${activeFile.basename}" for ${databaseType} DB in connection "${connection.name}".`);

        try {
            const fileContent = await this.plugin.app.vault.cachedRead(activeFile);
            const fileCache = this.plugin.app.metadataCache.getFileCache(activeFile);
            const obsidianFrontmatter = fileCache?.frontmatter ?? {};
            const notionSettings = this.getNotionSettings(); // Still needed for global API key, user

            let propertiesToSend;
            let databaseId;
            const titlePropertyKey = databaseType === 'campaign' ? 'nombre' : 'tarea'; // Key for Notion title property

            if (databaseType === 'campaign') {
                propertiesToSend = this.mapper.mapToCampaignProperties(activeFile.basename, obsidianFrontmatter, fileContent);
                databaseId = connection.campaignDbId; // Use connection's ID
            } else {
                propertiesToSend = this.mapper.mapToDeliverableProperties(activeFile.basename, obsidianFrontmatter, fileContent);
                databaseId = connection.deliverableDbId; // Use connection's ID
             }

             if (!databaseId) {
                 new Notice(`Error: ID de la base de datos de ${databaseType} no configurado para la conexión "${connection.name}".`);
                 console.error(`ModuloNotion: Database ID for ${databaseType} is not set for connection ${connection.name} (${connection.id}).`);
                 return;
             }

            // Use a connection-specific frontmatter key if desired, or keep it generic?
            // For now, keep generic key, assuming a note only links to one type of DB at a time.
            // Consider `NotionID-${connection.id}-${databaseType}` if a note needs to link to multiple connections.
            const notionIdKey = `NotionID-${databaseType}`;
            const existingPageId = obsidianFrontmatter[notionIdKey];
            console.log(`ModuloNotion: Checking for existing page ID using key "${notionIdKey}". Found: ${existingPageId}`);

            // --- Filter Obsidian Content ---
            const contentStartIndex = fileContent.indexOf('---', fileContent.indexOf('---') + 3);
            let noteBodyContent = contentStartIndex !== -1 ? fileContent.substring(contentStartIndex + 3) : fileContent;
            console.log("ModuloNotion: Filtering Obsidian content...");
            noteBodyContent = noteBodyContent.replace(/```dataviewjs\s*[\s\S]*?```/gs, '');
            console.log("ModuloNotion: Starting refined procedural content filtering...");
            const lines = noteBodyContent.split(/\r?\n/);
            const filteredLines: string[] = [];
            let isIgnoringSection = false;
            let ignoreRestOfFile = false;
            const ignoredHeadings = ['## Recursos', '## Tareas', '## Comentarios de Notion (Página)'];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine === '# Fin') {
                    console.log("ModuloNotion: Found '# Fin' marker. Ignoring subsequent content.");
                    ignoreRestOfFile = true;
                    continue;
                }
                if (ignoreRestOfFile) continue;
                if (isIgnoringSection) {
                    if (trimmedLine.startsWith('#')) {
                         console.log(`ModuloNotion: Exiting ignored section upon finding heading: "${trimmedLine}"`);
                         isIgnoringSection = false;
                    } else {
                        continue;
                    }
                }
                if (ignoredHeadings.some(heading => trimmedLine.startsWith(heading))) {
                    console.log(`ModuloNotion: Entering ignored section: "${trimmedLine}"`);
                    isIgnoringSection = true;
                    continue;
                }
                if (!isIgnoringSection) {
                    filteredLines.push(line);
                }
            }
            const obsidianFilteredMarkdown = filteredLines.join('\n').trim();
            console.log("ModuloNotion: Refined procedural filtering complete.");
            // --- End Filtering ---

            // --- Create or Compare/Update Logic ---
            if (existingPageId) {
                // --- COMPARE AND UPDATE EXISTING PAGE ---
                console.log(`ModuloNotion: Comparing Obsidian note with Notion page ${existingPageId}...`);
                new Notice(`Comparando con Notion (${databaseType} - ${connection.name})...`);

                let notionPageData: PageObjectResponse | null = null;
                let notionBlocksData;
                try {
                    const pageResponse = await this.api.retrievePage(existingPageId);
                    if ('properties' in pageResponse) {
                        notionPageData = pageResponse;
                    } else {
                        throw new Error("Retrieved partial page data, cannot compare properties.");
                    }
                    notionBlocksData = await this.api.listBlockChildren(existingPageId);
                } catch (fetchError) {
                     console.error("ModuloNotion: Failed to fetch data from Notion for comparison.", fetchError);
                     new Notice("Error al obtener datos de Notion para comparar.");
                     return;
                }

                const notionFrontmatter = this.mapper.mapNotionPropertiesToFrontmatter(notionPageData.properties, databaseType);
                const notionMarkdown = this.mapper.mapNotionBlocksToMarkdown(notionBlocksData);

                const notionTitle = notionFrontmatter[titlePropertyKey] || '';
                const obsidianTitle = activeFile.basename;
                const titleDiffers = obsidianTitle !== notionTitle;
                console.log(`ModuloNotion: Title comparison - Obsidian: "${obsidianTitle}", Notion: "${notionTitle}", Differs: ${titleDiffers}`);

                const mappedKeys = this.mapper.getMappedFrontmatterKeys(databaseType);
                const relevantObsidianFm = filterKeys(obsidianFrontmatter, mappedKeys); // Use external helper
                const relevantNotionFm = filterKeys(notionFrontmatter, mappedKeys); // Use external helper
                const fmDifferences = compareFrontmatterKeys(relevantObsidianFm, relevantNotionFm, mappedKeys); // Use external helper
                const frontmatterDiffers = fmDifferences.length > 0;
                console.log(`ModuloNotion: Frontmatter comparison (mapped keys only) - Differs: ${frontmatterDiffers} (Keys: ${fmDifferences.join(', ')})`);

                const contentDiffers = obsidianFilteredMarkdown !== notionMarkdown;
                let contentDiffSummary = "";
                if (contentDiffers) {
                    contentDiffSummary = generateContentDiffSummary(obsidianFilteredMarkdown, notionMarkdown); // Use external helper
                    console.log(`ModuloNotion: Content comparison - Differs: true. Summary: ${contentDiffSummary}`);
                } else {
                    console.log(`ModuloNotion: Content comparison - Differs: false.`);
                }

                if (titleDiffers || frontmatterDiffers || contentDiffers) {
                    let diffSummary = "Se encontraron diferencias en: ";
                    const diffParts: string[] = [];
                    if (titleDiffers) diffParts.push(`título ("${obsidianTitle}" vs "${notionTitle}")`);
                    if (frontmatterDiffers) diffParts.push(`frontmatter (${fmDifferences.join(', ')})`);
                    if (contentDiffers) diffParts.push(`contenido ${contentDiffSummary}`);
                    diffSummary += diffParts.join(', ') + ".";

                    // Use `this.` to call the modal method
                    this.showSyncDirectionModal(
                        diffSummary,
                        async (choice: string) => {
                             if (choice === "Obsidian -> Notion") {
                                 // Use `this.` to call sync method
                                 await this.syncObsidianToNotion(existingPageId, propertiesToSend, obsidianFilteredMarkdown, activeFile, databaseType);
                             } else if (choice === "Notion -> Obsidian") {
                                 // Use `this.` to call sync method
                                 await this.syncNotionToObsidian(existingPageId, notionTitle, titleDiffers, notionFrontmatter, notionMarkdown, activeFile, databaseType);
                             } else {
                                 new Notice("Sincronización cancelada.");
                             }
                        }
                    );
                } else {
                    new Notice(`No se detectaron cambios entre Obsidian y Notion (${connection.name}).`);
                }

            } else {
                // --- CREATE NEW PAGE ---
                console.log(`ModuloNotion: Creating new Notion page in ${databaseType} DB for connection ${connection.name}...`);
                new Notice(`Creando página en Notion (${databaseType} - ${connection.name})...`);
                const blocksForCreate = this.mapper.mapContentToBlocks(obsidianFilteredMarkdown);
                const response = await this.api.createPage(databaseId, propertiesToSend, blocksForCreate);

                if (response && response.id) {
                     const newPageId = response.id;
                     const internalUrl = `https://www.notion.so/${newPageId.replace(/-/g, '')}`;
                     const noticeMessage = `¡Nota "${activeFile.basename}" enviada a Notion (${connection.name})!`;
                     new Notice(noticeMessage);
                     console.log(`ModuloNotion: New note sent successfully. Connection: ${connection.name}, Notion Page ID: ${newPageId}, Internal URL: ${internalUrl}`);

                     let publicUrl = internalUrl;
                     const notionUser = notionSettings.notionUser; // Use global user/subdomain for now
                     if (notionUser) {
                         try {
                             const subdomain = notionUser.trim().split('.')[0];
                             publicUrl = internalUrl.replace("www.notion.so", `${subdomain}.notion.site`);
                             console.log(`ModuloNotion: Generated Public URL using subdomain '${subdomain}': ${publicUrl}`);
                         } catch (replaceError) {
                              console.error("ModuloNotion: Error replacing subdomain for public URL:", replaceError);
                              publicUrl = internalUrl; // Fallback to internal URL
                         }
                     } else {
                         console.warn("ModuloNotion: notionUser setting is empty. Public URL will be the same as internal URL.");
                     }

                     try {
                         await this.plugin.app.fileManager.processFrontMatter(activeFile, (fm: Record<string, any>) => {
                             // Use the generic key for now
                             const linkKey = `link-${databaseType}`;
                             const notionLinkKey = `NotionLink-${databaseType}`;
                             fm[notionIdKey] = newPageId;
                             fm[linkKey] = publicUrl;
                             fm[notionLinkKey] = internalUrl;
                             console.log(`ModuloNotion: Updated frontmatter for ${activeFile.basename} with keys: ${notionIdKey}, ${linkKey}, ${notionLinkKey}`);
                         });
                         new Notice(`Frontmatter de "${activeFile.basename}" actualizado con datos de Notion.`);
                     } catch (frontmatterError) {
                         console.error(`ModuloNotion: Error updating frontmatter for ${activeFile.basename}:`, frontmatterError);
                         new Notice(`Error al actualizar frontmatter para "${activeFile.basename}".`);
                     }
                } else {
                     console.error("ModuloNotion: Invalid response from Notion API after createPage (expected ID):", response);
                     throw new Error(`La respuesta de la API de Notion (createPage) no contenía un ID válido.`);
                }
            } // End Create or Compare/Update block

        } catch (error) {
            console.error(`ModuloNotion: Error during sendNoteToNotion (${databaseType}) for connection ${connection.name}:`, error);
            if (!(error instanceof Error && error.message.includes("Notion API Error"))) {
                 new Notice(`Fallo el proceso para la nota de Notion (${databaseType} - ${connection.name}). Revisa la consola.`);
            }
        }
    }

    // --- Helper functions moved inside the class ---

    // --- Sync Functions (Called after user choice) ---
    async syncObsidianToNotion(pageId: string, propertiesToSend: any, filteredMarkdown: string, file: TFile, dbType: string) {
        console.log(`ModuloNotion: Syncing Obsidian -> Notion for page ${pageId}`);
        new Notice(`Sincronizando Obsidian -> Notion...`);
        try {
            const blocks = this.mapper.mapContentToBlocks(filteredMarkdown);
            await this.api.updatePageProperties(pageId, propertiesToSend);
            console.log(`ModuloNotion: Properties updated for page ${pageId}.`);
            await this.api.updatePageContent(pageId, blocks);
            console.log(`ModuloNotion: Content updated for page ${pageId}.`);
            new Notice(`¡Página de Notion "${file.basename}" actualizada desde Obsidian!`);
        } catch (error) {
            console.error(`ModuloNotion: Error during Obsidian -> Notion sync for ${pageId}:`, error);
        }
    }

    async syncNotionToObsidian(
        pageId: string,
        notionTitle: string,
        titleDiffers: boolean,
        notionFrontmatter: Record<string, any>,
        notionMarkdown: string,
        file: TFile,
        dbType: string // Keep dbType ('campaign'/'deliverable') to know which mapping keys to use
    ) {
        console.log(`ModuloNotion: Syncing Notion -> Obsidian for page ${pageId}`);
        new Notice(`Sincronizando Notion -> Obsidian...`);
        let targetFile = file;

        try {
            // 0. Rename file if titles differ
            if (titleDiffers && notionTitle) {
                const newPath = file.path.replace(file.basename, notionTitle);
                console.log(`ModuloNotion: Renaming Obsidian file from "${file.basename}" to "${notionTitle}"`);
                try {
                    await this.plugin.app.fileManager.renameFile(file, newPath);
                    targetFile = this.plugin.app.vault.getAbstractFileByPath(newPath) as TFile;
                    if (!targetFile) throw new Error(`Failed to get new file reference after renaming to ${newPath}`);
                    new Notice(`Nota renombrada a "${notionTitle}" para coincidir con Notion.`);
                } catch (renameError) {
                    console.error(`ModuloNotion: Error renaming file to "${notionTitle}":`, renameError);
                    new Notice(`Error al renombrar la nota a "${notionTitle}".`);
                }
            }

            // 1. Update Frontmatter in Obsidian
            await this.plugin.app.fileManager.processFrontMatter(targetFile, (fm: Record<string, any>) => {
                const mappedKeys = this.mapper.getMappedFrontmatterKeys(dbType as 'campaign' | 'deliverable');
                for (const key of mappedKeys) {
                    if (notionFrontmatter.hasOwnProperty(key)) {
                         if (notionFrontmatter[key] !== null && notionFrontmatter[key] !== undefined) {
                            fm[key] = Array.isArray(notionFrontmatter[key]) ? [...notionFrontmatter[key]] : notionFrontmatter[key];
                         } else {
                             delete fm[key];
                         }
                    } else {
                        delete fm[key];
                    }
                }
                 console.log(`ModuloNotion: Updated Obsidian frontmatter from Notion for ${targetFile.basename} (mapped keys only)`);
            });

            // 2. Update Content (Region-based reconstruction)
            console.log("ModuloNotion: Starting content update with region-based reconstruction strategy...");
            const currentObsidianContent = await this.plugin.app.vault.read(targetFile);
            const currentContentStartIndex = currentObsidianContent.indexOf('---', currentObsidianContent.indexOf('---') + 3);
            const originalObsidianBody = currentContentStartIndex !== -1
                ? currentObsidianContent.substring(currentContentStartIndex + 3).trimStart() // Trim leading whitespace from body
                : currentObsidianContent;

            // Define types for preserved regions for clarity
            type DataviewRegion = ReturnType<typeof this.extractDataviewBlocksWithIndices>[0];
            type SectionRegion = ReturnType<typeof this.extractSectionContentWithIndices>; // Can be null initially

            // Array to hold potentially null regions first
            const potentiallyNullRegions: (DataviewRegion | SectionRegion)[] = [];


            // Extract dataview blocks
            const dataviewBlocks = this.extractDataviewBlocksWithIndices(originalObsidianBody);
            potentiallyNullRegions.push(...dataviewBlocks);
            console.log(`ModuloNotion: Found ${dataviewBlocks.length} dataview blocks.`);

            // Extract sections
            const recursosSection = this.extractSectionContentWithIndices(originalObsidianBody, /^## Recursos/m);
            potentiallyNullRegions.push(recursosSection);
            if (recursosSection) console.log("ModuloNotion: Found ## Recursos section."); else console.log("ModuloNotion: ## Recursos section not found.");

            const tareasSection = this.extractSectionContentWithIndices(originalObsidianBody, /^## Tareas/m);
            potentiallyNullRegions.push(tareasSection);
            if (tareasSection) console.log("ModuloNotion: Found ## Tareas section."); else console.log("ModuloNotion: ## Tareas section not found.");

            const finSection = this.extractSectionContentWithIndices(originalObsidianBody, /^# Fin/m);
            potentiallyNullRegions.push(finSection);
            if (finSection) console.log("ModuloNotion: Found # Fin section."); else console.log("ModuloNotion: # Fin section not found.");

            // Also extract the existing comments section to prevent duplication
            const oldCommentsSection = this.extractSectionContentWithIndices(originalObsidianBody, /^## Comentarios de Notion \(Página\)/m);
            potentiallyNullRegions.push(oldCommentsSection);
            if (oldCommentsSection) console.log("ModuloNotion: Found existing ## Comentarios de Notion (Página) section."); else console.log("ModuloNotion: Existing ## Comentarios de Notion (Página) section not found.");


            // Filter out nulls and assert the correct type for the final array
            const preservedRegions = potentiallyNullRegions.filter(
                 (region): region is DataviewRegion | NonNullable<SectionRegion> => region !== null
            );

            // Sort preserved regions by their start index (now guaranteed non-null)
            preservedRegions.sort((a, b) => a.start - b.start);

            // Get and clean Notion content
            const cleanedNotionMarkdown = notionMarkdown.replace(/```dataviewjs\s*[\s\S]*?```/gs, '').trim();
            console.log("ModuloNotion: Using cleaned Notion markdown as base content.");

            // Reconstruct the body
            const newBodyParts: string[] = [];
            let lastIndex = 0;
            let notionContentInserted = false;

            for (const region of preservedRegions) {
                // Add the content *before* this preserved region
                const contentBefore = originalObsidianBody.substring(lastIndex, region.start);
                if (contentBefore.trim()) {
                    if (!notionContentInserted) {
                        console.log("ModuloNotion: Inserting Notion content into the first content region.");
                        newBodyParts.push(cleanedNotionMarkdown);
                        notionContentInserted = true;
                    } else {
                        // If Notion content was already inserted, append original content from subsequent gaps
                        console.warn("ModuloNotion: Found additional content region after Notion content was inserted. Appending original content:", contentBefore.substring(0, 50) + "...");
                        newBodyParts.push(contentBefore);
                 }
             }

             // Add the preserved region itself, *unless* it's the old comments section
             if (region.type !== 'section' || region.heading !== '## Comentarios de Notion (Página)') {
                 console.log(`ModuloNotion: Appending preserved region (Type: ${region.type}, Start: ${region.start})`);
                 newBodyParts.push(region.content);
             } else {
                  console.log(`ModuloNotion: Skipping append of old comments section (Start: ${region.start})`);
             }
             lastIndex = region.end;
         }

            // Add any remaining content *after* the last preserved region
            const contentAfter = originalObsidianBody.substring(lastIndex);
            if (contentAfter.trim()) {
                 if (!notionContentInserted) {
                     console.log("ModuloNotion: Inserting Notion content into the final content region.");
                     newBodyParts.push(cleanedNotionMarkdown);
                     notionContentInserted = true;
                 } else {
                     console.warn("ModuloNotion: Found final content region after Notion content was inserted. Appending original content:", contentAfter.substring(0, 50) + "...");
                     newBodyParts.push(contentAfter);
                 }
            }

            // Handle case where there were NO preserved regions at all
            if (preservedRegions.length === 0 && !notionContentInserted) {
                 console.log("ModuloNotion: No preserved regions found. Using Notion content as the entire body.");
                 newBodyParts.push(cleanedNotionMarkdown);
                 notionContentInserted = true;
            }

            // Ensure Notion content is inserted if no suitable content region was found (e.g., empty file originally)
             if (!notionContentInserted) {
                 console.warn("ModuloNotion: Notion content was not inserted in any specific region. Appending it at the end.");
                 newBodyParts.push(cleanedNotionMarkdown);
             }


            // Join the parts, ensuring proper spacing (use single newline between parts, trim each part first)
            let finalBodyContent = newBodyParts.map(part => part.trim()).filter(part => part.length > 0).join("\n\n").trim(); // Join with double newline for better separation


            // --- Fetch and Format Notion Comments ---
            let commentsMarkdown = "";
            try {
                console.log(`ModuloNotion: Fetching comments for page ${pageId}...`);
                const comments = await this.api.listPageComments(pageId);
                commentsMarkdown = this.mapper.mapNotionCommentsToMarkdown(comments, pageId); // pageId needed for filtering
                if (commentsMarkdown) {
                    console.log(`ModuloNotion: Successfully formatted comments markdown.`);
                } else {
                     console.log(`ModuloNotion: No relevant page comments found or formatted.`);
                }
            } catch (commentError) {
                console.error("ModuloNotion: Failed to fetch or format Notion comments:", commentError);
                // Optional: Notify user? For now, just log the error and proceed without comments.
                // new Notice("Error al obtener comentarios de Notion.");
            }


            // --- Assemble Final Content ---
            // Get updated frontmatter section
            const fileAfterFmUpdate = await this.plugin.app.vault.read(targetFile); // Read again after FM update
            const updatedFmStartIndex = fileAfterFmUpdate.indexOf('---', fileAfterFmUpdate.indexOf('---') + 3);
            const updatedFrontmatterSection = updatedFmStartIndex !== -1
                ? fileAfterFmUpdate.substring(0, updatedFmStartIndex + 3)
                 : "---\n---"; // Default if no frontmatter found

            // Combine frontmatter, reconstructed body, and the comments section (if any)
            // Always append comments at the end, separated by two newlines from the body.
            const finalContent = updatedFrontmatterSection + "\n" +
                                 finalBodyContent +
                                 (commentsMarkdown ? "\n\n" + commentsMarkdown : "") + // Add comments if they exist
                                 "\n"; // Ensure trailing newline


            // --- Write Final Content ---
            await this.plugin.app.vault.modify(targetFile, finalContent);

            console.log(`ModuloNotion: Updated Obsidian content from Notion for ${targetFile.basename}, including comments section.`); // Updated log
            new Notice(`¡Nota "${targetFile.basename}" actualizada desde Notion!`);

        } catch (error) {
            console.error(`ModuloNotion: Error during Notion -> Obsidian sync for ${pageId}:`, error);
            new Notice(`Error al sincronizar Notion -> Obsidian para "${targetFile.basename}".`);
        }
    }

    // --- Helper functions for section extraction (now class methods) ---
    extractSectionContentWithIndices(content: string, sectionHeadingRegex: RegExp): { type: 'section'; start: number; end: number; content: string; heading: string } | null {
        const match = content.match(sectionHeadingRegex);
        if (!match || match.index === undefined) return null;
        const sectionHeading = match[0].trim();
        const sectionStartIndex = match.index;
        const searchStartIndex = match.index + match[0].length;
        const nextMarkerMatch = content.substring(searchStartIndex).match(/^# |^## |^# Fin/m);
        let sectionEndIndex = nextMarkerMatch?.index !== undefined ? searchStartIndex + nextMarkerMatch.index : content.length;
        const extractedContent = content.slice(sectionStartIndex, sectionEndIndex);
        return { type: 'section', start: sectionStartIndex, end: sectionEndIndex, content: extractedContent, heading: sectionHeading };
    }

    extractSection(content: string, regex: RegExp): string | null {
        const match = content.match(regex);
        if (!match || match.index === undefined) return null;
        const sectionStartMarkerEnd = match.index + match[0].length;
        const nextHeadingMatch = content.substring(sectionStartMarkerEnd).match(/^\s*#/m);
        const sectionEndIndex = nextHeadingMatch?.index !== undefined ? sectionStartMarkerEnd + nextHeadingMatch.index : content.length;
        return content.substring(sectionStartMarkerEnd, sectionEndIndex).trim();
    }

    extractSectionContent(content: string, sectionHeadingRegex: RegExp): string | null {
        const match = content.match(sectionHeadingRegex);
        if (!match || match.index === undefined) return null;
        const sectionStartIndex = match.index;
        const headingLineEndMatch = content.substring(sectionStartIndex).match(/\r?\n/);
        const contentStartIndex = headingLineEndMatch ? sectionStartIndex + headingLineEndMatch[0].length + (headingLineEndMatch.index ?? 0) : content.length;
        const nextMarkerMatch = content.substring(contentStartIndex).match(/^# |^## |^# Fin/m);
        let sectionEndIndex = nextMarkerMatch?.index !== undefined ? contentStartIndex + nextMarkerMatch.index : content.length;
        const extracted = content.slice(sectionStartIndex, sectionEndIndex).trimEnd();
        return extracted.trimEnd();
    }

    extractDataviewBlocksWithIndices(content: string): { type: 'dataview'; start: number; end: number; content: string }[] {
        const blocks: { type: 'dataview'; start: number; end: number; content: string }[] = [];
        const regex = /```dataviewjs\s*[\s\S]*?```/gs;
        let match;
        while ((match = regex.exec(content)) !== null) {
            blocks.push({ type: 'dataview', start: match.index, end: match.index + match[0].length, content: match[0] });
        }
        return blocks;
    }

    extractDataviewBlocks(content: string): string[] {
         const blocks: string[] = [];
         const regex = /```dataviewjs\s*[\s\S]*?```/gs;
         let match;
         while ((match = regex.exec(content)) !== null) {
             blocks.push(match[0]);
         }
         return blocks;
     }

    // --- Modal Trigger (now a class method) ---
    showSyncDirectionModal(diffSummary: string, callback: (choice: string) => void) {
        const modal = new SyncDirectionModal(this.plugin.app, diffSummary, callback);
        modal.open();
    }

} // End ModuloNotion Class


// --- Helper Functions (Outside Class - Keep these here as they are pure functions) ---
// Helper function for deep comparison (improved)
function deepCompare(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null && obj2 == null) return true;
    if (obj1 == null || obj2 == null) return false;
    if (obj1 instanceof Date && obj2 instanceof Date) return obj1.getTime() === obj2.getTime();
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        const simpleSort = (arr: any[]) => arr.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean');
        const arr1 = simpleSort(obj1) ? [...obj1].sort() : obj1;
        const arr2 = simpleSort(obj2) ? [...obj2].sort() : obj2;
        for (let i = 0; i < arr1.length; i++) {
            if (!deepCompare(arr1[i], arr2[i])) return false;
        }
        return true;
    }
    if (typeof obj1 === "object" && typeof obj2 === "object") {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        keys1.sort();
        keys2.sort();
        for (let i = 0; i < keys1.length; i++) {
            const key1 = keys1[i];
            const key2 = keys2[i];
            if (key1 !== key2 || !deepCompare(obj1[key1], obj2[key1])) return false;
        }
        return true;
    }
    return false;
}

// Helper to filter an object to only include specified keys
function filterKeys(obj: Record<string, any>, keysToKeep: string[]): Record<string, any> {
    const filtered: Record<string, any> = {};
    if (!obj) return filtered;
    for (const key of keysToKeep) {
        filtered[key] = obj.hasOwnProperty(key) ? obj[key] : undefined;
    }
    return filtered;
}

// Helper to find differing keys between two frontmatter objects
function compareFrontmatterKeys(fm1: Record<string, any>, fm2: Record<string, any>, keysToCompare: string[]): string[] {
    const diffKeys: string[] = [];
    for (const key of keysToCompare) {
        if (!deepCompare(fm1[key], fm2[key])) {
            diffKeys.push(key);
        }
    }
    return diffKeys;
}

// Simple content diff summary (Enhanced)
function generateContentDiffSummary(text1: string, text2: string): string {
    const normalize = (str: string) => str.replace(/\r\n/g, '\n').trim();
    const normalizedText1 = normalize(text1);
    const normalizedText2 = normalize(text2);

    if (normalizedText1 === normalizedText2) return "(contenido idéntico)";

    const lines1 = normalizedText1.split('\n');
    const lines2 = normalizedText2.split('\n');

    if (lines1.length !== lines2.length) {
        return `(diferencia de longitud: ${lines1.length} vs ${lines2.length} líneas)`;
    }

    for (let i = 0; i < lines1.length; i++) {
        if (lines1[i] !== lines2[i]) {
            return `(modificado, primera diferencia en línea ~${i + 1})`;
        }
    }
    return "(contenido modificado)";
}

// --- Modal Class (Outside ModuloNotion) ---
class SyncDirectionModal extends Modal {
    diffSummary: string;
    callback: (choice: string) => void;

    constructor(app: App, diffSummary: string, callback: (choice: string) => void) {
        super(app);
        this.diffSummary = diffSummary;
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('notion-sync-modal');

        contentEl.createEl('h2', { text: 'Conflicto de Sincronización' });
        contentEl.createEl('p', { text: this.diffSummary });
        contentEl.createEl('p', { text: '¿Cómo deseas proceder?' });

        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        const obToNoButton = buttonContainer.createEl('button', { text: 'Obsidian -> Notion', cls: 'mod-cta' });
        obToNoButton.addEventListener('click', () => { this.callback('Obsidian -> Notion'); this.close(); });

        const noToObButton = buttonContainer.createEl('button', { text: 'Notion -> Obsidian' });
        noToObButton.addEventListener('click', () => { this.callback('Notion -> Obsidian'); this.close(); });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancelar' });
        cancelButton.addEventListener('click', () => { this.callback('Cancelar'); this.close(); });
    }

    onClose() {
        this.contentEl.empty();
    }
}
