/*
 * Filename: /src/modules/noteLifecycleManager/API/YAMLUpdaterAPI.ts
 * Path: /src/modules/noteLifecycleManager/API
 * Created Date: 2025-02-23 15:57:40
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:49:43
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */

//import {utilsAPI} from './utilsAPI'

import { Notice } from "obsidian";
import { modal_cambioHF } from "../../moduloRegistroTiempo/modals/cambioHF";

export class YAMLUpdaterAPI {
    //private utilsApi: utilsAPI;
    private plugin: Plugin;
    private infoSubsistema: object; // Asumiendo que es un string
    private tp: object;
    private pathCampos: string; 
    private nota: object;
    private infoNota: object;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        // Inicializa folder e indice con valores predeterminados o lógica específica.
        this.infoNota = {};
        this.nota = {};
        this.tp = this.getTp();
        this.pathCampos = this.plugin.settings.file_camposCentral + ".md";
    }
    

    async actualizarNota(infoNota: any, campos: any) {
       
        //let nota = {}; // Inicializa el objeto nota.
        Object.assign(this.infoNota, infoNota); 
        
            try {
                for (let campo of campos) {
                    // Divide el campo en función del símbolo "_"
                    const partes = campo.split('_');
                    let campoName, functionName;
                    let parametro = null; 
                    // Si hay un símbolo "_", usa la parte antes de "_" para el nombre de la función,
                    // y la parte después de "_" como parámetro.
                    if (partes.length > 1) {
                        functionName = `get${partes[0].charAt(0).toUpperCase() + partes[0].slice(1)}`;
                        campoName = partes[0];
                        parametro = partes[1];
                    } else {
                        campoName = partes[0];
                        functionName = `get${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
                    }

                    let metadata =  app.metadataCache.getFileCache(this.infoNota.file)?.frontmatter;
                    
                    let valorActualCampo = metadata[campoName] || "Sin definir";
                    // Verifica si existe una función con ese nombre.
                    if (typeof this[functionName] === 'function') {
                        // Llama a la función de manera dinámica. Si existe un parámetro, pásalo a la función.
                        if (parametro !== null) {
                            this.nota[campoName] = await this[functionName](parametro,valorActualCampo);
                        } else {
                            this.nota[campoName] = await this[functionName]();
                        }
                    } else {
                        console.error(`La función ${functionName} no está definida.`);
                        // Maneja el caso en que la función no esté definida.
                    }
                }
                
                
                // Actualizar la nota
                if (Object.keys(this.nota).length > 0) {
                    // Ejecuta tu código aquí si el objeto `nota` tiene más de una propiedad
                    await this.updateYAMLFields(this.nota, infoNota.file.path)
                }else{
                    //No se encontraron campos para modificar
                }
                
                // Aquí iría el código para procesar el objeto nota, como guardar en un archivo dentro de 'folder'.
                
            } catch (error) {
                console.error("No se pudo crear el objeto de registro.", error);
                new Notice("No se pudo crear el objeto de registro.");
                return null;
            }
        return this.nota; // Retorna el objeto nota con todas las propiedades agregadas.
    }
    
    async archivarNota(infoNota: any, campos: any) {
        
        let nota = {}; // Inicializa el objeto nota.
        Object.assign(this.infoNota, infoNota); 
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
                
                // Actualizar la nota
                
                nota.estado = "🔵";
                if (Object.keys(nota).length > 0) {
                    // Ejecuta tu código aquí si el objeto `nota` tiene más de una propiedad
                    await this.updateYAMLFields(nota, infoNota.file.path)
                }else{
                    //No se encontraron campos para modificar
                }
                
                // Aquí iría el código para procesar el objeto nota, como guardar en un archivo dentro de 'folder'.
                
            } catch (error) {
                console.error("No se pudo crear el objeto de registro.", error);
                new Notice("No se pudo crear el objeto de registro.");
                return null;
            }
        return nota; // Retorna el objeto nota con todas las propiedades agregadas.
    }


    async updateYAMLFields(nota, ruta) {
        
        try {
            const file = app.vault.getAbstractFileByPath(ruta);
            await app.fileManager.processFrontMatter(file, frontmatter => {
                // Iterar sobre cada propiedad del objeto 'nota'
                for (const campo in nota) {
                    
                    if (frontmatter.hasOwnProperty(campo)) {
                        // Actualizar el campo en el frontmatter con el valor correspondiente
                        
                        frontmatter[campo] = nota[campo];
                    }
                }
            });
            console.log("Frontmatter actualizado con éxito");
        } catch (err) {
            console.error("Error al actualizar el frontmatter", err);
        }
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
        // get an instance of the date module
        tp.system = tpGen.find(m => m.name == "system");

        if (!tp.system) {
        console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
        return;
    }
    console.log('tp en YAMLUpdaterAPI se ha cargado satisfactoriamente');
    return tp;
    }

    async getFecha(flag, actual) {
        
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


    async getHoraFinal(parametro, actual){
        // Esta función solo recibe en el parámetro la hora final nueva, para actualizar el valor.
        debugger;
        if (parametro === undefined){

            return this.formatearFecha(new Date());
        }else{ 
            return parametro;
        }
    }

    async getTiempoTrabajado(parametro, actual){
        debugger
        
        let horaInicioStr = this.infoNota.horaInicio;
        let cierre;
        // Suponiendo que el formato es "YYYY-MM-DD dddd HH:mm" y quieres convertirlo a un formato reconocido por Date
        // Primero, elimina la parte del día de la semana, ya que Date() no la necesita
        let [fecha, , hora] = horaInicioStr.split(' ');
        let fechaHoraISO = `${fecha}T${hora}`;
        // Crear objetos Date
        let horaInicio = new Date(fechaHoraISO);
        if (parametro == undefined){    
        cierre = new Date();

        }else{
            let [fechaCierre, ,horaCierre] = parametro.split(' ');   
            let fechaHoraCierreISO = `${fechaCierre}T${horaCierre}`;
            cierre = new Date(fechaHoraCierreISO);
        }        
        // Calcular la diferencia en milisegundos
        let diferenciaEnMilisegundos = cierre - horaInicio;
        return diferenciaEnMilisegundos;
    }


    async getSecId(flag, actual){

    }
    
    async getTitulo(flag, actual){
        let titulo = await this.tp.system.prompt(`Titulo de este(a) ${this.infoSubsistema.name}`, `${this.infoSubsistema.name} - ${this.nota.id}`, true)
	    // Verificar si el usuario presionó Esc.
        if (titulo === null) {
        new Notice("Creación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        this.nota.titulo = titulo;
        return titulo;
    }

    async getDescripcion(flag, actual){
        let prompt = this.tp.system.static_functions.get("prompt");
        let descripcion;
        switch (flag) {
            case "RegistroTiempo":
                 descripcion = await prompt("¿Detalle del Registro Tiempo:", actual, false, true )   
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
        this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getAliases(flag, actual){
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

    async getAsunto(flag, actual){
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


    async getClasificacion(flag, actual){
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

    async getEstado(parametro, actual){
        debugger;
        let campo;
        if (parametro == undefined){
        let suggester = this.tp.system.static_functions.get("suggester");
	    campo = await suggester(["🔵 -> Completado - Información", "🟢 -> Finalizado","🟡 -> En ejecución", "🔴 -> Detenido"],["🔵", "🟢","🟡", "🔴"], false, "Seleccione el nuevo estado:");
        // Verificar si el usuario presionó Esc.
        if (campo === null) {
        new Notice("Modificación de nota cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        }else{
            campo = parametro;
        }

        this.nota.estado = campo;
        return campo;
    }

    async getFilename(flag, actual){
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

    async modalCambioHF(nota){
        debugger;
        let modal = new modal_cambioHF(this.plugin, nota);
        modal.open();
    }
   

  }
  