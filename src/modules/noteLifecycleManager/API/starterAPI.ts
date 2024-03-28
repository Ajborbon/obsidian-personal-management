//import {utilsAPI} from './utilsAPI'
import {TFile, TFolder, Plugin, Notice} from 'obsidian'
import { DateTime } from 'luxon';


export class starterAPI {
    //private utilsApi: utilsAPI;
    private plugin: Plugin;
    private infoSubsistema: object; // Asumiendo que es un string
    private tp: object;
    private nota: object;
    private pathCampos: string; 

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        // Inicializa folder e indice con valores predeterminados o lógica específica.
        this.infoSubsistema = {};
        this.nota = {};
        this.tp = this.getTp();
        this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
    }
    
    // Crear Nota desde template
    async createNote(subsistema: string) {
        try {
            debugger
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
    


    // crearNota -> Llenar los campos YAML del template.
    async fillNote(infoSubsistema: { folder: string | number; indice: string | number; }, campos: any) {
        this.nota = {};
        Object.assign(this.infoSubsistema, infoSubsistema); 
        if (this.infoSubsistema.defined){
        // infoSubsistema.folder e indice contienen la información de las carpetas
	        this.infoSubsistema.folder = this.plugin.settings[infoSubsistema.folder]
	        this.infoSubsistema.indice = this.plugin.settings[infoSubsistema.indice]
	        // nota ahora tiene toda la información de la plantilla
	        Object.assign(this.nota, infoSubsistema); // Nota es el objeto que se devolverá.
		}
		try {
			for (let campo of campos) {       
			// Usa el nombre del campo para construir el nombre de la función (p. ej., "getId")
				debugger;
                const functionName = `get${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
				// Verifica si existe una función con ese nombre.
				if (typeof this[functionName] === 'function') {
				// Llama a la función de manera dinámica y asigna el resultado al campo correspondiente de la nota.
					this.nota[campo] = await this[functionName]();
				} else {
					console.error(`La función ${functionName} no está definida.`);
				}
                } // Fin For 
            } catch (error) {
                console.error("No se pudo crear el objeto de registro.", error);
                new Notice("No se pudo crear el objeto de registro.");
                return null;
            }
        return this.nota; // Retorna el objeto nota con todas las propiedades agregadas.
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

    // Ejemplo de función getCampo simulada. Debes definir funciones similares para 'id', 'fecha', etc.
    async getId() {
        
        let maxId = 0;
        // Obtén todos los archivos Markdown
        const files = app.vault.getMarkdownFiles();
        let registrosExistentes = files.filter((file: { path: string; }) => file.path.startsWith(this.infoSubsistema.folder));
        // Filtra por los archivos en la carpeta deseada
        switch(this.infoSubsistema.type) {
            case "nAV":
            case "AV":    
                registrosExistentes.forEach((file: any) => {
                    const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                    if (metadata && metadata.id && !isNaN(metadata.id) && metadata.type && metadata.type === this.infoSubsistema.type) {
                        const id = parseInt(metadata.id);
                        if (id > maxId) maxId = id;
                    }
                });
            break;
            default:
                registrosExistentes.forEach((file: any) => {
                    const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                    if (metadata && metadata.id && !isNaN(metadata.id)) {
                        const id = parseInt(metadata.id);
                        if (id > maxId) maxId = id;
                    }
                });
            break;
        }
        
         

        // El próximo ID disponible
        const nextId = maxId + 1;
        //this.nota.id = nextId;
        return nextId;
    }
    
    async getFecha() {
        // Simulación de obtener un ID de manera asíncrona.
        return this.formatearFecha(new Date());
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

    async getSecId(){

    }
    
    async getTitulo(){
        let prompt = this.tp.system.static_functions.get("prompt");
        let titulo = await prompt(`Titulo de este(a) ${this.infoSubsistema.typeName}`, `${this.infoSubsistema.typeName} - ${this.nota.id}`, true)
	    // Verificar si el usuario presionó Esc.
        if (titulo === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        //this.nota.titulo = titulo;
        return titulo;
    }

    async getDescripcion(){
        let prompt = this.tp.system.static_functions.get("prompt");
        let descripcion;
        switch(this.infoSubsistema.type) {
            case "Ax":
                 descripcion = await prompt("¿Quieres agregar una descripción?", " " + `Esta anotación es sobre ${this.nota.titulo}`, false, true )
            break;
            case "AV":
                 descripcion = await prompt(`¿Quieres agregar una descripción sobre ${this.nota.titulo}?`, " ", false, true )
            break;
            case "AI":
                 descripcion = await prompt(`¿Quieres agregar una descripción sobre ${this.nota.titulo}?`, " ", false, true )
            break;
            case "PGTD":
                 descripcion = await prompt("¿Sobre que es este proyecto GTD?", " " + `Proyecto sobre `, false, true )
            break;
            default:
                descripcion = await prompt("¿Quieres agregar una descripción?", " " + `Esta nota es sobre ${this.nota.titulo}`, false, true )
            break;
        }

        
	    // Verificar si el usuario presionó Esc.
        if (descripcion === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        //this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getAliases(){
        let nota = {aliases: []}       
        switch(this.infoSubsistema.type) {
            case "Ax":
            case "PGTD":
                nota.aliases.push(`${this.nota.titulo}`)
                nota.aliases.push(`${this.infoSubsistema.type} - ${this.nota.titulo}`)
                break;
            case "AI":
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.titulo}`)
                if (this.nota.areaVida != "No es de ningún Area de Vida"){
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.areaVida}/${this.nota.titulo}`)
                }
                // 0 -> Nombre, 1 -> type + Nombre
                break;
            case "nAV":
                nota.aliases.push(`AV/${this.nota.areaVida}`)
                nota.aliases.push(`AV/${this.nota.grupo}/${this.nota.areaVida}`)
                break;   
            case "AV":
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.trimestre}/${this.nota.titulo}`)
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.grupo}/${this.nota.trimestre}/${this.nota.titulo}`)
                break;
            case "RR":
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.titulo}`)
                break;
            case "PQ":
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.trimestre}/${this.nota.titulo}`)
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.areaVida}/${this.nota.trimestre}/${this.nota.titulo}`)
                nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.trimestre}/${this.nota.areaVida}/${this.nota.titulo}`)
            break;    
            }

            return nota.aliases;
       
    }

    async getAsunto(){ // Funciona con frontmatter

        let suggester = this.tp.system.static_functions.get("suggester");
        let tipoSistema = this.infoSubsistema.type;
        let nombreSistema = this.infoSubsistema.typeName;
        let subsistemas, padres = [];
        let activo = app.workspace.getActiveFile();
        let siAsunto;
        let nombre = "";
        let nota;
        if (activo != null) {
            nombre = activo.basename;
            nota = app.metadataCache.getFileCache(activo);
            siAsunto = await suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
        
            if (siAsunto) {
                // En caso de que siAsunto sea true, desplaza los elementos del arreglo padre y añade activo.basename en la posición 0
                padres.unshift(nombre); // Añade el nombre al inicio del arreglo, desplazando los demás elementos
            
                switch(tipoSistema) {

                    case "RR":
                            //debugger;
                            switch (nota?.frontmatter?.type){
                                case "AV":
                                    
                                     // VERIFICACION DE AREA DE VIDA
                                     this.nota.areaVida = nota?.frontmatter?.areaVida
                                     ? nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')
                                     : "No es de ningún Area de Vida";
                    
                                    siAsunto = false;
                                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                                break;
                                case "AI":
                                    // VERIFICACION DE AREA DE VIDA
                                    this.nota.areaVida = nota?.frontmatter?.areaVida
                                    ? nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')
                                    : "No es de ningún Area de Vida";
                                    // VERIFICACION DE AREA DE INTERES
                                   // Inicializamos this.nota.areaInteres con nota.titulo como el primer elemento
                                    
                                    this.nota.areaInteres = [nota.frontmatter.titulo];
                                    // Verificamos si nota.areaInteres es un arreglo
                                    if (Array.isArray(nota.frontmatter.areaInteres)) {
                                        // Si es un arreglo, iteramos sobre cada elemento (excluyendo el primer elemento ya agregado que es nota.titulo)
                                        // y aplicamos el regex a cada elemento. Luego concatenamos con el array existente.
                                        this.nota.areaInteres = this.nota.areaInteres.concat(nota.frontmatter.areaInteres.map(elemento => 
                                            elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                                    } else {
                                        // Si no es un arreglo, revisamos si nota.frontmatter.areaInteres existe
                                        if (nota?.frontmatter.areaInteres) {
                                            // Si existe, aplicamos el regex y lo añadimos como segundo elemento
                                            this.nota.areaInteres.push(nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                                        }
                                        // Si nota.frontmatter.areaInteres no existe, this.nota.areaInteres ya tendrá nota.titulo como su único elemento
                                    }

                                    siAsunto = false;
                                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                                break;
                                case "PGTD":
                                case "PQ":
                                    siAsunto = false;
                                default:
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
                                        this.nota.areaVida = "No es de ningún Área de Vida";
                                    }
                                    
                                    
                                    // VERIFICACION DE AREA DE INTERES
                                    this.nota.areaInteres = "";
                                    // Verificamos si nota.areaInteres es un arreglo
                                    if (Array.isArray(nota?.frontmatter.areaInteres)) {
                                        // Si es un arreglo, iteramos sobre cada elemento
                                        this.nota.areaInteres = nota.frontmatter.areaInteres.map(elemento => 
                                        elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                                    } else if (nota?.frontmatter.areaInteres){
                                        // Si no es un arreglo, simplemente aplicamos el regex como antes
                                        this.nota.areaInteres = nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, '');
                                    }
                                    // VERIFICACION DE PROYECTOS DE Q Y PROYECTO GTD
                                    if (nota.frontmatter.type === "PQ"){ 
                                        // CUANDO LA NOTA ACTIVA ES UN PQ.
                                    debugger;
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

                                    }
                                    // Obtener ProyectoQ y Proyecto GTD cuando la nota es ProyectoGTD.
                                    else{

                                    }
                                    
                                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                                break;
                            } 
                        break;
                    default:
                        // Si el usuario elige "Otro" o cualquier otra opción.
                        
                    break;
                    }
            
            }
        } else {
            siAsunto = false;
        } 
        return {siAsunto, nombre: padres}
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
    


    async getClasificacion(){
        let clasificacion: string | null, tagClasificacion: string | null, clasificacionAX: { [x: string]: any; }, tagsClasificacionAX: string | any[];
        let nuevaClasificacion = false;
        const file = app.vault.getAbstractFileByPath(this.pathCampos);
        
        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        if (frontmatter) {
            clasificacionAX = frontmatter.tituloClasificacionAX || [];
            tagsClasificacionAX = frontmatter.tagsClasificacionAX || [];
            let suggester = this.tp.system.static_functions.get("suggester");
            tagClasificacion = await suggester(clasificacionAX, tagsClasificacionAX, false, "¿Clasificarías esta nota bajo alguna de las siguientes categorías?")
            // Verificar si el usuario presionó Esc. 
            if (tagClasificacion === null) {
                new Notice("Creación de nota cancelada por el usuario.");
                return; // Termina la ejecución de la función aquí.
            } else if (tagClasificacion=="Nuevo"){
                let prompt = this.tp.system.static_functions.get("prompt");
                clasificacion = await prompt("¿Cual es el nombre de la nueva clasificación que vas a ingresar?", "MiClasificación", true)
                // Verificar si el usuario presionó Esc.
                    if (clasificacion === null) {
                        new Notice("Creación de nota cancelada por el usuario.");
                        return; // Termina la ejecución de la función aquí.
                    }

                tagClasificacion = await prompt("¿Cual es el tag que utilizaras para " + clasificacion + "?. No utilices espacios en la definición del tag.", "nuevoTag", true)
                // Verificar si el usuario presionó Esc.
                if (tagClasificacion === null) {
                    new Notice("Creación de nota cancelada por el usuario.");
                    return; // Termina la ejecución de la función aquí.
                }
                nuevaClasificacion = true;
            }else if(tagClasificacion=="Ninguna"){
                tagClasificacion = ""
                clasificacion = ""	
            }else {
                let indice = tagsClasificacionAX.indexOf(tagClasificacion)
                clasificacion = clasificacionAX[indice]
            }
        }

        if (nuevaClasificacion) {
            try {
                await app.fileManager.processFrontMatter(file, (frontmatter: { tituloClasificacionAX: any[]; tagsClasificacionAX: any[]; }) => {
                    // Asumiendo que 'actsTemas' es el campo a modificar
                let newClasificacion = [...clasificacionAX, clasificacion]
                let newTagClasificacion = [...tagsClasificacionAX, tagClasificacion]
                frontmatter.tituloClasificacionAX = newClasificacion;
                frontmatter.tagsClasificacionAX = newTagClasificacion;
                console.log("Frontmatter actualizado con éxito");
                });
                } catch (err) {
                  console.error("Error al actualizar el frontmatter", err);
                }
            }

        if (tagClasificacion != ""){
            tagClasificacion = "cl/" + tagClasificacion 
            }
            this.nota.clasificacionAX = clasificacion;
            this.nota.tagClasificacionAX = tagClasificacion;
            return {clase: clasificacion, tag: tagClasificacion};
    }
    // ->

    getDuplasFijas(app: App, area: string): Promise<GrupoActividad[]> {
        // Encuentra el archivo por su ruta
        const file = app.vault.getAbstractFileByPath(this.pathCampos);
        try {
            if (file instanceof TFile) {
                // Usa metadataCache para obtener los metadatos del archivo
                const metadata = app.metadataCache.getFileCache(file);
                // Accede al front matter (YAML) del archivo y obtiene el arreglo basado en el tema
                const arregloResult = metadata?.frontmatter?.[area] || [];
                // Construye el arreglo de objetos resultado basado en la estructura de GrupoActividad
                const resultado = [];

                // Rellena el arreglo con los datos del arregloResult
                if (Array.isArray(arregloResult)) {
                    arregloResult.forEach(item => {
                        if (Array.isArray(item) && item.length >= 2) {
                            resultado.push({ grupo: item[0], area: item[1], texto: item[0]+"/"+item[1]});
                        }
                    });
                }
                
                return resultado;
            }
        } catch (error) {
            console.error("Error obteniendo el archivo de campos:", error);
            // Aquí manejarías el error como sea apropiado para tu aplicación
            throw error; // O devolver un arreglo vacío como resultado de error
        }

        // Devuelve un arreglo vacío si no se encuentra el archivo o si ocurre cualquier otro problema
        return [];
    }

    // Función creda para las Areas de Vida y para las Anotaciones, para traer las que estan en plt Campos
    async getArea(){
        let area: string | null, grupo: string | null;
        
        let tipoArea = this.infoSubsistema.typeName;
        let nuevaArea = false;
        let areasGrupos =  this.getDuplasFijas(app, tipoArea)
        let suggester = this.tp.system.static_functions.get("suggester");
        let areaGrupo = await suggester(areasGrupos.map(b=> b.texto), areasGrupos.map(b=> b.texto), false, `¿Cuál ${tipoArea} deseas crear?`)
            // Verificar si el usuario presionó Esc. 
            if (areaGrupo === null) {
                new Notice("Creación de nota cancelada por el usuario.");
                return; // Termina la ejecución de la función aquí.
            } else if (areaGrupo=="Nuevo"){
                let prompt = this.tp.system.static_functions.get("prompt");
                clasificacion = await prompt("¿Cual es el nombre de la nueva clasificación que vas a ingresar?", "MiClasificación", true)
                // Verificar si el usuario presionó Esc.
                    if (clasificacion === null) {
                        new Notice("Creación de nota cancelada por el usuario.");
                        return; // Termina la ejecución de la función aquí.
                    }

                tagClasificacion = await prompt("¿Cual es el tag que utilizaras para " + clasificacion + "?. No utilices espacios en la definición del tag.", "nuevoTag", true)
                // Verificar si el usuario presionó Esc.
                if (tagClasificacion === null) {
                    new Notice("Creación de nota cancelada por el usuario.");
                    return; // Termina la ejecución de la función aquí.
                }
                nuevaClasificacion = true;
            
            }else {
                
                let indice = areasGrupos.findIndex(objeto => objeto.texto === areaGrupo);
                grupo = areasGrupos[indice].grupo;
                area = areasGrupos[indice].area;
                this.nota.grupo = grupo;
                this.nota.titulo = area;
            return {grupo: grupo, titulo: area};
            }
        }

    async getEstado(){
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipoSistema = this.infoSubsistema.type;
        let nombreSistema = this.infoSubsistema.typeName;
        let campo;
        switch(tipoSistema) {
            case "Ax":
                campo = await suggester(["🔵 -> Para Archivo - Información", "🟢 -> Finalizado","🟡 -> En desarrollo", "🔴 -> No realizado"],["🔵", "🟢","🟡", "🔴"], false, `Estado actual ${nombreSistema}:`);
                break;
            case "PGTD":
                campo = await suggester(["🔵 -> Completado - Archivo", "🟢 -> Activo","🟡 -> En Pausa", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, `Estado actual ${nombreSistema}:`);
                break;
            case "PQ":
                campo = await suggester(["🔵 -> Completado - Archivo", "🟢 -> Activo","🟡 -> Por Iniciar, En Pausa", "🔴 -> Cancelado"],["🔵", "🟢","🟡", "🔴"], false, `Estado actual ${this.nota.titulo}:`);
                break;
            case "AI":
            case "AV":
            case "RR":
                // Lógica para permitir al usuario elegir una tarea específica.
                campo = await suggester(["🔵 -> Archivado", "🟢 -> Activo","🟡 -> En Pausa", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, `Estado actual ${this.nota.titulo}:`);
                break;
            default:
                // Si el usuario elige "Otro" o cualquier otra opción.
                campo = await suggester(["🔵 -> Completado - Información", "🟢 -> Finalizado","🟡 -> En desarrollo", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, "Seleccione el estado de la nota:");
                }


	    // Verificar si el usuario presionó Esc.
        if (campo === null) {
        new Notice("Modificación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        //this.nota.estado = campo;
        return campo;
    }

    async getFilename(){
        let fileName;
        switch(this.infoSubsistema.type) {  
            case "AI":
                if (this.nota.areaVida==="No es de ningún Area de Vida"){
                    fileName = (`${this.infoSubsistema.folder}/Otras/${this.nota.titulo}`)
                }else{
                    fileName = (`${this.infoSubsistema.folder}/${this.nota.areaVida}/${this.nota.titulo}`)
                }
                break;
            case "AV":
                debugger;
                if (this.infoSubsistema.hasOwnProperty("fileName")){
                    const partes = this.infoSubsistema.fileName.split(' -- ');
                    this.nota.trimestre = partes[0];
                    this.nota.titulo = partes[1];
                    this.nota.areaVida = partes[1];
                    this.nota.grupo = partes[2];
                }
                fileName = `${this.nota.trimestre} - ${this.nota.titulo}`    
                
                break;
            case "nAV":
                const partes = this.nota.fileName.split(' - ');
                this.nota.grupo = partes[0];
                this.nota.areaVida = partes[1];
                fileName = `${partes[1]}`;    
                break;
            case "Ax":
            case "PGTD":    
                fileName = (`${this.infoSubsistema.folder}/${this.infoSubsistema.type} - ${this.nota.id}`)
                break;     
            }
            return fileName;
    }

    async getTrimestre(){
        
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipoSistema = this.infoSubsistema.type;
        let nombreSistema = this.infoSubsistema.typeName;
        let trimestre;
        //let trimestres = await this.activeStructureResources("Trimestral"); // Funciona en la versión 1.0 de Areas de Vida.
        let trimestres = await this.findMainFilesWithState("TQ");
        
        switch(tipoSistema) {
            case "AV":
            case "PQ":
                // Lógica para permitir al usuario elegir una tarea específica.
                
                trimestre = await suggester(trimestres.map(b => b.file.basename),trimestres.map(b => b.file.basename), false, `Trimestre del ${nombreSistema}:`);
                break;
            default:
                // Si el usuario elige "Otro" o cualquier otra opción.
                trimestre = await suggester(trimestres.map(b => b.file.basename),trimestres.map(b => b.file.path), false, `Trimestre del ${nombreSistema}:`);
                }
	    // Verificar si el usuario presionó Esc.
        if (trimestre === null) {
        new Notice("Modificación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.trimestre = trimestre;
        return trimestre;
    }

    async getRename(){
        let newName, name, folder;
        debugger;
        switch(this.infoSubsistema.type) { 
        case "AI":
            if (this.nota.areaVida==="No es de ningún Area de Vida"){
                newName = `${this.infoSubsistema.folder}/Otras/${this.nota.titulo}.md`
                folder = `${this.infoSubsistema.folder}/Otras`
            }else{
                newName = `${this.infoSubsistema.folder}/${this.nota.areaVida}/${this.nota.titulo}.md`
                folder = `${this.infoSubsistema.folder}/${this.nota.areaVida}`
            }
            await this.crearCarpeta(folder);
            name = `${this.nota.fileName}`
            break;
        case "AV":        
            newName = `${this.infoSubsistema.folder}/${this.nota.areaVida}/${this.nota.filename}.md`
            name = `${this.infoSubsistema.folder}/${this.nota.areaVida}/${this.nota.fileName}.md`
            break;
        case "RR":        
            newName = `${this.infoSubsistema.folder}/${this.infoSubsistema.type} - ${this.nota.id}.md`
            folder = `${this.infoSubsistema.folder}`
            await this.crearCarpeta(folder);
            name = `${this.nota.fileName}`
            break;
        case "PQ": 
            let folderAV = Array.isArray(this.nota.areaVida)? this.nota.areaVida[0] : this.nota.areaVida; 
            newName = `${this.infoSubsistema.folder}/${this.nota.trimestre}/${folderAV}/${this.infoSubsistema.type} - ${this.nota.id}.md`
            folder = `${this.infoSubsistema.folder}/${this.nota.trimestre}/${folderAV}`
            debugger;
            await this.crearCarpeta(folder);
            name = `${this.nota.fileName}`
        break;
        default:
            break;
        }
        const file = app.vault.getAbstractFileByPath(name);
        try{
        if (file instanceof TFile){
            await app.vault.rename(file, newName);
            console.log("Archivo renombrado con éxito.");
            return true;
        }
        }catch (error){
            console.error("Error al cambiar el nombre", error)
            return false;
        }
    }

    async getAreaVida(){
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipo = this.infoSubsistema.type;
        let nombreTipo = this.infoSubsistema.typeName;
        let areasVida = {};
        let areaVida;
        let noAV = {} ;
        noAV.file = {} ;
        noAV.areaVida = "No es de ningún Area de Vida";
        noAV.file.basename = false;
        debugger;
        

        if (!this.nota.asuntoDefinido) {
        switch(tipo) {
            case "AI":
                
                if (this.nota.areaInteres.titulo == ""){
                // Lógica para permitir al usuario elegir una tarea específica.
                areasVida = await this.findMainFilesWithState("AV")
                areasVida.push(noAV);
                areaVida = await suggester(areasVida.map(b => b.areaVida),areasVida.map(b => b.areaVida), false, `A que Area de Vida pertenece esta ${nombreTipo}:`);
                
                }else{
                    areaVida = this.nota.areaVida;
                }
                break;
    

            case "PQ":
                areasVida = await this.findMainFilesWithState("AV", this.nota.trimestre)
               debugger;
                areaVida = await suggester(areasVida.map(b => b.file.basename),areasVida.map(b => [b.areaVida, b.file.basename]), false, `A que Area de Vida pertenece esta(e) ${nombreTipo}:`);
                
            break;
            default:
                areasVida = await this.findMainFilesWithState("AV")
                areasVida.push(noAV);
                areaVida = await suggester(areasVida.map(b => b.file.basename),areasVida.map(b => b.file.basename), false, `A que Area de Vida pertenece esta(e) ${nombreTipo}:`);
                break;
                }
	    // Verificar si el usuario presionó Esc.
        return areaVida;
        } else {
            return this.nota.areaVida;
        }
    }

    async getAreaInteres(){
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipo = this.infoSubsistema.type;
        let nombreTipo = this.infoSubsistema.typeName;
        let areasInteres = await this.findMainFilesWithState("AI")
        let areaInteres, nivel, titulo, padreAI, arrayAI;
        if (!this.nota.asuntoDefinido) {
        switch(tipo) {
            case "AI":
                padreAI = await suggester(["Si", "No"], [true,false], false, ` ${this.nota.titulo} es hijo de otra ${nombreTipo}:`);
                // Lógica para permitir al usuario elegir una tarea específica.
                if (padreAI){
                    areaInteres = await suggester(areasInteres.map(b => b.titulo) ,areasInteres.map(b => b), false, `Que Area de Interés es padre de ${this.nota.titulo}?:`);
                    if (areaInteres === null) {
                        new Notice("Sin Area de Interes");
                        titulo = "";
                        nivel = 0;
                        return; // Termina la ejecución de la función aquí.
                    }
                    else{
                        debugger;
                        if (areaInteres.areaVida === null) {
                            this.nota.areaVida = "No es de ningún Area de Vida";
                        } else {
                            this.nota.areaVida = areaInteres.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                        }
                        titulo = areaInteres.titulo;
                        nivel = parseInt(areaInteres.nivelAI) + 1;
                    }
                }else{
                    titulo = "";
                    nivel = 0;
                }
            break;
            case "RR":
            padreAI = await suggester(["Si", "No"], [true,false], false, ` ${this.nota.titulo} es hijo de un Area de Interés:`);
            // Lógica para permitir al usuario elegir una tarea específica.
            if (padreAI){
                areaInteres = await suggester(areasInteres.map(b => b.titulo) ,areasInteres.map(b => b), false, `Que Area de Interés es padre de ${this.nota.titulo}?:`);
                if (areaInteres === null) {
                    new Notice("Sin Area de Interes");
                    titulo = "";
                    nivel = 0;
                    return; // Termina la ejecución de la función aquí.
                }
                else{
                    debugger;
                    if (areaInteres.areaVida === null) {
                        this.nota.areaVida = "No es de ningún Area de Vida";
                    } else {
                            // VERIFICACION DE AREA DE VIDA
                        this.nota.areaVida = areaInteres?.areaVida
                        ? areaInteres.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')
                        : "No es de ningún Area de Vida";
                    }
                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de proyecto Q o GTD...
                    titulo = areaInteres.titulo;
                    nivel = parseInt(areaInteres.nivelAI);
                }
            }else{
                titulo = "";
                nivel = 0;
            }
            break;
            case "PQ":
                debugger;
            padreAI = await suggester(["Si", "No"], [true,false], false, ` ${this.nota.titulo} es hijo de un Area de Interés:`);
            // Lógica para permitir al usuario elegir una tarea específica.
            if (padreAI){
                areaInteres = await suggester(areasInteres.map(b => b.titulo) ,areasInteres.map(b => b), false, `Que Area de Interés es padre de ${this.nota.titulo}?:`);
                if (areaInteres === null) {
                    new Notice("Sin Area de Interes");
                    titulo = "";
                    nivel = 0;
                    return; // Termina la ejecución de la función aquí.
                }
                else{
                    debugger;
                    if (areaInteres.areaVida === null) {
                        this.nota.areaVida = "No es de ningún Area de Vida";
                    } else {
                            // VERIFICACION DE AREA DE VIDA
                        this.nota.areaVida = [];   
                        this.nota.areaVida[0] = areaInteres?.areaVida
                        ? areaInteres.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')
                        : "No es de ningún Area de Vida";
                        this.nota.areaVida[1] = `${this.nota.trimestre} - ${this.nota.areaVida[0]}`
                    }
                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de proyecto Q o GTD...
                    arrayAI = [areaInteres.titulo];
                    // Verificamos si nota.areaInteres es un arreglo
                    if (Array.isArray(areaInteres.areaInteres)) {
                        // Si es un arreglo, iteramos sobre cada elemento (excluyendo el primer elemento ya agregado que es nota.titulo)
                        // y aplicamos el regex a cada elemento. Luego concatenamos con el array existente.
                        this.nota.areaInteres = arrayAI.concat(areaInteres.areaInteres.map(elemento => 
                            elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                    } else {
                        // Si no es un arreglo, revisamos si nota.frontmatter.areaInteres existe
                        if (areaInteres?.areaInteres) {
                            // Si existe, aplicamos el regex y lo añadimos como segundo elemento
                            arrayAI.push(areaInteres.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                        }
                        // Si areaInteres.areaInteres no existe, this.nota.areaInteres ya tendrá nota.titulo como su único elemento
                    }
                }
            }else{
                arrayAI = "";
            }
            return arrayAI;
            break;
            default:
                // La salida para default no puede ser solo areaInteres.. Validar cuando corresponda.
                areaInteres = await suggester(areasInteres.map(b => b.file.basename),areasVida.map(b => b.file.basename), false, `A que Area de Vida pertenece esta ${nombreTipo}:`);
            break;
                }
	    
        return {titulo, nivel}
     }else{
       return this.nota.areaInteres; 
       }
    }


    async getProyectoGTD(){
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipo = this.infoSubsistema.type;
        let nombreTipo = this.infoSubsistema.typeName;
        let ProyectosGTD = await this.findMainFilesWithState("PGTD")
        let proyectoGTD, nivel, titulo;
        if (!this.nota.asuntoDefinido) {
            // Ejecutar código aquí si asuntoDefinido es falsy (incluye false, null, undefined, 0, "", NaN)
        switch(tipo) {
            case "RR":
                debugger;
                let padrePGTD = await suggester(["Si", "No"], [true,false], false, ` ${this.nota.titulo} es hijo de un Proyecto GTD?`);
                // Lógica para permitir al usuario elegir una tarea específica.
                if (padrePGTD){
                    proyectoGTD = await suggester(proyectosGTD.map(b => b.titulo) ,proyectosGTD.map(b => b), false, `Que Proyecto GTD es padre de ${this.nota.titulo}?:`);
                    if (proyectoGTD === null) {
                        new Notice("Sin proyecto GTD definido.");
                        titulo = "";
                        nivel = 0;
                        return; // Termina la ejecución de la función aquí.
                    }
                    else{
                        
                        // VERIFICACION DE AREA DE VIDA
                        this.nota.areaVida = nota?.frontmatter.areaVida
                        ? nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')
                         : "No es de ningún Area de Vida";
                        // VERIFICACION DE AREA DE INTERES
                        // Verificamos si nota.areaInteres es un arreglo
                        if (Array.isArray(nota.areaInteres)) {
                            // Si es un arreglo, iteramos sobre cada elemento
                            this.nota.areaInteres = nota.areaInteres.map(elemento => 
                            elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                        } else {
                            // Si no es un arreglo, simplemente aplicamos el regex como antes
                            this.nota.areaInteres = nota?.frontmatter.areaInteres
                            ? nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, '')
                             : "";
                        }
                        // VERIFICACION DE PROYECTOS DE Q
                        this.nota.proyectoQ = nota?.frontmatter.proyectoQ
                        ? nota.frontmatter.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '')
                         : "";

                        // VERIFICACION DE PROYECTOSGTD
                        // Verificamos si nota.proyectoGTD es un arreglo
                        if (Array.isArray(nota.proyectoGTD)) {
                            // Si es un arreglo, iteramos sobre cada elemento
                            this.nota.proyectoGTD = nota.proyectoGTD.map(elemento => 
                            elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                        } else {
                            // Si no es un arreglo, simplemente aplicamos el regex como antes
                            this.nota.proyectoGTD = nota.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '');
                        }
                        this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de proyecto Q
                        this.nota.proyectoPadre = "PGTD";
                    }
                }else{
                    titulo = "";
                    nivel = 0;
                }
                break;

                default:
                // La salida para default no puede ser solo areaInteres.. Validar cuando corresponda.
                
                break;
                }
	    
        return titulo;
        }else{
            return this.nota.proyectoGTD//? this.nota.ProyectoGTD;
        }
    }


    async getProyectoQ(){
        let suggester = this.tp.system.static_functions.get("suggester");
        let tipo = this.infoSubsistema.type;
        let nombreTipo = this.infoSubsistema.typeName;
        let ProyectosGTD = await this.findMainFilesWithState("PQ")
        let proyectoGTD, nivel, titulo;
        
        if (!this.nota.asuntoDefinido) {
            // Ejecutar código aquí si asuntoDefinido es falsy (incluye false, null, undefined, 0, "", NaN)
        switch(tipo) {
            case "RR":
                debugger;
                let padrePGTD = await suggester(["Si", "No"], [true,false], false, ` ${this.nota.titulo} es hijo de un Proyecto de Q?`);
                // Lógica para permitir al usuario elegir una tarea específica.
                if (padrePGTD){
                    proyectoGTD = await suggester(proyectosGTD.map(b => b.titulo) ,proyectosGTD.map(b => b), false, `Que Proyecto Q es padre de ${this.nota.titulo}?:`);
                    if (proyectoGTD === null) {
                        new Notice("Sin proyecto Q definido.");
                        titulo = "";
                        return; // Termina la ejecución de la función aquí.
                    }
                    else{
                        
                        // VERIFICACION DE AREA DE VIDA
                        this.nota.areaVida = nota?.frontmatter.areaVida
                        ? nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')
                         : "No es de ningún Area de Vida";
                        // VERIFICACION DE AREA DE INTERES
                        // Verificamos si nota.areaInteres es un arreglo
                        if (Array.isArray(nota.areaInteres)) {
                            // Si es un arreglo, iteramos sobre cada elemento
                            this.nota.areaInteres = nota.areaInteres.map(elemento => 
                            elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                        } else {
                            // Si no es un arreglo, simplemente aplicamos el regex como antes
                            this.nota.areaInteres = nota?.frontmatter.areaInteres
                            ? nota.frontmatter.areaInteres.replace(/\[\[\s*|\s*\]\]/g, '')
                             : "";
                        }
                        // VERIFICACION DE PROYECTOS DE Q
                        this.nota.proyectoQ = nota?.frontmatter.proyectoQ
                        ? nota.frontmatter.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '')
                         : "";

                        // VERIFICACION DE PROYECTOSGTD
                        // Verificamos si nota.proyectoGTD es un arreglo
                        if (Array.isArray(nota.proyectoGTD)) {
                            // Si es un arreglo, iteramos sobre cada elemento
                            this.nota.proyectoGTD = nota.proyectoGTD.map(elemento => 
                            elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                        } else {
                            // Si no es un arreglo, simplemente aplicamos el regex como antes
                            this.nota.proyectoGTD = nota.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '');
                        }
                        this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de proyecto Q
                        this.nota.proyectoPadre = "PQ";
                    }
                }else{
                    titulo = "";
                }
                break;

                default:
                //
                break;
                }
	    
        return titulo
        }else{
            return this.nota.proyectoQ;//? this.nota.ProyectoGTD;
        }
    }



    // Esta función encuentra los archivos de subsistemas y cuyo estado es 🟢
    // Esta función sale de menuOtro, de registro Tiempo. Revisar si debo sincronizarlas.
    async findMainFilesWithState(tipo, parametro) {
    
    const propertiesTipo = {
        AV: {
            folder: this.plugin.settings.folder_AreasVida,
        },
        AI: {
            folder: this.plugin.settings.folder_AreasInteres,
            },
        PQ: {
            folder: this.plugin.settings.folder_ProyectosQ,
        },
        PGTD: {
            folder: this.plugin.settings.folder_ProyectosGTD,
            },
        TI: {
                folder: this.plugin.settings.folder_TemasInteres,
            },
        RR: {
            folder: this.plugin.settings.folder_RecursosRecurrentes,
            },
        TQ: {
            folder: this.plugin.settings.folder_Trimestral,
            },
        // Puedes continuar añadiendo más casos aquí
        };
    
        // Asegúrate de que tipo es una propiedad válida antes de desestructurar

        const activeFilesWithFrontmatter = [];
        let files, trimestre :  string;
        const folder = propertiesTipo[tipo].folder;
        switch (tipo){
        case "AV":
            debugger;
            if (!parametro){ // parametro en este caso es el trimestre. Sin parametro se busca el nodoAreaVida
                trimestre = DateTime.now().toFormat("yyyy-Qq");
             }
            // Cuando el trimestre si se ingresa en la función, entonces busca las AreasVida del trimestre.
            else{
                trimestre = parametro;
            }

            files = app.vault.getMarkdownFiles().filter(file => 
                file.path.includes(folder) && !file.path.includes("Plantillas") && !file.path.includes("Archivo") && file.name.startsWith(trimestre));
            
            for (let file of files) {

                let metadata = app.metadataCache.getFileCache(file)?.frontmatter;

                if (metadata?.estado === "🟢") {
                    let activeFile = Object.assign({}, metadata);
                    activeFile.file = file;
                    activeFilesWithFrontmatter.push(activeFile);        
                }
            }

        break;
        case "AI":
        case "TQ":
            files = app.vault.getMarkdownFiles().filter(file => 
                file.path.includes(folder) && !file.path.includes("Plantillas") && !file.path.includes("Archivo"));    
            for (let file of files) {
                let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                if (metadata?.estado === "🟢") {
                    let activeFile = Object.assign({}, metadata);
                    activeFile.file = file;
                    activeFilesWithFrontmatter.push(activeFile);        
                }
            }
        break;
        default: 
            files = app.vault.getMarkdownFiles().filter(file => 
                file.path.includes(folder) && !file.path.includes("Plantillas") && !file.path.includes("Archivo"));    
            for (let file of files) {
                let metadata = app.metadataCache.getFileCache(file)?.frontmatter;
                if (metadata?.estado === "🟢") {
                    let activeFile = Object.assign({}, metadata);
                    activeFile.file = file;
                    activeFilesWithFrontmatter.push(activeFile);        
                }
            }
        break;
            }
        return activeFilesWithFrontmatter;
    }


    async crearCarpeta(folderPath: string){
        try {
            // Verifica si la carpeta ya existe
           debugger;
            const carpetaExistente = app.vault.getAbstractFileByPath(folderPath);
            if (carpetaExistente instanceof TFolder) {
                console.log(`La carpeta '${folderPath}' ya existe.`);
                return;
            }
            // Crea la carpeta
            await app.vault.createFolder(folderPath);
            console.log(`Carpeta '${folderPath}' creada exitosamente.`);
            } catch (error) {
            console.error(`Error al crear la carpeta '${folderPath}':`, error);
            }
    }
  }
  