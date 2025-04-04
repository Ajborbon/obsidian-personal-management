/* src/modules/noteLifecycleManager/API/starterAPI.ts */
import { TFile, Notice, TFolder, App } from 'obsidian';
import { DateTime } from 'luxon';
// Use type-only import for interface
import type { NoteFieldHandler } from '../Interfaces/NoteFieldHandler';
// Import specific handlers
import { AgradecimientosFieldHandler } from '../fieldHandlers/FH Subsistemas/AgradecimientosFieldHandler';
import { ReflexionesFieldHandler } from '../fieldHandlers/FH Subsistemas/ReflexionesFieldHandlers';
import { ContenidoParaEstudioFieldHandler } from '../fieldHandlers/FH Subsistemas/CPEFieldHandler';
import { RecursosRecurrentesFieldHandler } from '../fieldHandlers/RRFieldHandler';
import { PGTDFieldHandler } from '../fieldHandlers/FH Estructura/PGTDFieldHandler';
import { PQFieldHandler } from '../fieldHandlers/FH Estructura/PQFieldHandler';
import { AnotacionesFieldHandler } from '../fieldHandlers/FH Subsistemas/AnotacionesFieldHandler';
import { TransaccionesFieldHandler } from '../fieldHandlers/FH Subsistemas/TransaccionesFieldHandler';
import { AreasInteresFieldHandler } from '../fieldHandlers/FH Estructura/AreasInteresFieldHandler';
import { AreaVidaFieldHandler } from '../fieldHandlers/FH Estructura/AreaVidaFieldHandler';
import { nodoAreaVidaFieldHandler } from '../fieldHandlers/FH Estructura/nodoAreaVidaFieldHandler';
import { ObjCompassAnualFieldHandler} from '../fieldHandlers/ObjCompassAnualFieldHandler';
import { CompassPlaneacionAnual_FH } from '../fieldHandlers/CompassPlaneacionAnual_FH';
import { RepositorioLibros_FH } from '../fieldHandlers/FH Subsistemas/RepositorioLibros_FH';
import { Biblioteca_FH } from '../fieldHandlers/FH Subsistemas/Biblioteca_FH';
import { Anual_FH } from '../fieldHandlers/FH Journals/Anual_FH';
import { TrimestralFieldHandler } from '../fieldHandlers/FH Journals/TrimestralFieldHandler';
import { CampañasFieldHandler } from '../fieldHandlers/FH Subsistemas/CampañasFieldHandler';
import { EntregableFieldHandler } from '../fieldHandlers/FH Subsistemas/EntregableFieldHandler';
// Import the actual plugin type
import type MyPlugin from '../../../main'; // Adjust path as needed

