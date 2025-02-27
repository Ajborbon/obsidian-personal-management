// src/modules/noteLifecycleManager/fieldHandlers/FH Subsistemas/CampañasFieldHandler.ts
import { NoteFieldHandler } from '../FH Base/NoteFieldHandler';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { TFile, TFolder, Notice } from 'obsidian';
import { DateTime } from 'luxon';

export class CampañasFieldHandler extends NoteFieldHandler {
    constructor(tp: any, folder: string, plugin: any) {
        super(tp, folder, plugin);
    }

    // Obtiene el trimestre de la campaña desde las notas de trimestres existentes
    async getTrimestre() {
        let trimestres = await FieldHandlerUtils.findMainFilesWithState("TQ", null, this.plugin);
        
        const trimestre = await this.suggester(
            trimestres.map(b => b.file.basename),
            trimestres.map(b => b.file.basename),
            false,
            "Trimestre al que pertenece esta campaña:"
        );
        
        if (trimestre === null) {
            new Notice("Selección de trimestre cancelada.");
            return;
        }
        
        this.nota.trimestre = `[[${trimestre}]]`;
        return this.nota.trimestre;
    }

    // Obtiene el estado de la campaña (status)
    async getStatus() {
        const estados = [
            "Pendiente",
            "Planificando",
            "Diseño",
            "Revisión Interna",
            "Revisión Cliente",
            "Publicando",
            "Recoger Indicadores",
            "En pausa",
            "Terminado",
            "Cancelado"
        ];
        
        const status = await this.suggester(
            estados,
            estados,
            false,
            "Estado actual de la campaña:"
        );
        
        if (status === null) {
            new Notice("Selección de estado cancelada.");
            return;
        }
        
        this.nota.status = status;
        return status;
    }

    // Obtiene la fecha de inicio de la campaña
    async getFechaInicio() {
        // Usamos el prompt estático
        const fechaActual = DateTime.now().toFormat('yyyy-MM-dd');
        
        // Usamos la función prompt correctamente desde static_functions
        const prompt = this.tp.system.static_functions.get("prompt");
        const fechaInicio = await prompt(
            "Fecha de inicio de la campaña (YYYY-MM-DD):",
            fechaActual,
            true
        );
        
        if (fechaInicio === null) {
            new Notice("Selección de fecha de inicio cancelada.");
            return;
        }
        
        this.nota.fechaInicio = fechaInicio;
        return fechaInicio;
    }

    // Obtiene la fecha de fin de la campaña
    async getFechaFin() {
        // Fecha sugerida: 30 días después de la fecha de inicio, o la fecha actual si no hay fecha de inicio
        const fechaInicioObj = this.nota.fechaInicio 
            ? DateTime.fromFormat(this.nota.fechaInicio, 'yyyy-MM-dd')
            : DateTime.now();
        
        const fechaSugerida = fechaInicioObj.plus({ days: 30 }).toFormat('yyyy-MM-dd');
        
        // Usamos la función prompt correctamente desde static_functions
        const prompt = this.tp.system.static_functions.get("prompt");
        const fechaFin = await prompt(
            "Fecha de fin de la campaña (YYYY-MM-DD):",
            fechaSugerida,
            true
        );
        
        if (fechaFin === null) {
            new Notice("Selección de fecha de fin cancelada.");
            return;
        }
        
        this.nota.fechaFin = fechaFin;
        return fechaFin;
    }

    // Obtiene la prioridad de la campaña
    async getPrioridad() {
        const prioridades = ["Baja", "Media", "Alta"];
        
        const prioridad = await this.suggester(
            prioridades,
            prioridades,
            false,
            "Prioridad de la campaña:"
        );
        
        if (prioridad === null) {
            new Notice("Selección de prioridad cancelada.");
            return;
        }
        
        this.nota.prioridad = prioridad;
        return prioridad;
    }

    // Obtiene la URL de los indicadores
    async getIndicadores() {
        // Usamos la función prompt correctamente desde static_functions
        const prompt = this.tp.system.static_functions.get("prompt");
        const indicadores = await prompt(
            "URL de los indicadores de la campaña:",
            "https://",
            true
        );
        
        if (indicadores === null) {
            new Notice("Ingreso de URL de indicadores cancelado.");
            return;
        }
        
        this.nota.indicadores = indicadores;
        return indicadores;
    }

    // Sobrescribe la función getAliases para ajustarla a los requerimientos específicos
    async getAliases() {
        this.nota.aliases = [];
        this.nota.aliases.push(this.nota.titulo);
        this.nota.aliases.push(`CP/${this.nota.titulo}`);
        return this.nota.aliases;
    }

    // Implementación de getRename para la estructura de carpetas basada en trimestres
// Implementación de getRename para la estructura de carpetas basada en trimestres
async getRename() {
    // El trimestre viene con formato [[trimestre]], así que extraemos el valor
    const trimestreMatch = this.nota.trimestre.match(/\[\[(.*?)\]\]/);
    const trimestre = trimestreMatch ? trimestreMatch[1] : "Sin-Trimestre";
    
    // Construimos la ruta con la estructura solicitada
    const basePath = "Subsistemas/Marketing/Proyectos";
    const folderPath = `${basePath}/${trimestre}`;
    
    // Creamos la carpeta del trimestre si no existe
    await FieldHandlerUtils.crearCarpeta(folderPath);
    
    // Construimos el nombre completo del archivo
    const newName = `${folderPath}/${this.nota.titulo}.md`;
    
    const file = this.tp.file.config.target_file;
    const existe = app.vault.getAbstractFileByPath(newName);
    
    try {
        if (existe instanceof TFile) {
            const nombreFile = newName.split("/");
            const borrar = await this.suggester(
                ["Sobreescribir Archivo Actual", "Detener creación del archivo."],
                [true, false],
                true,
                `¿${nombreFile.pop()} ya existe. Qué deseas hacer?`
            );
            
            if (borrar) {
                await app.vault.delete(existe);
                if (file instanceof TFile) {
                    await app.vault.rename(file, newName);
                    console.log("Archivo renombrado con éxito.");
                    
                    // Abrir la nota en una nueva pestaña
                    const nuevoArchivo = app.vault.getAbstractFileByPath(newName);
                    if (nuevoArchivo instanceof TFile) {
                        await app.workspace.getLeaf(true).openFile(nuevoArchivo);
                    }
                    
                    return newName;
                }
            } else {
                console.log("Cancelando la creación del archivo.");
                throw new Error("Proceso cancelado por el usuario.");
            }
        } else {
            if (file instanceof TFile) {
                await app.vault.rename(file, newName);
                console.log("Archivo renombrado con éxito.");
                
                // Abrir la nota en una nueva pestaña
                const nuevoArchivo = app.vault.getAbstractFileByPath(newName);
                if (nuevoArchivo instanceof TFile) {
                    await app.workspace.getLeaf(true).openFile(nuevoArchivo);
                }
                
                return newName;
            }
        }
    } catch (error) {
        console.error("Error al cambiar el nombre", error);
        throw error;
    }
}
}