/*
 * Filename: /src/modules/noteLifecycleManager/API/starterAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-24 01:18:38
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */

/* src/modules/noteLifecycleManager/API/starterAPI.ts */
import { TFile, Notice, TFolder } from 'obsidian';
import {DateTime , Duration} from 'luxon';
// Interfaces
import { NoteFieldHandler } from '../Interfaces/NoteFieldHandler';
// FileHandlers
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
// obsidian

export class starterAPI {
    //private utilsApi: utilsAPI;
    private plugin: Plugin;
    private infoSubsistema: object; // Asumiendo que es un string
    private tp: object;
    private nota: object;
    private pathCampos: string; 

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        // Inicializa folder e indice getcon valores predeterminados o lógica específica.
        this.infoSubsistema = {};
        this.tp = this.getTp();
        this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
    }
    
   


    async fillNote(infoSubsistema: { folder: string; indice: string; type: string; }, campos: any) {
        this.nota = {};
        let nota;
        Object.assign(this.infoSubsistema, infoSubsistema);
        
        if (this.infoSubsistema.defined) {
          this.infoSubsistema.folder = this.plugin.settings[infoSubsistema.folder];
          this.infoSubsistema.indice = this.plugin.settings[infoSubsistema.indice];
          Object.assign(this.nota, infoSubsistema);
        }
    
        let fieldHandler: NoteFieldHandler;
        switch (this.infoSubsistema.type) {
          case "Agr":
            fieldHandler = new AgradecimientosFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "PGTD":
            fieldHandler = new PGTDFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "PQ":
            fieldHandler = new PQFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "Ax":
            fieldHandler = new AnotacionesFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "CPE":
            fieldHandler = new ContenidoParaEstudioFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "RR":
            fieldHandler = new RecursosRecurrentesFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "Tx":
            fieldHandler = new TransaccionesFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "AI":
            fieldHandler = new AreasInteresFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "AV":
            fieldHandler = new AreaVidaFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "nAV":
            fieldHandler = new nodoAreaVidaFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "OCA":
            fieldHandler = new ObjCompassAnualFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "CAI":
            fieldHandler = new CompassPlaneacionAnual_FH(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "RL":
            fieldHandler = new RepositorioLibros_FH(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "LB":
              fieldHandler = new Biblioteca_FH(this.tp, this.infoSubsistema, this.plugin);
              break;
          case "Rx":
            fieldHandler = new ReflexionesFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "Cp":
            fieldHandler = new CampañasFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "EMkt":
            fieldHandler = new EntregableFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "TQ":
            fieldHandler = new TrimestralFieldHandler(this.tp, this.infoSubsistema, this.plugin);
            break;
          case "AY":
            fieldHandler = new Anual_FH(this.tp, this.infoSubsistema, this.plugin);
            break;
          default:
            throw new Error(`No se ha definido un manejador de campos para el tipo ${this.infoSubsistema.type}`);
        }
        
        try {
          for (let campo of campos) {
            const functionName = `get${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
            if (typeof fieldHandler[functionName] === 'function') {
                //debugger;
                this.nota[campo] = await fieldHandler[functionName]();
                nota = await fieldHandler.getNota();
                for (const key in nota) {
                    if (!(key in this.nota)) {
                      this.nota[key] = nota[key];
                    }
                  }
            } else {
              console.error(`La función ${functionName} no está definida.`);
            }
            }


            } catch (error) {
            console.error("No se pudo crear el objeto de registro.", error);
            new Notice("No se pudo crear el objeto de registro.");
            return null;
        }
        return this.nota;
    }
    

    getTp(){
        
        if (!this.plugin || !this.plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
            console.error('El plugin Templater no está habilitado.');
            return;
        }
        //  Forma de acceder al objeto tp normal que he usado desde DVJS cuando current Functions esta cargado.
        //const templaterPlugin = this.app.plugins.plugins['templater-obsidian'];
        //const tp = templaterPlugin.templater.current_functions_object;
        // -> version que falla si no esta arriba el plugin porque hace get del plugin directo. const templaterPlugin = this.app.plugins.getPlugin('templater-obsidian');
        
        let tpGen = this.plugin.app.plugins.plugins["templater-obsidian"].templater;
        tpGen = tpGen.functions_generator.internal_functions.modules_array;
        let tp = {}
        // get an instance of modules
        tp.file = tpGen.find(m => m.name == "file");
        tp.system = tpGen.find(m => m.name == "system");

        if (!tp.system) {
        console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
        return;
    }
    console.log('tp en YAMLUpdaterAPI se ha cargado satisfactoriamente');
    return tp;
    }


     // Crear Nota desde template
     async createNote(subsistema: string) {
        try {
            const templatePath = `Plantillas/${this.plugin.settings[`folder_${subsistema}`]}/Plt - ${subsistema}.md`;
            
              // Intentar obtener el archivo por path
            const templateFile = app.vault.getAbstractFileByPath(templatePath);

            // Verificar si el archivo es un TFile
            if (!(templateFile instanceof TFile)) {
                // Si no es un TFile, manejar el error
                throw new Error(`El template para "${subsistema}" no se encontró o no es un archivo válido.`);
            }
            const dtConseq = DateTime.now().toFormat('yyyy-MM-dd HHmmss');
            const filename = `${subsistema} ${dtConseq}`;
            const folder = app.vault.getAbstractFileByPath("Inbox");
            if (!folder) {
                throw new Error(`La carpeta "Inbox" no se encontró.`);
            }
    
            const tp = this.getTp();
            let crearNota = tp.file.static_functions.get("create_new");
            if (typeof crearNota !== "function") {
                throw new Error("La función para crear notas no está disponible.");
            }
            await crearNota(templateFile, filename, true, folder).basename;
            
       
        } catch (error) {
            console.error(error);
            // Aquí puedes manejar el error, por ejemplo, mostrando un mensaje al usuario
            // Puedes reemplazar este mensaje de error por cualquier acción que consideres adecuada
            alert(`Error al crear la nota: ${error.message}`);
        }
    }
    

    async getOtrosAsuntos(subsistemas) {
        let suggester = this.tp.system.static_functions.get("suggester");
        let campo = [];
    
        for (let subsistema of subsistemas) {
            // Pregunta inicial para incluir algún subsistema como origen
            let incluye = await suggester(["Si", "No"], [true, false], true, `Desea agregar algun ${subsistema} activo como origen?`);
            if (!incluye) continue; // Si la respuesta es 'No', continúa con el siguiente subsistema
            debugger
            let recursosActivos = await this.activeStructureResources(subsistema);
            let primerAlias = recursosActivos.map(file => {
                const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                return metadata && metadata.aliases && metadata.aliases.length > 0 ? metadata.aliases[0] : null;
            }).filter(alias => alias !== null);
    
            while (recursosActivos.length > 0) { // Continúa mientras haya recursos activos para elegir
                let indiceSeleccionado
                if (subsistema === "AreasVida" || subsistema === "AreasInteres"){
                    let seleccion = await suggester(primerAlias, recursosActivos.map(b => b.path), false, `${subsistema} activos:`);
                    if (!seleccion) break; // Si no hay selección, sale del ciclo
                    // Encuentra y elimina la selección de los arreglos para no volver a mostrarla
                    // Encuentra el índice del archivo seleccionado en recursosActivos basándonos en el basename
                    indiceSeleccionado = recursosActivos.findIndex(b => b.path === seleccion);
                }else{
                let seleccion = await suggester(primerAlias, recursosActivos.map(b => b.basename), false, `${subsistema} activos:`);
                if (!seleccion) break; // Si no hay selección, sale del ciclo
                // Encuentra y elimina la selección de los arreglos para no volver a mostrarla
                // Encuentra el índice del archivo seleccionado en recursosActivos basándonos en el basename
                indiceSeleccionado = recursosActivos.findIndex(b => b.basename === seleccion);
                }
                if (indiceSeleccionado !== -1) {
                    if (subsistema === "AreasVida" || subsistema === "AreasInteres"){
                        
                    campo.push(recursosActivos[indiceSeleccionado].path); // Agrega el basename del archivo seleccionado al campo    
                    }else{
                    campo.push(recursosActivos[indiceSeleccionado].basename); // Agrega el basename del archivo seleccionado al campo
                    }
                    // Elimina el elemento seleccionado de ambos arreglos para no volver a mostrarlo
                    recursosActivos.splice(indiceSeleccionado, 1);
                    primerAlias.splice(indiceSeleccionado, 1);
                }
    
                // Si no quedan más recursos activos, no pregunta si desea agregar otro
                if (recursosActivos.length === 0) break;
    
                // Pregunta si desea agregar otro registro del mismo subsistema
                let deseaAgregarOtro = await suggester(["Si", "No"], [true, false], true, `Desea agregar otro ${subsistema} como origen?`);
                debugger
                if (!deseaAgregarOtro) break; // Si la respuesta es 'No', sale del ciclo
                
            }
        }
    
        return campo; // Retorna el arreglo campo con todas las selecciones realizadas
    }
    
    
    // FUNCION QUE TRAE TODAS LAS NOTAS ACTIVAS DE LOS SISTEMAS. - Revisar en que la uso...
    async activeStructureResources(typeName) {
        try {
            // Obtén todos los archivos Markdown
            const files = app.vault.getMarkdownFiles();
            
            switch (type){

                case "AreasInteres":
                    debugger;

                break;
                default: 
                // Determina el nombre de la carpeta de recursos basado en el tipo
                let resourceFolderName = "folder_" + typeName;
                let resourceFolder = this.plugin.settings[resourceFolderName];
                
                // Verifica si la carpeta de recursos existe para evitar errores
                if (!resourceFolder) {
                    console.error(`La carpeta "${resourceFolderName}" no existe en la configuración del plugin.`);
                    return []; // Retorna un arreglo vacío si la carpeta no existe
                }
                
                let activeResources = [];
                
                // Filtra los archivos que están dentro del directorio deseado y tienen estado 🟢
                const registrosExistentes = files.filter(file => file.path.startsWith(resourceFolder));
                
                // Usa metadataCache para buscar los estados en el frontmatter
                registrosExistentes.forEach(file => {
                    const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                    if (metadata && metadata.estado === "🟢") {
                        activeResources.push(file);
                        }
                    });
                break;
            } // Fin Switch
            return activeResources;
        } catch (error) {
            console.error("Error al buscar recursos activos:", error);
            return []; // Retorna un arreglo vacío en caso de error
        }
    }
    
}
  