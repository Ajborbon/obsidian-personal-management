import {utilsAPI} from './utilsAPI'
import { TFile } from 'obsidian';
import { SesionLectura } from '../Interfaces/SesionLectura';
import { RTBase } from './RTBase';
import {DateTime} from 'luxon';

export class SesionLectura extends RTBase implements SesionLectura{
    private utilsApi: utilsAPI;
    protected nota: object;
    protected infoSubsistema: any; 

    constructor(private plugin: Plugin, infoSubsistema: any) {
      super(plugin);
      this.plugin = plugin;
      this.utilsApi = new utilsAPI(plugin);
      this.tp = plugin.tp;
      this.nota = {};
      this.infoSubsistema = infoSubsistema;
    }

    async getId(): Promise<number> {
        let maxId = 0;
        debugger;
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

        // Get the current active note
        const currentNotePath = app.workspace.getActiveFile()?.path;
        const currentNota = app.metadataCache.getFileCache(app.workspace.getActiveFile())?.frontmatter;

        if (currentNota) {
            const existingSessions = registrosExistentes.filter((file: any) => file.path !== currentNotePath && app.metadataCache.getFileCache(file)?.frontmatter?.titulo === currentNota.titulo);
            if (existingSessions.length > 0) {
                const sortedSessions = existingSessions.sort((a: any, B: any) => parseInt(B.path.match(/[0-9]+/)[0]) - parseInt(A.path.match(/[0-9]+/)[0]));
                const lastSL = app.metadataCache.getFileCache(sortedSessions[0])?.frontmatter;
                this.nota.idSec = parseInt(lastSL.idSec) + 1;
                this.nota.pagInicio = lastSL.pagFin;
            } else {
                this.nota.idSec = 1;
                this.nota.pagInicio = 1;
            }
        } else {
            this.nota.idSec = 1;
            this.nota.pagInicio = 1;
        }
        return this.nota.id;
    }

    async getNota(): Promise<any> {
        return this.nota;
    }

    async getParametrosLibro() {
            debugger;
            const currentFile = app.workspace.getActiveFile();
            if (!currentFile || !currentFile.path) return;
            
            const metadataCache = app.metadataCache;
            const fileCache = metadataCache.getFileCache(currentFile);
        if (!fileCache || !fileCache.frontmatter || fileCache.frontmatter.type !== 'LB') {
            new Notice('La nota activa debe ser de tipo Libro en la Bibloteca para poder crear una sesión de Lectura.');
            return;
        }
            
            const frontMatter = fileCache.frontmatter;
            this.nota['paginas'] = frontMatter.paginas;
            this.nota['titulo'] = frontMatter.titulo;
            this.nota['palabrasPorHoja'] = frontMatter.palabrasPorHoja;
        }

    async getAsunto(): Promise<{ siAsunto: boolean, nombre: string[] }> { // Funciona con frontmatter
        let padres = [];
        let activo = app.workspace.getActiveFile();
        let siAsunto = true;
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
            debugger;
            this.nota.asuntoDefinido = true; // Para que no ejecute la busqueda de Area Vida, Area de Interés, proyecto Q o GTD
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
            return { siAsunto, nombre: padres }
        }

       



    
   

  }

  async getAliases(): Promise<string[]> {
    this.nota.aliases = [];
    this.nota.aliases.push(`SL - ${this.nota.idSec} / ${this.nota.titulo}`)
    return this.nota.aliases;
}

async getFecha(): Promise<string> {
    let fechaActual = DateTime.now();
    fechaActual = fechaActual.setLocale('es');
    fechaActual = fechaActual.toFormat('yyyy-MM-dd EEEE HH:mm');
    this.nota.fecha = fechaActual;
    return fechaActual;
}

async getRename(): Promise<string> {
    debugger;
    const newName = `${this.infoSubsistema.folder}/${this.infoSubsistema.type} - ${this.nota.id}.md`;
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