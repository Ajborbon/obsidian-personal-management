// src/modules/noteLifecycleManager/fieldHandlers/FH Subsistemas/EntregableFieldHandler.ts
import { NoteFieldHandler } from '../FH Base/NoteFieldHandler';
import { EntregableFieldHandler } from '../../Interfaces/EntregableFieldHandler';
import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { SeleccionModal } from '../../../modales/seleccionModal';
import { SeleccionModalTareas } from '../../../modales/seleccionModalTareas';
import { fuzzySelectOrCreate } from '../../../modales/fuzzySelectOrCreate';
import { SeleccionMultipleModal} from '../../../modales/seleccionMultipleModal';
import { SpinnerModal } from '../../../modales/spinnerModal';
import { DatePickerModal } from '../../../modales/datePickerModal';
import { PedidosClienteModal } from '../../../modales/pedidosClienteModal';

export class EntregableFieldHandler extends NoteFieldHandler implements EntregableFieldHandler {
    constructor(tp: any, infoSubsistema: any, plugin: any) {
        super(tp, infoSubsistema, plugin);
    }
    
    async getTrimestre(): Promise<string> {
        // Verificar si es una continuación desde una Campaña
        const activo = app.workspace.getActiveFile();
        
        if (activo) {
            const metadata = app.metadataCache.getFileCache(activo)?.frontmatter;
            
            if (metadata && metadata.type === 'Campaña') {
                const esContinuacion = await this.suggester(
                    ["Sí", "No"],
                    [true, false],
                    false,
                    `¿Este entregable es parte de la campaña ${activo.basename}?`
                );
                
                if (esContinuacion && metadata.trimestre) {
                    this.nota.trimestre = metadata.trimestre;
                    return metadata.trimestre;
                }
            }
        }
        
        // Si no es continuación, buscar trimestres disponibles
        const trimestres = await FieldHandlerUtils.findMainFilesWithState("TQ", null, this.plugin);
        const trimestre = await this.suggester(
            trimestres.map(t => t.file.basename),
            trimestres.map(t => t.file.basename),
            false,
            "Selecciona el trimestre para este entregable:"
        );
        
        if (!trimestre) {
            throw new Error("Debe seleccionar un trimestre para continuar");
        }
        
        this.nota.trimestre = trimestre;
        return trimestre;
    }
    
    async getTipo(): Promise<string> {
        const tiposEntregable = [
            "Blog", 
            "Correo Electrónico", 
            "Diseño Personalizado",
            "Entrenamiento",
            "Estudio de caso",
            "Historia",
            "Infografía",
            "Pauta",
            "Podcast",
            "Post",
            "Reel",
            "Tarea Avanzada",
            "Video",
            "Webinar"
        ];
        
        const tipo = await this.suggester(
            tiposEntregable,
            tiposEntregable,
            false,
            "Selecciona el tipo de entregable:"
        );
        
        if (!tipo) {
            throw new Error("Debe seleccionar un tipo de entregable para continuar");
        }
        
        this.nota.tipo = tipo;
        return tipo;
    }
    
    async getCanales(): Promise<string[]> {
        const todosLosCanales = [
            "Whatsapp",
            "Instagram",
            "Facebook",
            "Tik Tok",
            "Sitio Web",
            "Email marketing",
            "Youtube",
            "Twitter",
            "LinkedIn",
            "Otro"
        ];
        
        // Preseleccionar canales según el tipo
        let canalesPreseleccionados: string[] = [];
        
        switch (this.nota.tipo) {
            case "Historia":
                canalesPreseleccionados = ["Whatsapp", "Instagram", "Facebook"];
                break;
            case "Post":
                canalesPreseleccionados = ["Instagram", "Facebook"];
                break;
            case "Reel":
                canalesPreseleccionados = ["Instagram", "Tik Tok", "Youtube"];
                break;
            case "Video":
                canalesPreseleccionados = ["Youtube"];
                break;
            case "Blog":
                canalesPreseleccionados = ["Sitio Web", "LinkedIn"];
                break;
            case "Pauta":
                canalesPreseleccionados = ["Instagram", "Facebook"];
                break;
            case "Correo Electrónico":
                canalesPreseleccionados = ["Email marketing"];
                break;
            case "Infografía":
                canalesPreseleccionados = ["Instagram", "Facebook"];
                break;
            case "Estudio de caso":
                canalesPreseleccionados = ["LinkedIn"];
                break;
            default:
                // Para los otros tipos no hay preseleccionados específicos
                canalesPreseleccionados = [];
        }
        
        // Crear opciones para el selector múltiple
        const opciones = todosLosCanales.map(canal => {
            return {
                nombre: canal,
                seleccionado: canalesPreseleccionados.includes(canal)
            };
        });
        
        // Mostrar selección múltiple personalizada
        const multiSelectModal = new SeleccionMultipleModal(this.plugin.app, opciones, "Selecciona los canales para este entregable");
        const canalesSeleccionados = await multiSelectModal.openAndAwaitSelection();
        
        if (!canalesSeleccionados || canalesSeleccionados.length === 0) {
            // Proporciona al menos los canales preseleccionados si el usuario no selecciona ninguno
            this.nota.canales = canalesPreseleccionados;
            return canalesPreseleccionados;
        }
        
        this.nota.canales = canalesSeleccionados;
        return canalesSeleccionados;
    }
    
