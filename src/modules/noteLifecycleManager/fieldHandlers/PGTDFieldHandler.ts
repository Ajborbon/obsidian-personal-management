import { NoteFieldHandler } from './NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario
import { FieldHandlerUtils } from '../FieldHandlerUtils';
import { TFile, TFolder, Notice } from 'obsidian';

export class PGTDFieldHandler extends NoteFieldHandler{
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }

    async getAsunto(){ // Funciona con frontmatter

        let tipoSistema = this.infoSubsistema.type;
        let nombreSistema = this.infoSubsistema.typeName;
        let subsistemas, padres = [];
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
            switch(tipoSistema) { // Estoy creando un: 
                case "RR":
                case "PGTD":
                case "Ax":
                case "Tx":
                case "CPE":  // Contenido para Estudio
                    siAsunto = await this.suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
                    if (siAsunto) {
                        debugger;
                        this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                        let nivel;
                        switch (nota?.frontmatter?.type){ // La nota activs es una: 
                            default:
                            case "PGTD":
                            case "PQ":
                                    // VERIFICACION DE PROYECTOS DE Q Y PROYECTO GTD
                                if (nota.frontmatter?.type === "PQ"){ 
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
                                 } else if (nota.frontmatter?.type === "PGTD"){
                                 
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
                                 else{

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
                                debugger;
                                // VERIFICACION DE AREA DE INTERES
                                if (nota?.frontmatter?.type === "AI"){
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
                                    }else {
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
                                if (nota?.frontmatter?.type === "AI"||nota?.frontmatter?.type === "AV"){                
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
                    }else{ // activa no es origen de Creando RR - PGTD - PQ  if(siAsunto)

                    } 
                    break; // Creando RR
               
                case "PQ":  // Estoy Creando un PQ 
                    siAsunto = await this.suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
                    if (siAsunto) {
                        debugger;
                        // PQ requiere obligatoriamente tener Area de Vida.
                        if (nota?.frontmatter?.areaVida !== undefined && nota.frontmatter.areaVida !== "") {
                            // Código a ejecutar si areaVida existe y no es una cadena vacía
                            if (Array.isArray(nota.frontmatter.areaVida)) {
                                // Es un arreglo, usa el primer elemento
                                this.nota.areaVida = nota.frontmatter.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
                            } else if (typeof nota.frontmatter.areaVida === 'string') {
                                // Es un string
                                this.nota.areaVida = nota.frontmatter.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                            }
                             // poniendo si Asunto en false para las notas estructura AI y AV. 
                            if (nota?.frontmatter?.type === "AI"||nota?.frontmatter?.type === "AV"){                
                                siAsunto = false;
                            }
                        let nivel;
                        switch (nota?.frontmatter?.type){ // tipo de nota activa creando un PQ.
                            case "PGTD":
               
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
                               
                            case "AI":
                                // VERIFICACION DE AREA DE INTERES
                                if (nota?.frontmatter?.type === "AI"){
                                    this.nota.areaInteres = [nota.frontmatter.file.basename]; 
                                    // Inicializamos this.nota.areaInteres con nota.titulo como el primer elemento.
                                    // Este solo aplica para cuando estoy construyendo desde Area de Interes otra Area de Interes.
                                }else{
                                    this.nota.areaInteres = [];
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
                                    }else {
                                        this.nota.areaInteres = "";
                                    }
                                // Si nota.frontmatter.areaInteres no existe, this.nota.areaInteres ya tendrá nota.titulo como su único elemento
                                }
                                
                            case "AV":
                            case "nAV":
                                 // DEFINIR NIVELP
                                // Comprueba si nivelAI existe y no es NaN después de intentar convertirlo a entero
                                if (!isNaN(parseInt(nota.frontmatter?.nivelP))) {
                                    nivel = parseInt(nota.frontmatter.nivelP) + 1;
                                } else {
                                    // Si nivelAI no existe o su conversión a entero resulta en NaN, establece nivel a 0
                                    nivel = 0;
                                }
                                this.nota.nivelP = nivel;
                                this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD

                            break;  
                            default:
                                new Notice("Un Proyecto de Q solo puede iniciar de un AV, AI o PGTD. Asunto no definido.");   
                            break;
                        }
                    } 
                    // Area de vida de activa, creando PQ No está definido o está vacío
                    else {
                       new Notice("Todos los proyectos de Q requieren Area de Vida. Asunto no definido."); 
                       siAsunto = false;
                    }
                }else{ // activa no es origen de Creando PQ  if(siAsunto)

                }     
                break; // Creando PQ
                case "AI": // Creando un AI
                    let nivel;
                    switch (nota?.frontmatter?.type){
                        case "AI":
                        case "AV":
                        case "nAV":
                            siAsunto = await this.suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
                            if (siAsunto) {
                                this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                                // VERIFICACION DE AREA DE INTERES
                                // Inicializamos this.nota.areaInteres con nota.titulo como el primer elemento
                                
                                if (nota?.frontmatter?.type === "AI"){
                                    this.nota.areaInteres = [nota.frontmatter.file.basename]; 
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
                                }                            

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
                                if (nota?.frontmatter?.type === "AI"||nota?.frontmatter?.type === "AV"){                
                                    siAsunto = false;
                                }

                                // DEFINIR NIVELAI
                                // Comprueba si nivelAI existe y no es NaN después de intentar convertirlo a entero
                                if (!isNaN(parseInt(nota.frontmatter?.nivelAI))) {
                                    nivel = parseInt(nota.frontmatter.nivelAI) + 1;
                                } else {
                                    // Si nivelAI no existe o su conversión a entero resulta en NaN, establece nivel a 0
                                    nivel = 0;
                                }
                                this.nota.nivelAI = nivel;

                        }
                        break;  // Case AI - AV
                            
                    } // switch case sobre el tipo de nota activa.
                break; // Creando un AI
                
                default:  // Asunto De la nota que esté creando cuando es cualqueir cosa
                    console.log("Dependiendo de la estructura, getAsunto deberia tener su clasificación. Aqui vas a tener un error.") 
                    
                break;
                } // switch tipo(sistema) -> Sobre la nota que esté creando.

        } else { // activo == null
            siAsunto = false;
        } 
        return {siAsunto, nombre: padres}
    }

    async getProyectoGTD() {
        let tipo = this.infoSubsistema.type;
        let notasF = await FieldHandlerUtils.findMainFilesWithState("PGTD", null, this.plugin);
        let notaF, titulo = [];
        let padrePGTD;
    
        if (!this.nota.asuntoDefinido) {
            padrePGTD = await this.suggester(["Si", "No"], [true, false], false, `${this.nota.titulo} es hijo de un Proyecto GTD?`);
    
            if (padrePGTD) {
                notaF = await this.suggester(notasF.map(b => b.titulo), notasF.map(b => b), false, `¿Qué Proyecto GTD es padre de ${this.nota.titulo}?:`);
                if (notaF === null) {
                    new Notice("Sin proyecto GTD definido.");
                    return [];
                } else {
                    this.nota.areaInteres = Array.isArray(notaF?.areaInteres) 
                        ? notaF.areaInteres.map(elemento => elemento.replace(/\[\[\s*|\s*\]\]/g, '')) 
                        : notaF?.areaInteres ? [notaF.areaInteres.replace(/\[\[\s*|\s*\]\]/g, '')] 
                        : [];
    
                    this.nota.areaVida = notaF?.areaVida 
                        ? (Array.isArray(notaF.areaVida) ? notaF.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '') : notaF.areaVida.replace(/\[\[\s*|\s*\]\]/g, '')) 
                        : "No es de ningún Area de Vida";
    
                    this.nota.proyectoQ = Array.isArray(notaF?.proyectoQ) 
                        ? notaF.proyectoQ.map(elemento => elemento.replace(/\[\[\s*|\s*\]\]/g, '')) 
                        : notaF?.proyectoQ ? [notaF.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '')] 
                        : [];
    
                    titulo = [notaF.titulo];
                    if (Array.isArray(notaF?.proyectoGTD)) {
                        titulo = titulo.concat(notaF.proyectoGTD.map(elemento => elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                    } else if (notaF?.proyectoGTD) {
                        titulo.push(notaF.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, ''));
                    }
    
                    this.nota.asuntoDefinido = true;
                    debugger;
                    this.nota.nivelP = !isNaN(parseInt(notaF?.nivelP)) 
                        ? parseInt(notaF.nivelP) + 1 
                        : 0;
                }
            } else {
                titulo = [];
                this.nota.nivelP = 0;
            }
    
            return titulo;
        } else {
            return this.nota.proyectoGTD;
        }
    }

    async getRename(){
        let newName, folder;
        debugger;
        if (this.nota.areaVida==="No es de ningún Area de Vida"){
            newName = `${this.infoSubsistema.folder}/Otras/${this.infoSubsistema.type} - ${this.nota.id}.md`
            folder = `${this.infoSubsistema.folder}/Otras`
        }else{
            newName = `${this.infoSubsistema.folder}/${this.nota.areaVida}/${this.infoSubsistema.type} - ${this.nota.id}.md`
            folder = `${this.infoSubsistema.folder}/${this.nota.areaVida}`
        }
        await FieldHandlerUtils.crearCarpeta(folder);
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