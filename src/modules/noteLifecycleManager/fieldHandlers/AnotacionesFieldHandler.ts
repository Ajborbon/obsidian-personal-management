import { NoteFieldHandler } from './NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario
import { FieldHandlerUtils } from '../FieldHandlerUtils';
import { TFile, TFolder, Notice } from 'obsidian';
import { AnotacionesFieldHandler} from '../Interfaces/AnotacionesFieldHandler';

export class AnotacionesFieldHandler extends NoteFieldHandler implements AnotacionesFieldHandler{
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
      this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
    }

    async getClasificacion(): Promise<{ clase: string | null, tag: string | null } | undefined> {
        let clasificacion: string | null = null;
        let tagClasificacion: string | null = null;
        let clasificacionAX: { [x: string]: any; } = {};
        let tagsClasificacionAX: string[] = [];
        let nuevaClasificacion = false;
    
        const file = app.vault.getAbstractFileByPath(this.pathCampos);
        if (!file) {
            new Notice("Archivo no encontrado.");
            return;
        }
    
        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        if (frontmatter) {
            clasificacionAX = frontmatter.tituloClasificacionAX || [];
            tagsClasificacionAX = frontmatter.tagsClasificacionAX || [];
    
            const suggester = this.tp.system.static_functions.get("suggester");
            tagClasificacion = await suggester(clasificacionAX, tagsClasificacionAX, false, "¿Clasificarías esta nota bajo alguna de las siguientes categorías?");
            
            if (tagClasificacion === null) {
                new Notice("Creación de nota cancelada por el usuario.");
                return;
            } else if (tagClasificacion === "Nuevo") {
                const prompt = this.tp.system.static_functions.get("prompt");
                clasificacion = await prompt("¿Cual es el nombre de la nueva clasificación que vas a ingresar?", "MiClasificación", true);
                
                if (clasificacion === null) {
                    new Notice("Creación de nota cancelada por el usuario.");
                    return;
                }
    
                tagClasificacion = await prompt("¿Cual es el tag que utilizaras para " + clasificacion + "?. No utilices espacios en la definición del tag.", "nuevoTag", true);
                
                if (tagClasificacion === null) {
                    new Notice("Creación de nota cancelada por el usuario.");
                    return;
                }
                
                nuevaClasificacion = true;
            } else if (tagClasificacion === "Ninguna") {
                tagClasificacion = "";
                clasificacion = "";
            } else {
                const indice = tagsClasificacionAX.indexOf(tagClasificacion);
                clasificacion = clasificacionAX[indice];
            }
        }
    
        if (nuevaClasificacion) {
            try {
                await app.fileManager.processFrontMatter(file, (frontmatter: { tituloClasificacionAX: any[], tagsClasificacionAX: any[] }) => {
                    const newClasificacion = [...clasificacionAX, clasificacion];
                    const newTagClasificacion = [...tagsClasificacionAX, tagClasificacion];
                    frontmatter.tituloClasificacionAX = newClasificacion;
                    frontmatter.tagsClasificacionAX = newTagClasificacion;
                    console.log("Frontmatter actualizado con éxito");
                });
            } catch (err) {
                console.error("Error al actualizar el frontmatter", err);
            }
        }
    
        if (tagClasificacion !== "") {
            tagClasificacion = "cl/" + tagClasificacion;
        }
    
        this.nota.clasificacionAX = clasificacion;
        this.nota.tagClasificacionAX = tagClasificacion;
    
        return { clase: clasificacion, tag: tagClasificacion };
    }
}