    async getStatus(): Promise<string> {
        const estados = [
            "Sin empezar",
            "Diseñando",
            "Revisión Interna",
            "Revisión Cliente",
            "Programación parrila",
            "Publicado",
            "Completado",
            "Archivado"
        ];
        
        const status = await this.suggester(
            estados,
            estados,
            false,
            "Selecciona el estado actual del entregable:"
        );
        
        if (!status) {
            // Valor por defecto
            this.nota.status = "Sin empezar";
            return "Sin empezar";
        }
        
        this.nota.status = status;
        return status;
    }
    
    async getPrioridad(): Promise<string> {
        const prioridades = ["Baja", "Media", "Alta"];
        
        const prioridad = await this.suggester(
            prioridades,
            prioridades,
            false,
            "Selecciona la prioridad del entregable:"
        );
        
        if (!prioridad) {
            // Valor por defecto
            this.nota.prioridad = "Media";
            return "Media";
        }
        
        this.nota.prioridad = prioridad;
        return prioridad;
    }
    
    async getPublicacion() {
        const modal = new DatePickerModal(this.plugin.app);
        modal.open();
        
        const selectedDate = await modal.waitForInput();
        if (selectedDate === null) {
            return ""; // Si se cancela, devolver string vacío
        }
        
        this.nota.publicacion = selectedDate;
        return selectedDate;
    }
    
    async getPiezaNube(): Promise<string> {
        const url = await this.prompt(
            "URL de la pieza en la nube (Google Drive, Dropbox, etc.):",
            "https://",
            false,
            false
        );
        
        this.nota.piezaNube = url || "";
        return url || "";
    }
    
    async getUrlCanva(): Promise<string> {
        const url = await this.prompt(
            "URL del diseño en Canva:",
            "https://",
            false,
            false
        );
        
        this.nota.urlCanva = url || "";
        return url || "";
    }
    
    async getHits(): Promise<number> {
        // Implementamos un selector numérico tipo spinner
        const spinnerModal = new SpinnerModal(this.plugin.app, 1, 1, 1000);
        const hits = await spinnerModal.openAndAwaitSelection();
        
        if (hits === null || hits === undefined) {
            // Valor por defecto
            this.nota.hits = 1;
            return 1;
        }
        
        this.nota.hits = hits;
        return hits;
    }
    
    async getPedidosAlCliente(): Promise<{ pedidos: string, pendientes: boolean }> {
        // Implementamos un modal personalizado con textarea y checkbox
        const pedidosModal = new PedidosClienteModal(this.plugin.app);
        const resultado = await pedidosModal.openAndAwaitSelection();
        
        if (!resultado) {
            this.nota.pedidosAlCliente = "";
            this.nota.pendientesCliente = false;
            return { pedidos: "", pendientes: false };
        }
        
        this.nota.pedidosAlCliente = resultado.pedidos;
        this.nota.pendientesCliente = resultado.pendientes;
        return resultado;
    }
    
    async getAliases(): Promise<string[]> {
        const aliases = [];
        
        // Formato: EMkt-id
        aliases.push(`EMkt-${this.nota.id}`);
        
        // Formato: EMkt-Nombre
        aliases.push(`EMkt-${this.nota.titulo}`);
        
        this.nota.aliases = aliases;
        return aliases;
    }
    
// Implementación de getRename para la estructura de carpetas basada en trimestres

async getRename(): Promise<string> {
    // Crear la estructura de carpetas por trimestre
    const folderBase = `${this.infoSubsistema.folder}`;
    const folderTrimestre = `${folderBase}/${this.nota.trimestre}`;
    
    // Asegurar que las carpetas existan
    await FieldHandlerUtils.crearCarpeta(folderBase);
    await FieldHandlerUtils.crearCarpeta(folderTrimestre);
    
    // Ruta completa del archivo
    const newName = `${folderTrimestre}/${this.nota.titulo}.md`;
    
    const file = this.tp.file.config.target_file;
    const existe = app.vault.getAbstractFileByPath(newName);
    
    try {
        if (existe instanceof TFile) {
            const nombreFile = newName.split("/");
            const borrar = await this.suggester(
                ["Sobreescribir archivo actual", "Detener creación del archivo"],
                [true, false],
                true,
                `¿${nombreFile.pop()} ya existe. ¿Qué deseas hacer?`
            );
            
            if (borrar) {
                await app.vault.delete(existe);
                if (file instanceof TFile) {
                    await app.vault.rename(file, newName);
                    console.log("Archivo renombrado con éxito.");
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
                return newName;
            }
        }
    } catch (error) {
        console.error("Error al cambiar el nombre", error);
        throw error;
    }
}
}