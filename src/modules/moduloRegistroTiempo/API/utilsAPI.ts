import { App, TFile, TFolder, Modal, FuzzySuggestModal, FuzzyMatch, Notice } from "obsidian";
import {SeleccionModal} from "../../modales/seleccionModal"
import {menuOtro} from './menuOtro'

export class utilsAPI {
    private menuOtro: menuOtro;
    plugin: Plugin;

    constructor(plugin: Plugin) {
      this.plugin = plugin;
      this.menuOtro = new menuOtro(plugin);
    }

    async buscarRegistrosActivos(app: App, registro: any): Promise<TFile | null> {
    
    const files = app.vault.getMarkdownFiles();
     
     for (let file of files) {
         if (file.path.startsWith(registro.folder)) {
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
    async crearObjetoRegistro(plugin: Plugin) {
        
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
        const registrosExistentes = files.filter((file: { path: string; }) => file.path.startsWith(folder));
        
        // Usa metadataCache para buscar los IDs en el frontmatter
        registrosExistentes.forEach((file: any) => {
            const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata && metadata.id && !isNaN(metadata.id)) {
                const id = parseInt(metadata.id);
                if (id > maxId) maxId = id;
            }
        });

        // El próximo ID disponible
        const nextId = maxId + 1;

        // Formatear la fecha actual
        const fechaCompleta = this.formatearFecha(new Date());

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

    formatearFecha(fecha: Date): string {
        const offset = fecha.getTimezoneOffset() * 60000;
        const fechaLocal = new Date(fecha.getTime() - offset);
        const fechaFormato = fechaLocal.toISOString().split('T')[0];
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaSemana = dias[fecha.getDay()];
        const horaFormato = fecha.toTimeString().split(' ')[0].substring(0, 5);
        return `${fechaFormato} ${diaSemana} ${horaFormato}`;
    }

async verificarTareasActivas(registro: any, app: App): Promise<void> {
    
    const files = app.vault.getMarkdownFiles();
    const tareasActivas = [];

    for (let file of files) {
        if (file.path.startsWith(registro.folder)) {
            const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata?.estado === "🟢") {
                tareasActivas.push({ file, titulo: metadata.titulo, aliases: metadata.aliases || file.basename });
            }
        }
    }

    if (tareasActivas.length === 1) {
        const tareaActiva = tareasActivas[0];
        const deseaDetener = await this.mostrarSugerencia(`La tarea ${tareaActiva.aliases} está corriendo. ¿Desea detenerla?`);
        debugger
        if (deseaDetener === undefined) {
            new Notice(`Creación de registro cancelado por el usuario.`);
            registro.detener = true;
            return;
        }
        
        if (deseaDetener) {
            await this.detenerTarea(tareaActiva, app);
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

    mostrarSugerencia(mensaje: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let seleccionado = false; // Indica si se ha hecho una selección
    
            const modal = new Modal(app);
            modal.contentEl.createEl('h1', { text: mensaje });
    
            // Crear contenedor para botones
            const buttonsContainer = modal.contentEl.createEl('div');
    
            // Función auxiliar para manejar selecciones y cerrar el modal adecuadamente
            const hacerSeleccion = (seleccion: boolean) => {
                seleccionado = true; // Marcar que se ha hecho una selección
                modal.close(); // Cerrar el modal
                resolve(seleccion); // Resolver la promesa con la selección
            };
    
            // Botón Sí
            const yesButton = buttonsContainer.createEl('button', {
                text: 'Sí',
            });
            yesButton.addEventListener('click', () => hacerSeleccion(true));
    
            // Botón No
            const noButton = buttonsContainer.createEl('button', {
                text: 'No',
            });
            noButton.addEventListener('click', () => hacerSeleccion(false));
    
            modal.onClose = () => {
                if (!seleccionado) {
                    // Si el modal se cierra sin que se haya hecho una selección, rechazar la promesa
                    reject(new Error("Modal cerrado sin selección"));
                }
            };
    
            // Agregar escuchas de eventos de teclado para permitir la navegación con el teclado
            modal.contentEl.addEventListener('keydown', (e: { key: any; }) => {
                switch (e.key) {
                    case 'ArrowLeft':
                        yesButton.focus();
                        break;
                    case 'ArrowRight':
                        noButton.focus();
                        break;
                    case 'Enter':
                        // Simula clic en el botón enfocado
                        document.activeElement?.click();
                        break;
                }
            });
    
            // Enfocar inicialmente el botón 'Sí' para permitir la navegación con teclado desde el inicio
            yesButton.focus();
    
            modal.open();
        });
    }
    
    

    async definirTipoRegistro(registro: any, app: App) {
        const totTareas = await this.encontrarTareasPendientes(app); // Paso `app` como argumento
        
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
                    
                    await this.elegirTareaParaRegistro(app, registro, totTareas);
                    break;
                default:
                    // Si el usuario elige "Otro" o cualquier otra opción.
                    let respuesta = await this.menuOtro.menuOtro(app, registro);
                    debugger
                    Object.assign(registro, respuesta); // titulo, siAsunto, nombre
                    break;
                    }
        } catch (error) {
            console.error("Error o modal cerrado sin selección:", error);
            // Manejo de errores o cierre del modal sin selección.
            // Por ejemplo, podrías establecer un valor predeterminado para registro.detener aquí.
        }
    }


    async encontrarTareasPendientes(app: App): Promise<{ tarea: string; archivo: TFile }[]> {
        let tareasPendientes: { tarea: string; archivo: TFile }[] = [];
        const archivos = app.vault.getMarkdownFiles();
        const archivosRelevantes = archivos.filter((archivo: { path: string; }) => !archivo.path.includes("Plantillas"));
    
        for (const archivo of archivosRelevantes) {
            const contenido = await app.vault.read(archivo);
            const coincidencias = contenido.match(/^ *- \[\/\] .*/gm) || [];
    
            // Para cada tarea encontrada, crea un objeto con la tarea limpia y el archivo actual, y lo agrega al arreglo
            const tareasConArchivo = coincidencias.map((tarea: string) => {      
                return { tarea: tarea.trim(), archivo: archivo };
            });
            tareasPendientes = tareasPendientes.concat(tareasConArchivo);
        }
        return tareasPendientes;
    }
    

    async elegirTareaParaRegistro(app: App, registro: any, tareasPendientes: any) {
        const placeholder = "Elige la tarea que vas a registrar.";
    
        // Map para extraer y limpiar solo las tareas
        let promesasLimpias = tareasPendientes.map((tareaObj: { tarea: string; }) => this.limpiarTextoTarea(tareaObj.tarea));
    
        try {
            // Espera a que todas las promesas en promesasLimpias se resuelvan
            const tareasLimpias = await Promise.all(promesasLimpias);
    
            // Reconstruir los objetos con las tareas limpias manteniendo la referencia al archivo
            const tareasLimpiasConArchivo = tareasPendientes.map((tareaObj: { archivo: any; }, index: string | number) => {
                return {
                    tarea: tareasLimpias[index], // Tarea limpia
                    archivo: tareaObj.archivo // Referencia al archivo original
                };
            });
            
            // Estas dos líneas me generan un arreglo de indices para suministrar el valor al modal. 
            const longitud = tareasLimpiasConArchivo.length;
            const arregloDeIndices = Array.from({ length: longitud }, (_, indice) => indice);

            const modalMenu = new SeleccionModal(app, tareasLimpiasConArchivo.map((b: { tarea: any; }) => b.tarea), arregloDeIndices, placeholder);
            try {
                // Espera a que el usuario haga una selección en el modal
                const selectedIndex = await modalMenu.openAndAwaitSelection();
    
                // Asegúrate de que la selección corresponda al índice correcto en tareasLimpiasConArchivo
                const seleccion = tareasLimpiasConArchivo[selectedIndex];
                registro.titulo = seleccion.tarea; // o cómo hayas decidido manejar la selección limpia
                registro.nombre = seleccion.archivo.basename;
                registro.siAsunto = true;
            } catch (error) {
                // Este bloque catch maneja errores o cierre del modal sin selección
                registro.detener = true;
                console.error("Error o modal cerrado sin selección:", error);
            }
    
        } catch (error) {
            // Este bloque catch maneja errores en la limpieza de tareas
            console.error("Hubo un error al limpiar las tareas:", error);
        }
    }
    
    limpiarTextoTarea(titulo: string): Promise<string> {
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
    
    
    async construirNombreyAlias(registro: any, app:App){
        
        let nombreBase = `${registro.folder}/RT - ${registro.id}`;

        let aliasLimpio = this.limpiarAlias(registro.titulo);
        aliasLimpio = aliasLimpio.length > 195 ? aliasLimpio.slice(0, 195) : aliasLimpio;

        const archivos = app.vault.getFiles();
        let registrosConMismoTitulo = [];

        for (const archivo of archivos) {
            
            if (archivo.path.startsWith(registro.folder)) {
                
                // Usamos metadataCache para obtener los metadatos de la nota
                const metadatos = app.metadataCache.getFileCache(archivo);
                // Aseguramos que metadatos.frontmatter contenga los campos necesarios
                if (metadatos && metadatos.frontmatter && metadatos.frontmatter.titulo === registro.titulo) {
                    const idSec = metadatos.frontmatter.idSec;
                    if (idSec !== undefined) {
                        registrosConMismoTitulo.push({ archivo, idSec });
                    }
                }
            }
        }
        debugger
        // Ordenamos los resultados por idSec en orden descendente
        registrosConMismoTitulo.sort((b) => b.idSec, "desc");


    registro.idSec = registrosConMismoTitulo.length > 0 ? (parseInt(registrosConMismoTitulo[0].idSec) + 1) : 1;
        
    if (registro.idSec > 1) {
        aliasLimpio += ` - ${registro.idSec}`;
    }

    // Inicializa registro.aliases como un arreglo vacío
    registro.aliases = [];

    // Agrega el alias limpio con el prefijo
    registro.aliases.push(`RT - ${aliasLimpio}`);

    if (registro.tipoRegistro === "Nota") {
        
        // Obtén el archivo activo
        const archivoActivo = app.workspace.getActiveFile();
        if (!archivoActivo) return; // Asegúrate de que haya un archivo activo

        // Obtén los metadatos del archivo activo
        const metadatosActivo = app.metadataCache.getFileCache(archivoActivo);

        // Extrae aliases del frontmatter, asegurándote de que existan y accediendo correctamente
        const aliasesActivo = metadatosActivo && metadatosActivo.frontmatter ? metadatosActivo.frontmatter.aliases : undefined;

        // Verifica si aliasesActivo existe y determina si es un arreglo o una cadena
        if (aliasesActivo) {
            const additionalAliases = Array.isArray(aliasesActivo)
                ? aliasesActivo
                : [aliasesActivo]; // Convierte a arreglo si es una cadena

            // Añade cada alias adicional con el prefijo "RT - "
            additionalAliases.forEach(alias => {
                registro.aliases.push(`RT - ${alias}`);
            });
        }

    }

    registro.nameFile = nombreBase;
    }
        
    limpiarAlias(titulo:string) {
        // Reemplaza caracteres no permitidos en nombres de archivo con un guion bajo o algún otro caracter seguro.
        const caracteresNoPermitidos = /[<>:"\/\\|?*\x00-\x1F]/g;
        let tituloLimpio = titulo.replace(caracteresNoPermitidos, '_');
    
        // Reemplaza espacios múltiples por un único espacio para evitar nombres de archivo excesivamente largos.
        tituloLimpio = tituloLimpio.replace(/\s+/g, ' ');
    
        return tituloLimpio.trim();
    }

    async detenerTarea(tareaActiva: { file: TFile; titulo: string }, app: App): Promise<void> {
    // Aquí iría la lógica para marcar la tarea como no activa, probablemente actualizando su frontmatter
    console.log(`Deteniendo la tarea: ${tareaActiva.titulo}`);
    // Ejemplo de cómo se podría actualizar el frontmatter para detener la tarea
    // Esta es una simplificación; la implementación real dependería de cómo estés manejando el contenido del archivo
    const fileContents = await app.vault.read(tareaActiva.file);
    const newContents = fileContents.replace('estado: 🟢', 'estado: 🔵'); // Cambiar a estado no activo
    await app.vault.modify(tareaActiva.file, newContents);
    }
                
}