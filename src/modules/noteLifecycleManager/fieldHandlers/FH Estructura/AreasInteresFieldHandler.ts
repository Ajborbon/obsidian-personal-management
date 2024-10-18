/* src/modules/noteLifecycleManager/fieldHandlers/FH Estructura/AreasInteresFieldHandler.ts */
import { NoteFieldHandler } from '../FH Base/NoteFieldHandler'; // Asegúrate de importar NoteFieldHandler si es necesario
import { FieldHandlerUtils } from '../../FieldHandlerUtils';
import { TFile, TFolder, Notice } from 'obsidian';


export class AreasInteresFieldHandler extends NoteFieldHandler{
    constructor(tp: any, folder: string, plugin: any) {
      super(tp, folder, plugin); // Llama al constructor de la clase padre
    }

    async getAsunto(){ // Funciona con frontmatter

        let tipoSistema = this.infoSubsistema.type;
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
            let nivel;
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
        } else { // activo == null
            siAsunto = false;
        } 
        return {siAsunto, nombre: padres}
    }


    async getAliases(){
        this.nota.aliases = [];  
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.titulo}`)
        debugger;
        if (this.nota.areaVida != "No es de ningún Area de Vida"){
        this.nota.aliases.push(`${this.infoSubsistema.type}/${this.nota.areaVida}/${this.nota.titulo}`)
        }       

            return this.nota.aliases;
       
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

    async getAreaInteres(){
        let nombreTipo = this.infoSubsistema.typeName;
        let areasInteres = await FieldHandlerUtils.findMainFilesWithState("AI",null,this.plugin)
        let areaInteres, nivel, titulo, padreAI, arrayAI;
        if (!this.nota.asuntoDefinido) {
            padreAI = await this.suggester(["Si", "No"], [true,false], false, ` ${this.nota.titulo} es hijo de otra ${nombreTipo}:`);
            // Lógica para permitir al usuario elegir una tarea específica.
            if (padreAI){
                areaInteres = await this.suggester(areasInteres.map(b => b.titulo) ,areasInteres.map(b => b), false, `Que Area de Interés es padre de ${this.nota.titulo}?:`);
                if (areaInteres === null) {
                    new Notice("Sin Area de Interes");
                    titulo = "";
                    nivel = 0;
                    return; // Termina la ejecución de la función aquí.
                }
                else{ // QUE HACE ESTE ELSE??
                    this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
                    if (areaInteres.areaVida === null) {
                        this.nota.areaVida = "No es de ningún Area de Vida";
                    } else {
                        debugger;
                        this.nota.areaVida = areaInteres.areaVida.replace(/\[\[\s*|\s*\]\]/g, '');
                    }
                    titulo = areaInteres.titulo;
                    nivel = parseInt(areaInteres.nivelAI) + 1;
                }
            }else{
                titulo = "";
                nivel = 0;
            }                
	    this.nota.nivelAI = nivel;
        return titulo;
     }else{
       return this.nota.areaInteres; 
       }
    }

  }