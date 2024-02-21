import { App, TFile, Modal, FuzzySuggestModal, FuzzyMatch, Notice } from "obsidian";
import {SeleccionModal} from "../modales/seleccionModal"

export async function cumpleCondicion(app: App): Promise<boolean> {
    const files = app.vault.getMarkdownFiles();
    
    for (let file of files) {
        if (file.path.startsWith("Estructura/Registro Tiempo")) {
            // Obtener los metadatos del archivo desde metadataCache
            const metadata = app.metadataCache.getFileCache(file);
            
            // Verificar si el frontmatter contiene el campo "estado" con el valor "🟢"
            if (metadata?.frontmatter?.estado === "🟢") {
                return true;
            }
        }
    }
    
    return false;
}

 export async function buscarRegistrosActivos(app: App): Promise<TFile | null> {
    
    const files = app.vault.getMarkdownFiles();
     
     for (let file of files) {
         if (file.path.startsWith("Subsistemas/Registro Tiempo/Registros")) {
             // Obtener los metadatos del archivo desde metadataCache
             const metadata = app.metadataCache.getFileCache(file);
             
             // Verificar si el frontmatter contiene el campo "estado" con el valor "🟢"
             if (metadata?.frontmatter?.estado === "🟢") {
                
                return file;
             }
         }
     }
     
     return ;
 }


 // Suponemos que esta función se ubicará en algún lugar donde pueda acceder a `app` de Obsidian.
export async function crearObjetoRegistro(plugin) {
    
    const activo = plugin.app.workspace.getActiveFile();
    if (!activo) {
        console.error("No hay un archivo activo para la creación de registro de tiempo. Se descarta para la creación de registro de tiempo.");
        return null;
    }
    
    const folder = plugin.settings.folder_RegistroTiempo
    const indice = plugin.settings.indice_RegistroTiempo
    
    let maxId = 0;

    // Obtén todos los archivos Markdown
    const files = app.vault.getMarkdownFiles();

    // Filtra por los archivos en la carpeta deseada
    const registrosExistentes = files.filter(file => file.path.startsWith(folder));
     
    // Usa metadataCache para buscar los IDs en el frontmatter
     registrosExistentes.forEach(file => {
        const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
        if (metadata && metadata.id && !isNaN(metadata.id)) {
            const id = parseInt(metadata.id);
            if (id > maxId) maxId = id;
        }
    });

    // El próximo ID disponible
    const nextId = maxId + 1;

    // Formatear la fecha actual
    const fechaCompleta = formatearFecha(new Date());

    return {
        activo,
        nombre: activo.basename,
        folder,
        indice,
        id: nextId,
        fecha: fechaCompleta,
        indice_DVJS: `"${indice}"`,
    };
}

function formatearFecha(fecha: Date): string {
    const offset = fecha.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(fecha.getTime() - offset);
    const fechaFormato = fechaLocal.toISOString().split('T')[0];
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = dias[fecha.getDay()];
    const horaFormato = fecha.toTimeString().split(' ')[0].substring(0, 5);
    return `${fechaFormato} ${diaSemana} ${horaFormato}`;
}

export async function verificarTareasActivas(registro: any, app: App): Promise<void> {
    
    const files = app.vault.getMarkdownFiles();
    const tareasActivas = [];

    for (let file of files) {
        if (file.path.startsWith(registro.folder)) {
            const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata?.estado === "🟢") {
                tareasActivas.push({ file, aliases: metadata.aliases || file.basename });
            }
        }
    }

    if (tareasActivas.length === 1) {
        const tareaActiva = tareasActivas[0];
        debugger
        const deseaDetener = await mostrarSugerencia(`La tarea ${tareaActiva.aliases} está corriendo. ¿Desea detenerla?`);
        
        if (deseaDetener === undefined) {
            new Notice(`Creación de registro cancelado por el usuario.`);
            registro.detener = true;
            return;
        }
        
        if (deseaDetener) {
            await detenerTarea(tareaActiva, app);
            registro.detener = false;
        } else {
            new Notice(`La tarea ${tareaActiva.aliases} seguirá registrándose.`);
            registro.detener = true;
            return;
        }
    } else if (tareasActivas.length > 1) {
        new Notice("Hay un error con la cantidad de tareas corriendo en este momento.");
        registro.detener = true;
    } else {
        console.log("No hay más tareas corriendo.");
        registro.detener = false;
    }
}

function mostrarSugerencia(mensaje: string): Promise<boolean | undefined> {
    return new Promise((resolve) => {
        let seleccionado = false; // Rastrea si se ha hecho una selección

        const modal = new Modal(app);
        modal.contentEl.createEl('h1', { text: mensaje });

        // Crear contenedor para botones
        const buttonsContainer = modal.contentEl.createEl('div');

        // Botón Sí
        const yesButton = buttonsContainer.createEl('button', {
            text: 'Sí',
        });
        yesButton.addEventListener('click', () => {
            seleccionado = true; // Actualiza que se ha hecho una selección
            modal.close();
            resolve(true);
        });

        // Botón No
        const noButton = buttonsContainer.createEl('button', {
            text: 'No',
        });
        noButton.addEventListener('click', () => {
            seleccionado = true; // Actualiza que se ha hecho una selección
            modal.close();
            resolve(false);
        });

        modal.onClose = () => {
            if (!seleccionado) {
                // Si se cierra el modal sin hacer una selección, resuelve con undefined
                resolve(undefined);
            }
        };

        modal.open();
    });
}


