import { TFile, TFolder, Notice } from 'obsidian';
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { NoteFieldHandler } from '../FH Base/NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario

export class RepositorioLibros_FH extends NoteFieldHandler {
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }

    async getDescripcion(): Promise<string> {
        const descripcion = await this.prompt(`¿Porque estás agregando este libro?:`, "", false, true);
        this.nota.descripcion = descripcion;
        return descripcion;
    }

    async getEstado(){
        let estado;
                estado = await this.suggester(["🔵 -> Para Archivo - Leido", "🟢 -> En Lectura - Comprado","🟡 -> Por Adquirir", "🔴 -> Cancelado"],["🔵", "🟢","🟡", "🔴"], false, `En que estado está este libro?`);
         // Verificar si el usuario presionó Esc.
        if (estado === null) {
        new Notice("Creación de Libro cancelada por el usuario.");
        return; // Termina la ejecución de la función aquí.
	    }
        //this.nota.estado = campo;
        return estado;
    }

    async getTitulo(): Promise<string> {
        const titulo = this.infoSubsistema.titulo;
        this.nota.titulo = titulo;
        return titulo;
    }

    async getAsunto(): Promise<{ siAsunto: boolean, nombre: string[] }> { // Funciona con frontmatter
        let padres = [];
        let activo = this.infoSubsistema.activo;
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



    

}