//import {utilsAPI} from './utilsAPI'

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
    

    async crearNota(infoSubsistema, campos) {
        
        let nota = {}; // Inicializa el objeto nota.
        Object.assign(this.infoSubsistema, infoSubsistema); 
        if (this.infoSubsistema.defined){
        this.infoSubsistema.folder = this.plugin.settings[infoSubsistema.folder]
        this.infoSubsistema.indice = this.plugin.settings[infoSubsistema.indice]
        }
        // Crear un tp para acceder a funcionalidades de templater.
       
            try {
                for (let campo of campos) {
                    // Usa el nombre del campo para construir el nombre de la función (p. ej., "getId")
                    const functionName = `get${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
                    // Verifica si existe una función con ese nombre.
                    if (typeof this[functionName] === 'function') {
                        // Llama a la función de manera dinámica y asigna el resultado al campo correspondiente de la nota.
                        nota[campo] = await this[functionName]();
                    } else {
                        console.error(`La función ${functionName} no está definida.`);
                        // Maneja el caso en que la función no esté definida.
                        // Por ejemplo, podrías asignar un valor por defecto a nota[campo] o simplemente continuar.
                    }
                }
                
                // Aquí iría el código para procesar el objeto nota, como guardar en un archivo dentro de 'folder'.
                
            } catch (error) {
                console.error("No se pudo crear el objeto de registro.", error);
                new Notice("No se pudo crear el objeto de registro.");
                return null;
            }
        return nota; // Retorna el objeto nota con todas las propiedades agregadas.
    }
    

    getTp(){
        if (!this.plugin || !this.plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
            console.error('El plugin Templater no está habilitado.');
            return;
        }
        // Forma de acceder al objeto tp normal que he usado desde DVJS
        const templaterPlugin = this.plugin.app.plugins.plugins['templater-obsidian'];
        const tp = templaterPlugin.templater.current_functions_object;
        
        if (!tp) {
        console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
        return;
    }
    return tp;
    }

    // Ejemplo de función getCampo simulada. Debes definir funciones similares para 'id', 'fecha', etc.
    async getId() {
        
        let maxId = 0;

        // Obtén todos los archivos Markdown
        const files = app.vault.getMarkdownFiles();
        // Filtra por los archivos en la carpeta deseada
        const registrosExistentes = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
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
        this.nota.id = nextId;
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
        let titulo = await this.tp.system.prompt(`Titulo de este(a) ${this.infoSubsistema.name}`, `${this.infoSubsistema.name} - ${this.nota.id}`, true)
	    // Verificar si el usuario presionó Esc.
        if (titulo === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.titulo = titulo;
        return titulo;
    }

    async getDescripcion(){
        let descripcion = await this.tp.system.prompt("¿Quieres agregar una descripción?", " " + `Esta nota es sobre ${this.nota.titulo}`, false, true )
	    // Verificar si el usuario presionó Esc.
        if (descripcion === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getAliases(){
        this.nota.aliases = [];      
        switch(this.infoSubsistema.type) {
            case "Ax":
                this.nota.aliases.push(`${this.nota.titulo}`)
                this.nota.aliases.push(`${this.infoSubsistema.type} - ${this.nota.titulo}`)
                break;
            case "AV":
            case "AI":
                // 0 -> Nombre, 1 -> type + Nombre
                break;     
            }
            return this.nota.aliases;
       
    }

    async getAsunto(){
        let siAsunto, nombre; 
        let activo = app.workspace.getActiveFile();
        if (activo != null){ 
            nombre = activo.basename;
            const nota = app.metadataCache.getFileCache(activo); 
            siAsunto = await this.tp.system.suggester(["Si","No"],[true, false], true, nombre + " es origen de " + this.nota.titulo + "?")
            }else{
                siAsunto = false;
                nombre = "";
            }
            
            this.nota.asunto = {};
            this.nota.asunto.siAsunto = siAsunto;
            this.nota.asunto.nombre = nombre;    
        return {siAsunto, nombre}
    }


    async getClasificacion(){
        let clasificacion, tagClasificacion, clasificacionAX, tagsClasificacionAX;
        let nuevaClasificacion = false;
        const file = app.vault.getAbstractFileByPath(this.pathCampos);
        
        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        if (frontmatter) {
            clasificacionAX = frontmatter.tituloClasificacionAX || [];
            tagsClasificacionAX = frontmatter.tagsClasificacionAX || [];
            tagClasificacion = await this.tp.system.suggester(clasificacionAX, tagsClasificacionAX, false, "¿Clasificarías esta nota bajo alguna de las siguientes categorías?")
            // Verificar si el usuario presionó Esc. 
            if (tagClasificacion === null) {
                new Notice("Creación de nota cancelada por el usuario.");
                return; // Termina la ejecución de la función aquí.
            } else if (tagClasificacion=="Nuevo"){
                clasificacion = await this.tp.system.prompt("¿Cual es el nombre de la nueva clasificación que vas a ingresar?", "MiClasificación", true)
                // Verificar si el usuario presionó Esc.
                    if (clasificacion === null) {
                        new Notice("Creación de nota cancelada por el usuario.");
                        return; // Termina la ejecución de la función aquí.
                    }
                tagClasificacion = await this.tp.system.prompt("¿Cual es el tag que utilizaras para " + clasificacion + "?. No utilices espacios en la definición del tag.", "nuevoTag", true)
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
                await app.fileManager.processFrontMatter(file, frontmatter => {
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

    async getEstado(){
        let campo = await this.tp.system.suggester(["🔵 -> Completado - Información", "🟢 -> Finalizado","🟡 -> En ejecución", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, "Seleccione el estado de la nota:")
	    // Verificar si el usuario presionó Esc.
        if (campo === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.estado = campo;
        return campo;
    }

    async getFilename(){
        switch(this.infoSubsistema.type) {
            case "AV":
            case "AI":
                this.nota.fileName = (`${this.infoSubsistema.folder}/${this.nota.titulo}/index${this.infoSubsistema.type}`)
                break;
            case "Ax":
                this.nota.fileName = (`${this.infoSubsistema.folder}/${this.infoSubsistema.type} - ${this.nota.id}`)
                break;     
            }
            return this.nota.fileName;
    }

  }
  