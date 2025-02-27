import { NoteFieldHandler } from '../../Interfaces/NoteFieldHandler';
import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import {DateTime} from 'luxon';

/* ----------------------------------------------------------------
Esta clase sirve para cualquier clase que solamente deba procesar 
las siguientes propiedades:
 campos = ["id","fecha","titulo","descripcion","estado","asunto",
 "proyectoGTD","ProyectoQ","areaInteres","areaVida","aliases","rename"]
Para heredar todo de esta clase sin modificaciones, se debe hacer 
extendiendo la subclase de esta y definiendo el constructor:

class subsistemaFieldHandler extends NoteFieldHandler {
  constructor(tp: any, folder: string, plugin: any) {
    super(tp, folder, plugin); // Llama al constructor de la clase padre
  }
}
... 
 ------------------------------------------------------------------ */


export class NoteFieldHandler implements NoteFieldHandler {
    private tp: any;
    private infoSubsistema: any;
    private suggester: any;
    private prompt: any;
    private plugin: any;


    constructor(tp: any, infoSubsistema: any, plugin: any) {
        this.tp = tp;
        this.infoSubsistema = infoSubsistema;
        this.suggester = tp.system.static_functions.get("suggester");
        this.prompt = tp.system.static_functions.get("prompt");
        this.nota = {}; // Inicializar la nota
        this.plugin = plugin; // Almacenar la instancia del plugin
    }

    async getId(): Promise<number> {
        let maxId = 0;
        const files = app.vault.getMarkdownFiles();
        const registrosExistentes = files.filter(file => file.path.startsWith(this.infoSubsistema.folder));
        registrosExistentes.forEach((file: any) => {
            const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
            if (metadata && metadata.id && !isNaN(metadata.id)) {
                const id = parseInt(metadata.id);
                if (id > maxId) maxId = id;
            }
        });
        this.nota.id =  maxId + 1;
        return this.nota.id;
    }


    async getFecha(): Promise<string> {
        let fechaActual = DateTime.now();
        fechaActual = fechaActual.setLocale('es');
        fechaActual = fechaActual.toFormat('yyyy-MM-dd EEEE HH:mm');
        this.nota.fecha = fechaActual;
        return fechaActual;
    }

    async getTitulo(): Promise<string> {
        const title = await this.prompt(`Título de ${this.infoSubsistema.typeName}:`, "", false, false);
        this.nota.titulo = title;
        return title;
    }

