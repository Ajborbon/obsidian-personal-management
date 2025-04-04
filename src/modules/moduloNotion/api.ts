import { Client } from "@notionhq/client";
import type { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints"; // Import specific type
import { Notice, requestUrl } from "obsidian"; // Import requestUrl
import type { RequestUrlParam, RequestUrlResponse } from "obsidian"; // Use type import for these
import ManagementPlugin from "../../main"; // Adjust path as needed
// Removed NotionSettings import
import type { NotionModuleSettings } from "./index"; // Import settings interface from index.ts

// Custom fetch implementation using Obsidian's requestUrl
// Mimics the standard fetch API signature enough for the Notion client
const obsidianFetch = async (url: string | URL, options: RequestInit = {}): Promise<Response> => {
    const method = options.method || 'GET';
    const headers = options.headers as Record<string, string> || {}; // Type assertion
    let body = options.body;

    // requestUrl expects body as string or ArrayBuffer
    if (body instanceof URLSearchParams) {
        body = body.toString();
        if (!headers['Content-Type']) {
             headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
        }
    } else if (body instanceof FormData) {
         // FormData is tricky with requestUrl, might need specific handling if used by Notion client
         console.warn("NotionApi: FormData body type might not be fully supported by obsidianFetch.");
         // Attempt basic conversion, might fail for files
         const formDataBody: Record<string, string> = {};
         body.forEach((value, key) => {
             if (typeof value === 'string') {
                 formDataBody[key] = value;
             }
         });
         body = JSON.stringify(formDataBody); // Send as JSON? Or urlencoded? Notion likely uses JSON.
         if (!headers['Content-Type']) {
             headers['Content-Type'] = 'application/json';
         }
    } else if (typeof body === 'object' && body !== null && !(body instanceof ArrayBuffer)) {
         // Assume JSON if it's an object but not already stringified or ArrayBuffer
         body = JSON.stringify(body);
         if (!headers['Content-Type']) {
             headers['Content-Type'] = 'application/json';
         }
    }


    const requestParams: RequestUrlParam = {
        url: url.toString(),
        method: method,
        headers: headers,
        // Ensure body is string, ArrayBuffer, or undefined (handle null explicitly)
        body: body === null ? undefined : (body as string | ArrayBuffer | undefined),
        throw: false, // Don't throw on HTTP errors, let Notion client handle it
    };

    // Remove Content-Type header for GET/HEAD requests if body is null/undefined
    if ((method === 'GET' || method === 'HEAD') && !requestParams.body) {
        delete headers['Content-Type'];
    }


    try {
        console.log("obsidianFetch: Making request:", method, url.toString(), "Headers:", headers); // Log headers
        const response: RequestUrlResponse = await requestUrl(requestParams);
        console.log("obsidianFetch: Received response status:", response.status);

        // Create a Response object mimicking the standard Fetch API
        const fetchResponse = new Response(response.arrayBuffer, { // Use arrayBuffer for body
            status: response.status,
            statusText: response.status.toString(), // requestUrl doesn't provide statusText
            headers: response.headers,
        });
        return fetchResponse;

    } catch (error) {
        console.error("obsidianFetch: Error making requestUrl:", error);
        // Simulate a network error response
        return new Response(null, { status: 0, statusText: 'Network Error (obsidianFetch)' });
    }
};

export class NotionApi {
    plugin: ManagementPlugin;
    // Removed settings property: settings: NotionSettings;
    client: Client | null = null;

    constructor(plugin: ManagementPlugin, initialSettings: NotionModuleSettings) { // Accept initial settings
        this.plugin = plugin;
        // Initialize client immediately in constructor if possible
        this.initializeClient(initialSettings);
        console.log("NotionApi: Constructor called");
    }

    // Accept settings object as argument
    initializeClient(settings: NotionModuleSettings) {
        const apiKey = settings.notionApiKey; // Access directly from passed settings
        if (apiKey) {
            try {
                // Pass the custom fetch implementation to the Notion client
                this.client = new Client({
                    auth: apiKey,
                    fetch: obsidianFetch, // Use Obsidian's requestUrl via wrapper
                });
                console.log("NotionApi: Notion client initialized successfully using obsidianFetch.");
            } catch (error) {
                console.error("NotionApi: Failed to initialize Notion client:", error);
                 new Notice("Error al inicializar el cliente de Notion. Verifica la API Key."); // Use Notice directly
                this.client = null;
            }
        } else {
            console.warn("NotionApi: Notion API Key not found. Client not initialized.");
            this.client = null;
        }
    }

    getClient(): Client | null {
         if (!this.client) {
             console.warn("NotionApi: Attempted to get client, but it's not initialized.");
             // Attempt re-initialization using current plugin settings
             const currentSettings = this.plugin.settings?.notionSettings;
             if (currentSettings) {
                 this.initializeClient(currentSettings);
             }
             if (!this.client) {
                new Notice("Cliente de Notion no inicializado. Verifica la API Key en la configuración."); // Use Notice directly
             }
         }
        return this.client;
    }

    async createPage(databaseId: string, properties: CreatePageParameters["properties"]) {
        const client = this.getClient();
        if (!client) {
            throw new Error("Notion client is not initialized.");
        }
        if (!databaseId) {
            throw new Error("Database ID is required to create a page.");
        }

        console.log(`NotionApi: Creating page in database ${databaseId}`);
        try {
            const response = await client.pages.create({
                parent: { database_id: databaseId },
                properties: properties,
                // TODO: Add logic to map Obsidian note content to Notion page content (blocks) if needed
                // children: [ ... blocks ... ]
            });
            console.log("NotionApi: Page created successfully:", response);
            return response;
        } catch (error: unknown) { // Explicitly type error as unknown
            console.error("NotionApi: Error creating Notion page:", error);
            const errorMessage = error instanceof Error ? error.message : String(error); // Extract message safely
            new Notice(`Error al crear página en Notion: ${errorMessage}`); // Use Notice directly
            throw error; // Re-throw the error to be caught by the caller
        }
    }

    // TODO: Add other necessary API methods (e.g., queryDatabase, updatePage, etc.) for future sync features
}