export async function definirTipoRegistro(registro: any, app: App) {
    const totTareas = await encontrarTareasPendientes(app); // Paso `app` como argumento
    let opcionesTitulo, valoresOpcion;
    if (totTareas.length > 0) {
        opcionesTitulo = [registro.nombre, "Alguna tarea en Ejecución", "Otro"];
        valoresOpcion = ["Nota", "Tarea", "Otro"];
    } else {
        opcionesTitulo = [registro.nombre, "Otro"];
        valoresOpcion = ["Nota", "Otro"];
    }
    const placeholder = "¿Sobre qué es el registro de tiempo?";
    
    const modalMenu1 = new SeleccionModal(app, opcionesTitulo, valoresOpcion, placeholder);
    
    // Espera asincrónicamente la selección del usuario antes de continuar.
    try {
        const selection = await modalMenu1.openAndAwaitSelection();
        registro.tipoRegistro = selection;
        // Procesar la selección del usuario aquí.
        // El código subsiguiente depende del tipo de registro seleccionado.
        switch(registro.tipoRegistro) {
            case "Nota":
                registro.titulo = registro.nombre; // El título es el nombre de la nota actual.
                registro.siAsunto = true;
                break;
            case "Tarea":
                // Lógica para permitir al usuario elegir una tarea específica.
                await elegirTareaParaRegistro(app, registro, totTareas);
                break;
            default:
                // Si el usuario elige "Otro" o cualquier otra opción.
                registro.siAsunto = registro.tituloDefinido !== "Otro"; // Asume que si no es "Otro", es un asunto específico.
                // Lógica adicional para manejar "Otro" o casos no especificados.
                break;
        }
    } catch (error) {
        console.error("Error o modal cerrado sin selección:", error);
        // Manejo de errores o cierre del modal sin selección.
        // Por ejemplo, podrías establecer un valor predeterminado para registro.detener aquí.
    }
}


    async function encontrarTareasPendientes(app: App): Promise<string[]> {
        let tareasPendientes: string[] = [];
        const archivos = app.vault.getMarkdownFiles();
        const archivosRelevantes = archivos.filter(archivo => !archivo.path.includes("Plantillas"));
    
        for (const archivo of archivosRelevantes) {
            const contenido = await app.vault.read(archivo);
            const coincidencias = contenido.match(/^ *- \[\/\] .*/gm) || [];
    
            // Elimina los espacios al inicio de cada coincidencia antes de agregarla al arreglo
            const tareasLimpias = coincidencias.map(tarea => tarea.trim());
            tareasPendientes = tareasPendientes.concat(tareasLimpias);
        }
        return tareasPendientes;
    }

    async function elegirTareaParaRegistro(app: App, registro: any, tareasPendientes: string[]) {
        
        const placeholder = "Elige la tarea que vas a registrar.";
            
        // Crear un arreglo de promesas usando map para pasar cada tarea por limpiarTextoTarea
        let promesasLimpias = tareasPendientes.map(tarea => limpiarTextoTarea(tarea));

        // Usar Promise.all para esperar a que todas las tareas sean procesadas
        Promise.all(promesasLimpias).then(tareasLimpias => {
            // En este punto, tareasLimpias es un arreglo con todas las tareas después de ser limpiadas
            // Ahora puedes usar tareasLimpias en otra función
               
            const modalMenu = new SeleccionModal(app, tareasLimpias, tareasLimpias, placeholder);
            modalMenu.openAndAwaitSelection().then(selection => {
                debugger
                registro.titulo = limpiarTextoTarea (selection)
                //new Notice(selection);
            }).catch(error => {
                registro.detener = true;
                console.error("Error o modal cerrado sin selección:", error);
            });
        }).catch(error => {
            // Manejar posibles errores
            console.error("Hubo un error al limpiar las tareas:", error);
        });

    }

    function limpiarTextoTarea(titulo: string): Promise<string> {
        return new Promise(resolve => {
            // Elimina todo después del primer salto de línea.
            let textoLimpio = titulo.split('\n')[0];
        
            // Elimina los tags de estilo Markdown.
            textoLimpio = textoLimpio.replace(/#[\w-/]+/g, '');
        
            // Elimina los campos de estilo Dataview.
            textoLimpio = textoLimpio.replace(/\[\w+::[^\]]+\]/g, '');
        
            // Elimina el patrón " - [/]" al inicio de la cadena, incluyendo posibles espacios antes o después.
            textoLimpio = textoLimpio.replace(/^\s*-\s*\[\/\]\s*/, '');

            // Reemplaza caracteres no permitidos en nombres de archivo con un guion bajo o algún otro caracter seguro.    
            const caracteresNoPermitidos = /[<>:"\/\\|?*\x00-\x1F]/g;
            textoLimpio = textoLimpio.replace(caracteresNoPermitidos, '_');
        
            // Reemplaza espacios múltiples por un único espacio para evitar nombres de archivo excesivamente largos.
            textoLimpio = textoLimpio.replace(/\s+/g, ' ');
        
            // Retorna el texto limpio, ahora envuelto en una promesa.
            resolve(textoLimpio.trim());
        });
    }
    
    
        

async function detenerTarea(tareaActiva: { file: TFile; titulo: string }, app: App): Promise<void> {
    // Aquí iría la lógica para marcar la tarea como no activa, probablemente actualizando su frontmatter
    console.log(`Deteniendo la tarea: ${tareaActiva.titulo}`);
    // Ejemplo de cómo se podría actualizar el frontmatter para detener la tarea
    // Esta es una simplificación; la implementación real dependería de cómo estés manejando el contenido del archivo
    const fileContents = await app.vault.read(tareaActiva.file);
    const newContents = fileContents.replace('estado: 🟢', 'estado: 🔵'); // Cambiar a estado no activo
    await app.vault.modify(tareaActiva.file, newContents);
}



 