    async getDescripcion(): Promise<string> {
        const descripcion = await this.prompt(`Descripción del ${this.infoSubsistema.typeName}:`, "", false, true);
        this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getEstado(): Promise<string> {
        return '🟢';
    }

    async getNota(): Promise<any> {
        return this.nota;
    }

    async getAsunto(): Promise<{ siAsunto: boolean, nombre: string[] }> { // Funciona con frontmatter
        
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
            //1. siAsunto = await suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
            padres.unshift(nombre); // Añade el nombre al inicio del arreglo, desplazando los demás elementos
                siAsunto = await this.suggester(["Si", "No"], [true, false], true, nombre + " es origen de " + this.nota.titulo + "?");
                if (siAsunto) {
                    debugger;
                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                    let nivel;
                    switch (nota?.frontmatter?.type) { // La nota activs es una: 
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
                            debugger;
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
    

    async getProyectoGTD(): Promise<string[]> {
        if (!this.nota.asuntoDefinido) {
            let notasF = await FieldHandlerUtils.findMainFilesWithState("PGTD", null, this.plugin); // Pasar la instancia del plugin aquílet notaF, titulo;
            let titulo, nivel;
            let padrePGTD = await this.suggester(["Si", "No"], [true, false], false, ` ${this.nota.titulo} es hijo de un Proyecto GTD?`);
            if (padrePGTD) {
                let notaF = await this.suggester(notasF.map(b => b.titulo), notasF.map(b => b), false, `¿Qué Proyecto GTD es padre de ${this.nota.titulo}?:`);
                if (notaF === null) {
                    new Notice("Sin proyecto GTD definido.");
                    titulo = [];
                    return;
                } else {
                    this.nota.areaInteres = [];
                    if (Array.isArray(notaF?.areaInteres)) {
                        this.nota.areaInteres = this.nota.areaInteres.concat(notaF.areaInteres.map(elemento =>
                            elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                    } else if (notaF?.areaInteres) {
                        this.nota.areaInteres.push(notaF.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                    }

                    this.nota.areaVida = [];
                    if (notaF?.areaVida) {
                        if (Array.isArray(notaF.areaVida)) {
                            this.nota.areaVida = notaF.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
                        } else if (typeof notaF.areaVida === 'string') {
                            this.nota.areaVida = notaF.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                        }
                    } else {
                        this.nota.areaVida = "No es de ningún Area de Vida";
                    }

                    this.nota.proyectoQ = [];
                    if (Array.isArray(notaF?.proyectoQ)) {
                        this.nota.proyectoQ = notaF.proyectoQ.map(elemento =>
                            elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                    } else if (notaF?.proyectoQ) {
                        this.nota.proyectoQ = [notaF.proyectoQ.replace(/\[\[\s*|\s*\]\]/g, '')];
                    }

                    titulo = [notaF.titulo];
                    if (Array.isArray(notaF?.proyectoGTD)) {
                        titulo = titulo.concat(notaF.proyectoGTD.map(elemento =>
                            elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                    } else if (notaF?.proyectoGTD) {
                        titulo.push(notaF.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, ''));
                    }
                    this.nota.asuntoDefinido = true;
                }
            } else {
                titulo = [];
                nivel = 0;
            }

            return titulo;
        } else {
            return this.nota.proyectoGTD;
        }
    }


    async getProyectoQ(): Promise<string[]> {
        let notaF, titulo, nivel;

        if (!this.nota.asuntoDefinido) {
            let notasF = await FieldHandlerUtils.findMainFilesWithState("PQ", null, this.plugin); // Pasar la instancia del plugin aquí
            let padreQ = await this.suggester(["Si", "No"], [true, false], false, ` ${this.nota.titulo} es hijo de un Proyecto Q?`);

            if (padreQ) {
                notaF = await this.suggester(notasF.map(b => b.titulo), notasF.map(b => b), false, `¿Qué Proyecto Q es padre de ${this.nota.titulo}?:`);
                if (notaF === null) {
                    new Notice("Sin proyecto Q definido.");
                    titulo = [];
                    return;
                } else {
                    this.nota.areaInteres = [];
                    if (Array.isArray(notaF?.areaInteres)) {
                        this.nota.areaInteres = this.nota.areaInteres.concat(notaF.areaInteres.map(elemento =>
                            elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                    } else if (notaF?.areaInteres) {
                        this.nota.areaInteres.push(notaF.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                    }

                    this.nota.areaVida = [];
                    if (notaF?.areaVida) {
                        if (Array.isArray(notaF.areaVida)) {
                            this.nota.areaVida = notaF.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
                        } else if (typeof notaF.areaVida === 'string') {
                            this.nota.areaVida = notaF.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                        }
                    } else {
                        this.nota.areaVida = "No es de ningún Area de Vida";
                    }

                    titulo = [notaF?.titulo];

                    this.nota.proyectoGTD = [];
                    if (Array.isArray(notaF?.proyectoGTD)) {
                        this.nota.proyectoGTD = notaF.proyectoGTD.map(elemento =>
                            elemento.replace(/\[\[\s*|\s*\]\]/g, ''));
                    } else if (notaF?.proyectoGTD) {
                        this.nota.proyectoGTD = [notaF.proyectoGTD.replace(/\[\[\s*|\s*\]\]/g, '')];
                    }
                    this.nota.asuntoDefinido = true;
                }
            } else {
                titulo = [];
                nivel = 0;
            }
            return titulo;
        } else {
            return this.nota.proyectoQ;
        }
    }

    async getAreaInteres(): Promise<string[]> {
        let areaInteres, nivel, titulo, padreAI, arrayAI;

        if (!this.nota.asuntoDefinido) {
            let areasInteres = await FieldHandlerUtils.findMainFilesWithState("AI", null, this.plugin); // Pasar la instancia del plugin aquí
            padreAI = await this.suggester(["Si", "No"], [true, false], false, ` ${this.nota.titulo} es hijo de un Área de Interés:`);
            if (padreAI) {
                areaInteres = await this.suggester(areasInteres.map(b => b.titulo), areasInteres.map(b => b), false, `¿Qué Área de Interés es padre de ${this.nota.titulo}?:`);
                if (areaInteres === null) {
                    new Notice("Sin Área de Interés");
                    titulo = [];
                    nivel = 0;
                    return;
                } else {
                    titulo = [areaInteres.titulo];
                    if (Array.isArray(areaInteres?.areaInteres)) {
                        titulo = titulo.concat(areaInteres.areaInteres.map(elemento =>
                            elemento.replace(/\[\[\s*|\s*\]\]/g, '')));
                    } else if (areaInteres?.areaInteres) {
                        titulo.push(areaInteres.areaInteres.replace(/\[\[\s*|\s*\]\]/g, ''));
                    }

                    if (areaInteres?.areaVida) {
                        if (Array.isArray(areaInteres.areaVida)) {
                            this.nota.areaVida = areaInteres.areaVida[0].replace(/\[\[\s*|\s*\]\]/g, '');
                        } else if (typeof areaInteres.areaVida === 'string') {
                            this.nota.areaVida = areaInteres.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                        }
                    } else {
                        this.nota.areaVida = "No es de ningún Area de Vida";
                    }
                    this.nota.asuntoDefinido = true;
                    nivel = parseInt(areaInteres.nivelAI);
                }
            } else {
                titulo = [];
                nivel = 0;
            }

            this.nota.nivelAI = nivel;
            return titulo;
        } else {
            return this.nota.areaInteres;
        }
    }

    async getAreaVida(): Promise<string> {
        let areasVida = {};
        let noAV = {
            file: {
                basename: "No es de ningún Area de Vida"
            },
            areaVida: "No es de ningún Area de Vida"
        };

        if (!this.nota.asuntoDefinido) {
            let padreAV = await this.suggester(["Si", "No"], [true, false], false, ` ${this.nota.titulo} es hijo de un Área de Vida?`);
            if (padreAV) {
                areasVida = await FieldHandlerUtils.findMainFilesWithState("AV", null, this.plugin); // Pasar la instancia del plugin aquí
                areasVida.push(noAV);
                this.nota.areaVida = await this.suggester(areasVida.map(b => b.file.basename), areasVida.map(b => b.file.basename), false, `¿A qué Área de Vida pertenece $${this.nota.titulo}?:`);
            }else {
                this.nota.areaVida = "No es de ningún Area de Vida"
            }
            return this.nota.areaVida;
        } else {
            return this.nota.areaVida;
        }
    }

    async getAliases(): Promise<string[]> {
        this.nota.aliases = [];
        this.nota.aliases.push(`${this.nota.titulo}`)
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.titulo}`)
        return this.nota.aliases;
    }

    async getRename(): Promise<string> {
        debugger;
        const newName = `${this.infoSubsistema.folder}/${this.infoSubsistema.type} - ${this.nota.id}.md`;
        await FieldHandlerUtils.crearCarpeta(this.infoSubsistema.folder);

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