export class starterAPI {
    // Use the specific plugin type
    private plugin: MyPlugin;
    private infoSubsistema: any = {};
    private tp: any;
    // Add index signature to allow dynamic assignment and initialize
    private nota: { [key: string]: any } = {};
    private pathCampos: string;
    private app: App;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.tp = this.getTp();
        // Ensure nota is initialized in constructor as well
        this.nota = {};
        // Initialize pathCampos using plugin settings
        // Ensure 'settings' exists on MyPlugin type
        if (this.plugin.settings) {
             this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
        } else {
             console.error("Plugin settings not available in starterAPI constructor.");
             this.pathCampos = "default_path.md"; // Provide a default or handle error
        }
    }

    /**
     * Fills note properties by calling appropriate field handlers.
     * @param runtimeTp The Templater `tp` object available at runtime in the template context. Crucial for suggester etc.
     * @param infoSubsistemaIn Information about the subsystem/note type being created.
     * @param campos Array of field names to process (e.g., ["id", "fecha", "rename"]).
     */
    async fillNote(runtimeTp: any, infoSubsistemaIn: any, campos: string[]): Promise<any | null> {
        console.log("starterAPI.fillNote called with campos:", campos);
        this.nota = {}; // Reset accumulator for this specific call
        let handlerInfo = { ...infoSubsistemaIn }; // Clone to avoid side effects

        // Resolve folder/indice paths using settings
        if (handlerInfo.defined && this.plugin.settings) {
            handlerInfo.folder = this.plugin.settings[handlerInfo.folder];
            handlerInfo.indice = this.plugin.settings[handlerInfo.indice];
            if (!handlerInfo.folder || !handlerInfo.indice) {
                console.error(`Folder ('${infoSubsistemaIn.folder}') or Indice ('${infoSubsistemaIn.indice}') key not found in settings for type ${handlerInfo.type}`);
                new Notice(`Error de configuración: Falta la ruta de carpeta o índice para ${handlerInfo.typeName}.`);
                return null; // Cannot proceed without paths
            }
        } else if (handlerInfo.defined) {
             console.error("Plugin settings not available in fillNote.");
             new Notice("Error interno: No se pudo acceder a la configuración del plugin.");
             return null;
        }

        // Define fieldHandler variable - Use the specific interface type 'NoteFieldHandler'
        let fieldHandler: NoteFieldHandler;

        // Instantiate the correct handler, passing the RUNTIME 'runtimeTp' object
        // Ensure handler constructors accept the specific MyPlugin type
        try {
            switch (handlerInfo.type) {
                case "Agr": fieldHandler = new AgradecimientosFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "PGTD": fieldHandler = new PGTDFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "PQ": fieldHandler = new PQFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "Ax": fieldHandler = new AnotacionesFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "CPE": fieldHandler = new ContenidoParaEstudioFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "RR": fieldHandler = new RecursosRecurrentesFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "Tx": fieldHandler = new TransaccionesFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "AI": fieldHandler = new AreasInteresFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "AV": fieldHandler = new AreaVidaFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "nAV": fieldHandler = new nodoAreaVidaFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "OCA": fieldHandler = new ObjCompassAnualFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "CAI": fieldHandler = new CompassPlaneacionAnual_FH(runtimeTp, handlerInfo, this.plugin); break;
                case "RL": fieldHandler = new RepositorioLibros_FH(runtimeTp, handlerInfo, this.plugin); break;
                case "LB": fieldHandler = new Biblioteca_FH(runtimeTp, handlerInfo, this.plugin); break;
                case "Rx": fieldHandler = new ReflexionesFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "Cp": fieldHandler = new CampañasFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "EMkt": fieldHandler = new EntregableFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "TQ": fieldHandler = new TrimestralFieldHandler(runtimeTp, handlerInfo, this.plugin); break;
                case "AY": fieldHandler = new Anual_FH(runtimeTp, handlerInfo, this.plugin); break;
                default: throw new Error(`Handler no definido para tipo ${handlerInfo.type}`);
            }
        } catch (error) {
             console.error(`Error instantiating FieldHandler for type ${handlerInfo.type}:`, error);
             new Notice(`Error interno inicializando handler para ${handlerInfo.typeName}.`);
             return null;
        }


        // Execute the get methods for each requested field
        try {
            for (const campo of campos) {
                const functionName = `get${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
                // Check if the method exists on the instantiated handler object
                if (fieldHandler && typeof (fieldHandler as any)[functionName] === 'function') {
                    console.log(`Calling ${functionName} for field '${campo}'...`);
                    // Store the result directly into the note accumulator object
                    // We cast fieldHandler to 'any' here to bypass strict type checking for dynamic method calls,
                    // assuming the interface guarantees these methods exist if requested.
                    // A safer approach involves checking against the NoteFieldHandler interface keys.
                    this.nota[campo] = await (fieldHandler as any)[functionName]();
                    console.log(`Result for ${functionName}:`, this.nota[campo]);
                } else {
                    console.warn(`Función ${functionName} no encontrada o no es una función en el handler para ${handlerInfo.type}. Campo '${campo}' será omitido.`);
                    // Optionally set the field to null or undefined in this.nota
                    // this.nota[campo] = null;
                }
            }
        } catch (error: any) { // Catch specific error type if possible
            console.error(`Error durante la ejecución de getCampo para ${handlerInfo.type}:`, error);
            // Provide a more specific error message if available
            new Notice(`Error procesando campo: ${error.message || 'Error desconocido'}`);
            return null; // Indicate failure
        }

        // After processing all fields, get the final consolidated note object from the handler
        try {
             const finalNota = await fieldHandler.getNota();
             console.log("Final note object from handler.getNota():", finalNota);
             // It might be safer to return the object from getNota() as it represents the handler's final state
             return finalNota;
             // Alternatively, return the accumulated this.nota if confident it's correct
             // return this.nota;
        } catch(error: any) {
             console.error(`Error calling getNota() on handler for ${handlerInfo.type}:`, error);
             new Notice(`Error finalizando nota: ${error.message || 'Error desconocido'}`);
             return null;
        }
    }

    // Keep getTp for potential use by other methods, but fillNote uses runtimeTp
    private getTp(): any {
        try {
            if (!this.plugin || !this.plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
                console.error('El plugin Templater no está habilitado.');
                return undefined; // Return undefined or throw error
            }
            const templaterPlugin = this.plugin.app.plugins.plugins['templater-obsidian'];
            if (!templaterPlugin) {
                 console.error("No se pudo obtener la instancia del plugin Templater.");
                 return undefined;
            }
            // Attempt to get the functions object - this might vary between Templater versions
            // This specific path might be fragile.
            const tpInternalFunctions = templaterPlugin.templater?.functions_generator?.internal_functions?.modules_array;
            if (!tpInternalFunctions) {
                 console.warn("No se pudo acceder a modules_array de Templater. Intentando acceso alternativo.");
                 // Fallback or alternative access method if needed
                 // const tp = templaterPlugin.templater?.current_functions_object; // Example alternative
                 // if (tp) return tp;
                 console.error("No se pudo obtener el objeto de funciones de Templater.");
                 return undefined;
            }

            let tp: any = {};
            tp.file = tpInternalFunctions.find((m: any) => m.name == "file");
            tp.system = tpInternalFunctions.find((m: any) => m.name == "system");

            if (!tp.file || !tp.system) {
                console.error("No se pudieron encontrar los módulos 'file' o 'system' de Templater.");
                // Even if incomplete, return what we found, or undefined
                return tp.file || tp.system ? tp : undefined;
            }
            console.log('API interna: Objeto tp parcial (file, system) cargado.');
            return tp;
        } catch (error) {
             console.error("Error crítico obteniendo objeto tp de Templater:", error);
             return undefined;
        }
    }

     // Refactor createNote to get tp directly if needed
     async createNote(subsistema: string) {
        try {
            // Get settings safely
            if (!this.plugin.settings) {
                 throw new Error("Plugin settings not available in createNote.");
            }
            const folderKey = `folder_${subsistema}`;
            const templateFolder = this.plugin.settings[folderKey];
            if (!templateFolder) {
                 throw new Error(`Setting key '${folderKey}' not found.`);
            }
            const templatePath = `Plantillas/${templateFolder}/Plt - ${subsistema}.md`;

            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            if (!(templateFile instanceof TFile)) {
                throw new Error(`Template '${templatePath}' no encontrado o no es un archivo.`);
            }

            const dtConseq = DateTime.now().toFormat('yyyy-MM-dd HHmmss');
            const filename = `${subsistema} ${dtConseq}`;
            const inboxFolder = this.app.vault.getAbstractFileByPath("Inbox");
            if (!(inboxFolder instanceof TFolder)) { // Check if it's a TFolder
                throw new Error(`La carpeta "Inbox" no se encontró o no es una carpeta.`);
            }

            // Get Templater plugin instance directly here
            const templaterPlugin = this.plugin.app.plugins.plugins['templater-obsidian'];
            if (!templaterPlugin?.templater?.current_functions_object?.file?.static_functions?.get) {
                 throw new Error("Función 'create_new' de Templater no disponible.");
            }
            // Access create_new function more reliably if possible
            const tpFuncs = templaterPlugin.templater.current_functions_object;
            const createNewFunc = tpFuncs.file.static_functions.get("create_new");

            if (typeof createNewFunc !== "function") {
                throw new Error("La función 'create_new' de Templater no es una función.");
            }

            console.log(`Creando nota desde template: ${templateFile.path} en carpeta: ${inboxFolder.path} con nombre: ${filename}`);
            // Pass the TFolder object to create_new
            await createNewFunc(templateFile, filename, true, inboxFolder);
            console.log(`Nota ${filename} creada exitosamente en Inbox.`);

        } catch (error: any) {
            console.error("Error en createNote:", error);
            new Notice(`Error al crear nota desde template: ${error.message}`);
        }
    }

    // getOtrosAsuntos and activeStructureResources might need adjustments
    // if they relied on the old this.tp or this.infoSubsistema structure.
    // For now, assume they work or are not relevant to the current flow.

    async getOtrosAsuntos(subsistemas: string[]) { // Added type for subsistemas
        // This method uses this.tp - ensure this.tp is valid or pass runtimeTp
        if (!this.tp || !this.tp.system || !this.tp.system.static_functions) {
             console.error("this.tp.system.static_functions no disponible en getOtrosAsuntos");
             return []; // Return empty or throw error
        }
        let suggesterFunc = this.tp.system.static_functions.get("suggester");
        if (typeof suggesterFunc !== 'function') {
             console.error("Función suggester de Templater no encontrada en getOtrosAsuntos");
             return [];
        }

        let campo: string[] = []; // Initialize as string array

        for (let subsistema of subsistemas) {
            try {
                let incluye = await suggesterFunc(["Si", "No"], [true, false], true, `Desea agregar algun ${subsistema} activo como origen?`);
                if (!incluye) continue;

                // Ensure activeStructureResources is awaited and returns TFile[]
                let recursosActivos: TFile[] = await this.activeStructureResources(subsistema);
                if (!Array.isArray(recursosActivos)) {
                     console.warn(`activeStructureResources para ${subsistema} no devolvió un array.`);
                     recursosActivos = [];
                }

                // Filter out files without frontmatter or aliases safely
                let aliasData = recursosActivos.map(file => {
                    const cache = this.app.metadataCache.getFileCache(file);
                    const aliases = cache?.frontmatter?.aliases;
                    // Ensure aliases is an array and has elements
                    const firstAlias = Array.isArray(aliases) && aliases.length > 0 ? aliases[0] : null;
                    return { file, firstAlias }; // Keep file reference
                });

                let availableOptions = aliasData.filter(data => data.firstAlias !== null);

                while (availableOptions.length > 0) {
                    const displayTexts = availableOptions.map(data => data.firstAlias as string); // Already filtered nulls
                    const returnValues = availableOptions.map(data => data.file); // Return the TFile object

                    let seleccion = await suggesterFunc(displayTexts, returnValues, false, `${subsistema} activos:`);

                    if (!seleccion) break; // User cancelled

                    // seleccion is now a TFile object
                    const selectedFile = seleccion as TFile;
                    campo.push(selectedFile.basename); // Add basename to the result array

                    // Remove selected option from availableOptions
                    availableOptions = availableOptions.filter(data => data.file.path !== selectedFile.path);

                    if (availableOptions.length === 0) break;

                    let deseaAgregarOtro = await suggesterFunc(["Si", "No"], [true, false], true, `Desea agregar otro ${subsistema} como origen?`);
                    if (!deseaAgregarOtro) break;
                }
            } catch (error) {
                 console.error(`Error procesando subsistema ${subsistema} en getOtrosAsuntos:`, error);
                 // Optionally notify user or continue to next subsistema
            }
        }
        return campo;
    }


    async activeStructureResources(typeName: string): Promise<TFile[]> { // Return TFile array
        try {
            if (!this.plugin.settings) {
                 console.error("Plugin settings not available in activeStructureResources.");
                 return [];
            }
            const files = this.app.vault.getMarkdownFiles();
            let activeResources: TFile[] = []; // Explicitly TFile array

            // Assuming 'type' is not defined globally, use typeName
            switch (typeName) {
                case "AreasInteres":
                    // Implement logic for AreasInteres if needed
                    console.warn("activeStructureResources: Lógica para AreasInteres no implementada.");
                    // Example: Find files based on a specific tag or folder for AreasInteres
                    break;
                // Add cases for other specific types if they have different logic

                default:
                    const resourceFolderNameKey = `folder_${typeName}`;
                    const resourceFolder = this.plugin.settings[resourceFolderNameKey];

                    if (!resourceFolder || typeof resourceFolder !== 'string') {
                        console.error(`Carpeta para "${typeName}" (${resourceFolderNameKey}) no definida o inválida en settings.`);
                        return [];
                    }

                    // Filter files within the folder and check state
                    const registrosExistentes = files.filter(file => file.path.startsWith(resourceFolder + '/')); // Ensure it's within the folder

                    for (const file of registrosExistentes) {
                         const metadata = this.app.metadataCache.getFileCache(file)?.frontmatter;
                         if (metadata && metadata.estado === "🟢") {
                             activeResources.push(file);
                         }
                    }
                    break;
            }
            return activeResources;
        } catch (error) {
            console.error(`Error buscando recursos activos para ${typeName}:`, error);
            return [];
        }
    }
}
