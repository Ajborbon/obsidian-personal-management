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
    
      // Sobrescribimos el método getAsunto para manejar NotionID
      async getAsunto(): Promise<{ siAsunto: boolean, nombre: string[] }> { 
        let padres = [];
        let activo = app.workspace.getActiveFile();
        let siAsunto = false;
        let nombre = "";
        let nota;
        
        if (activo != null) {
            nombre = activo.basename;
            nota = app.metadataCache.getFileCache(activo);
            // Asegurar que nota.frontmatter existe y asignar un objeto vacío a file
            nota.frontmatter = nota.frontmatter || {};
            nota.frontmatter.file = {};
            Object.assign(nota.frontmatter.file, activo);
            
            padres.unshift(nombre); // Añade el nombre al inicio del arreglo, desplazando los demás elementos
            siAsunto = await this.suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
            
            if (siAsunto) {
                this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                
                // Verificamos si existe un campo que comience con "NotionID-" en el frontmatter
                let notionID = null;
                
                for (const key in nota.frontmatter) {
                    if (key.startsWith("NotionID-")) {
                        notionID = nota.frontmatter[key];
                        console.log(`Encontrado NotionID: ${notionID} con clave: ${key}`);
                        break;
                    }
                }
                
                // Si encontramos un NotionID, lo guardamos en el campo proyecto
                if (notionID) {
                    this.nota.proyecto = [notionID];
                    console.log(`Asignado NotionID al proyecto: ${notionID}`);
                }
                
                let nivel;
                switch (nota?.frontmatter?.type) { // La nota activa es una:
                    default:
                    case "PGTD":
                    case "PQ":
                        // VERIFICACION DE PROYECTOS DE Q Y PROYECTO GTD
                        if (nota.frontmatter?.type === "PQ") {
                            // CUANDO LA NOTA ACTIVA ES UN PQ.
                            this.nota.proyectoQ = nombre;
                            // VERIFICACION DE PROYECTOSGTD
                            // Inicializamos this.nota.proyectoGTD con un valor predeterminado de cadena vacía
                            this.nota.proyectoGTD = "";
                            // Verificamos si nota.proyectoGTD existe y es un arreglo
                            if (Array.isArray(nota.frontmatter.proyectoGTD)) {
                                // Si es un arreglo, iteramos sobre cada elemento
                                this.nota.proyectoGTD = nota.frontmatter.proyectoGTD.map(elemento =>
                                    elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                            } else if (nota.frontmatter.proyectoGTD) {
                                // Si existe pero no es un arreglo, aplicamos el regex directamente
                                this.nota.proyectoGTD = nota.frontmatter.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '');
                            }
                            // Si nota.proyectoGTD no existe, this.nota.proyectoGTD ya está establecido en "" por defecto


                            // Obtener ProyectoQ y Proyecto GTD cuando la nota es ProyectoGTD.
                        } else if (nota.frontmatter?.type === "PGTD") {

                            // CUANDO LA NOTA ACTIVA ES UN GTD.
                            // VERIFICACION DE PROYECTOSGTD
                            this.nota.proyectoGTD = [nombre];

                            if (Array.isArray(nota.frontmatter.proyectoGTD)) {
                                // Si es un arreglo, utilizamos concat para añadir los elementos ya procesados con el regex al arreglo this.nota.proyectoGTD
                                this.nota.proyectoGTD = this.nota.proyectoGTD.concat(nota.frontmatter.proyectoGTD.map(elemento =>
                                    elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                            } else if (nota.frontmatter.proyectoGTD) {
                                // Si existe pero no es un arreglo, aplicamos el regex directamente y usamos push para agregarlo a this.nota.proyectoGTD
                                this.nota.proyectoGTD.push(nota.frontmatter.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, ''));
                            }

                            // Si nota.proyectoGTD no existe, this.nota.proyectoGTD ya está establecido en "" por defecto
                            this.nota.proyectoQ = "";
                            if (Array.isArray(nota.frontmatter.proyectoQ)) {
                                // Si es un arreglo, iteramos sobre cada elemento
                                this.nota.proyectoQ = nota.frontmatter.proyectoQ.map(elemento =>
                                    elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                            } else if (nota.frontmatter.proyectoQ) {
                                // Si existe pero no es un arreglo, aplicamos el regex directamente
                                this.nota.proyectoQ = nota.frontmatter.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '');
                            }


                        }
                        // Obtener ProyectoQ y Proyecto GTD cuando la nota es otra cosa que no es proyecto
                        else {

                            this.nota.proyectoQ = "";
                            if (Array.isArray(nota?.frontmatter?.proyectoQ)) {
                                // Si es un arreglo, iteramos sobre cada elemento
                                this.nota.proyectoQ = nota.frontmatter.proyectoQ.map(elemento =>
                                    elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                            } else if (nota?.frontmatter?.proyectoQ) {
                                // Si existe pero no es un arreglo, aplicamos el regex directamente
                                this.nota.proyectoQ = nota.frontmatter.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '');
                            }

                            this.nota.proyectoGTD = "";
                            // Verificamos si nota.proyectoGTD existe y es un arreglo
                            if (Array.isArray(nota?.frontmatter?.proyectoGTD)) {
                                // Si es un arreglo, iteramos sobre cada elemento
                                this.nota.proyectoGTD = nota.frontmatter.proyectoGTD.map(elemento =>
                                    elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                            } else if (nota?.frontmatter?.proyectoGTD) {
                                // Si existe pero no es un arreglo, aplicamos el regex directamente
                                this.nota.proyectoGTD = nota.frontmatter.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '');
                            }

                        }
                        // Verificamos areaInteres 
                        this.nota.areaInteres = [];
                        if (Array.isArray(nota?.frontmatter?.areaInteres)) {
                            // Si es un arreglo, iteramos sobre cada elemento (excluyendo el primer elemento ya agregado que es nota.titulo)
                            // y aplicamos el regex a cada elemento. Luego concatenamos con el array existente.
                            this.nota.areaInteres = this.nota.areaInteres.concat(nota.frontmatter.areaInteres.map(elemento =>
                                elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                        } else {
                            // Si no es un arreglo, revisamos si nota.frontmatter.areaInteres existe
                            if (nota?.frontmatter?.areaInteres) {
                                // Si existe, aplicamos el regex y lo añadimos como segundo elemento
                                this.nota.areaInteres.push(nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                            }
                        }
                        // Verificamos AreaVida
                        this.nota.areaVida = "";
                        if (nota?.frontmatter?.areaVida) {
                            if (Array.isArray(nota.frontmatter.areaVida)) {
                                // Es un arreglo, usa el primer elemento
                                this.nota.areaVida = nota.frontmatter.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
                            } else if (typeof nota.frontmatter.areaVida === 'string') {
                                // Es un string
                                this.nota.areaVida = nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                            }
                        } else {
                            // No está definido o está vacío
                            this.nota.areaVida = "No es de ningún Area de Vida";
                        }

                        // DEFINIR NIVELP
                        // Comprueba si nivelAI existe y no es NaN después de intentar convertirlo a entero

                        if (!isNaN(parseInt(nota?.frontmatter?.nivelP))) {
                            nivel = parseInt(nota.frontmatter.nivelP) + 1;
                        } else {
                            // Si nivelAI no existe o su conversión a entero resulta en NaN, establece nivel a 0
                            nivel = 0;
                        }
                        this.nota.nivelP = nivel;

                        break; // PGTD y PQ
                    case "AI":
                        // VERIFICACION DE AREA DE INTERES
                        if (nota?.frontmatter?.type === "AI") {
                            this.nota.areaInteres = [nota.frontmatter.file.basename];
                            // Inicializamos this.nota.areaInteres con nota.titulo como el primer elemento.
                            // Este solo aplica para cuando estoy construyendo desde Area de Interes otra Area de Interes.
                        }
                        // Verificamos si nota.areaInteres es un arreglo
                        if (Array.isArray(nota.frontmatter?.areaInteres)) {
                            // Si es un arreglo, iteramos sobre cada elemento (excluyendo el primer elemento ya agregado que es nota.titulo)
                            // y aplicamos el regex a cada elemento. Luego concatenamos con el array existente.
                            this.nota.areaInteres = this.nota.areaInteres.concat(nota.frontmatter.areaInteres.map(elemento =>
                                elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                        } else {
                            // Si no es un arreglo, revisamos si nota.frontmatter.areaInteres existe
                            if (nota?.frontmatter.areaInteres) {
                                // Si existe, aplicamos el regex y lo añadimos como segundo elemento
                                this.nota.areaInteres.push(nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                            } else {
                                // Si no es arreglo ni string, areaInteres es el area interes que está en titulo.   
                            }
                            // Si nota.frontmatter.areaInteres no existe, this.nota.areaInteres ya tendrá nota.titulo como su único elemento
                        }
                    case "AV":
                        // VERIFICACION DE AREA DE VIDA
                        if (nota?.frontmatter?.areaVida) {
                            if (Array.isArray(nota.frontmatter.areaVida)) {
                                // Es un arreglo, usa el primer elemento
                                this.nota.areaVida = nota.frontmatter.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
                            } else if (typeof nota.frontmatter.areaVida === 'string') {
                                // Es un string
                                this.nota.areaVida = nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                            }
                        } else {
                            // No está definido o está vacío
                            this.nota.areaVida = "No es de ningún Area de Vida";
                        }
                        // poniendo si Asunto en false para las notas estructura AI y AV. 
                        if (nota?.frontmatter?.type === "AI" || nota?.frontmatter?.type === "AV") {
                            siAsunto = false;
                        }

                        // DEFINIR NIVELP
                        // Comprueba si nivelAI existe y no es NaN después de intentar convertirlo a entero

                        if (!isNaN(parseInt(nota.frontmatter?.nivelP))) {
                            nivel = parseInt(nota.frontmatter.nivelP) + 1;
                        } else {
                            // Si nivelAI no existe o su conversión a entero resulta en NaN, establece nivel a 0
                            nivel = 0;
                        }
                        this.nota.nivelP = nivel;
                        break;
                }
            } else { // activa no es origen de Creando RR - PGTD - PQ  if(siAsunto)

            }
        } else { // activo == null
            siAsunto = false;
        }
        return { siAsunto, nombre: padres }
    }
    
    async getTrimestre(): Promise<string> {
        // Verificar si es una continuación desde una Campaña
        const activo = app.workspace.getActiveFile();
        debugger;
        if (activo) {
            const metadata = app.metadataCache.getFileCache(activo)?.frontmatter;
            
            if (metadata && metadata.type === 'Cp') {
                const esContinuacion = await this.suggester(
                    ["Sí", "No"],
                    [true, false],
                    false,
                    `¿Este entregable es parte de la campaña ${activo.basename}?`
                );
                debugger;
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
        
        this.nota.trimestre = `[[${trimestre}]]`;
        return `[[${trimestre}]]`;
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
            "Diseñando - En Desarrollo",
            "Revisión Interna",
            "Revisión Cliente",
            "Programación Parrilla",
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
    
    // Método para determinar si el entregable es facturable basado en quién lo realizará
    async getFacturable(): Promise<boolean> {
        // Opciones disponibles
        const opciones = ["Un tercero", "Andrés Julián Borbón"];
        const valores = [false, true];
        
        // Usamos el método suggester nativo, que ya maneja la navegación por teclado
        const realizador = await this.suggester(
            opciones,
            valores,
            false, // No es multiselección
            "¿Quién realizará este entregable?"
        );
        
        // Si el usuario cancela, asumimos "Un tercero" (no facturable)
        if (realizador === null) {
            this.nota.facturable = false;
            return false;
        }
        
        this.nota.facturable = realizador;
        return realizador;
    }
    async getAliases(): Promise<string[]> {
        const aliases = [];
        
          
        // Formato: Nombre
        aliases.push(`${this.nota.titulo}`);
       
        // Formato: EMkt-Nombre
        aliases.push(`EMkt-${this.nota.titulo}`);
       
         // Formato: EMkt-id
         aliases.push(`EMkt-${this.nota.id}`);
        
        this.nota.aliases = aliases;
        return aliases;
    }
    
// Implementación de getRename para la estructura de carpetas basada en trimestres

async getRename(): Promise<string> {
    // Crear la estructura de carpetas por trimestre
    const folderBase = `${this.infoSubsistema.folder}`;
    // Aplicar filtro para eliminar [[ y ]]
    const trimestreLimpio = this.nota.trimestre.replace(/\[\[|\]\]/g, '').trim();         
    const folderTrimestre = `${folderBase}/${trimestreLimpio}`;

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

                    // Abrir el archivo en una nueva pestaña
                    const newFile = app.vault.getAbstractFileByPath(newName);
                    if (newFile instanceof TFile) {
                        const leaf = app.workspace.getLeaf(true);
                        await leaf.openFile(newFile);
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

                // Abrir el archivo en una nueva pestaña
                const newFile = app.vault.getAbstractFileByPath(newName);
                if (newFile instanceof TFile) {
                    const leaf = app.workspace.getLeaf(true);
                    await leaf.openFile(newFile);
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