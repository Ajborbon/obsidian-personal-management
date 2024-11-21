// src/modules/taskManager/utils/taskUtils.ts

import { TFile } from 'obsidian';
import MyPlugin from '../../../main';

export class TaskUtils {
    constructor(private plugin: MyPlugin) {}
    
    public compararFechas(fecha1: Date | null, fecha2: Date | null): number {
        if (!fecha1 && !fecha2) return 0;
        if (!fecha1) return 1;  // null se considera mayor
        if (!fecha2) return -1; // null se considera mayor
        return fecha1.getTime() - fecha2.getTime();
    }

    private normalizarHora(hora: string): string | null {
        const patrones = [
            /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i,
            /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i,
            /^(\d{1,2}):(\d{2})$/
        ];

        for (const patron of patrones) {
            const match = hora.toLowerCase().match(patron);
            if (match) {
                let horas = parseInt(match[1]);
                const minutos = match[2] ? match[2] : '00';
                const periodo = match[3];

                if (periodo === 'pm' && horas < 12) horas += 12;
                if (periodo === 'am' && horas === 12) horas = 0;

                return `${horas.toString().padStart(2, '0')}:${minutos}`;
            }
        }
        return null;
    }

    public extraerFechasYHoras(linea: string): {
        fechaCreacion?: string;
        fechaScheduled?: string;
        fechaStart?: string;
        fechaVencimiento?: string;
        horaInicio?: string;
        horaFin?: string;
    } {
        const horaInicioMatch = linea.match(/\[hI:\s*([^\]]+)\]/);
        const horaFinMatch = linea.match(/\[hF:\s*([^\]]+)\]/);

        return {
            fechaCreacion: linea.match(/➕ (\d{4}-\d{2}-\d{2})/)?.[1],
            fechaScheduled: linea.match(/⏳ (\d{4}-\d{2}-\d{2})/)?.[1],
            fechaStart: linea.match(/🛫 (\d{4}-\d{2}-\d{2})/)?.[1],
            fechaVencimiento: linea.match(/📅 (\d{4}-\d{2}-\d{2})/)?.[1],
            horaInicio: horaInicioMatch ? this.normalizarHora(horaInicioMatch[1].trim()) : undefined,
            horaFin: horaFinMatch ? this.normalizarHora(horaFinMatch[1].trim()) : undefined
        };
    }

    public obtenerTituloNota(file: TFile): string {
        const metadata = this.plugin.app.metadataCache.getFileCache(file)?.frontmatter;
        
        if (metadata?.aliases) {
            if (Array.isArray(metadata.aliases)) return metadata.aliases[0];
            if (typeof metadata.aliases === 'string') return metadata.aliases;
        }
        
        if (metadata?.titulo) return metadata.titulo;

        const coincidencia = file.basename.match(/(?:PGTD|PQ|AI|AV|Ax|RR|DJ|OCA|CAC) - (.+)/);
        if (coincidencia && coincidencia[1]) return coincidencia[1];
        
        return file.basename;
    }
 


    public categorizarEtiquetas(etiquetas: string[]): {
        todoist: string[],
        contextos: string[],
        personas: string[],
        otras: string[]
    } {
        return {
            todoist: etiquetas.filter(e => e.startsWith('#todoist')),
            contextos: etiquetas
                .filter(e => e.match(/#cx(?:[/-].+)$/))
                .map(e => this.limpiarPrefijo(e, 'cx')),
            personas: etiquetas
                .filter(e => e.startsWith('#px-'))
                .map(e => this.formatearEtiquetaPersona(e)),
            otras: etiquetas.filter(e => 
                !e.startsWith('#todoist') && 
                !e.match(/#cx(?:[/-]|$)/) && 
                !e.startsWith('#px-')
            )
        };
    }

    // Nuevo método para formatear etiquetas de personas
    private formatearEtiquetaPersona(etiqueta: string): string {
        // Eliminar el prefijo #px-
        const nombre = etiqueta.replace('#px-', '');
        // Reemplazar guiones bajos con espacios para mejor legibilidad
        return nombre.replace(/_/g, ' ');
    }

    private limpiarPrefijo(etiqueta: string, prefijo: string): string {
        const sinPrefijo = etiqueta.replace(new RegExp(`#${prefijo}[/-]`), '');
        return sinPrefijo
            .replace(/-/g, ' → ')
            .replace(/\//g, ' → ');
    }




    public limpiarTextoTarea(linea: string): string {
        let textoLimpio = linea
            // Eliminar el checkbox de la tarea
            .replace(/^- \[ \]/, '')
            
            // Eliminar fechas con emojis
            .replace(/[➕📅⏳🛫] \d{4}-\d{2}-\d{2}/g, '')
            
            // Eliminar horas de inicio y fin
            .replace(/\[hI:[^\]]+\]/g, '')
            .replace(/\[hF:[^\]]+\]/g, '')
            
            // Eliminar enlaces
            .replace(/\[link\]\([^\)]+\)/g, '')
            
            // Eliminar IDs de todoist
            .replace(/%%\[todoist_id:: \d+\]%%/g, '')
            
            // Eliminar todas las etiquetas (considerando los nuevos formatos)
            .replace(/#[\w-]+(?:\/[\w-]+)*\b/g, '')
            .replace(/#[\w-]+(?:-[\w-]+)*\b/g, '');

        // Eliminar múltiples espacios y espacios al inicio/final
        textoLimpio = textoLimpio
            .replace(/\s+/g, ' ')
            .trim();

        return textoLimpio;
    }

   
    // Método de utilidad para obtener una representación jerárquica de las etiquetas
    public obtenerJerarquiaEtiquetas(etiquetas: string[]): Map<string, Set<string>> {
        const jerarquia = new Map<string, Set<string>>();

        etiquetas.forEach(etiqueta => {
            // Eliminar el # inicial
            const partes = etiqueta.slice(1).split(/[/-]/);
            const categoria = partes[0];

            if (!jerarquia.has(categoria)) {
                jerarquia.set(categoria, new Set());
            }

            if (partes.length > 1) {
                const subetiquetas = partes.slice(1).join('/');
                jerarquia.get(categoria)?.add(subetiquetas);
            }
        });

        return jerarquia;
    }


    public obtenerFechaLocal(): Date {
        const ahora = new Date();

        // Asegurar que estamos trabajando con la fecha local
        return new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate(),
            0, 0, 0
        );
    }

    public parsearFechaVencimiento(fechaStr: string | null | undefined): Date | null {
        if (!fechaStr) return null;
        try {
            // Asegurar que interpretamos la fecha en la zona horaria local
            const [año, mes, dia] = fechaStr.split('-').map(num => parseInt(num));
            if (isNaN(año) || isNaN(mes) || isNaN(dia)) return null;
            
            // Crear la fecha en la zona horaria local
            const fecha = new Date(año, mes - 1, dia, 0, 0, 0);
            return fecha;
        } catch (error) {
            console.error('Error parseando fecha:', error);
            return null;
        }
    }

    public normalizarFechaAString(fecha: Date): string {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
    }

    public extraerDependenciasYIds(linea: string): { taskId?: string; dependencyId?: string } {
        console.log("Analizando línea para IDs:", linea);
        
        const resultado = {
            taskId: undefined as string | undefined,
            dependencyId: undefined as string | undefined
        };
    
        // Extraer ID propio de la tarea
        const taskIdMatch = linea.match(/🆔\s*([a-z0-9]{5,7})/);
        if (taskIdMatch) {
            resultado.taskId = taskIdMatch[1];
            console.log("ID encontrado:", resultado.taskId);
        }
    
        // Extraer ID de dependencia
        const dependencyMatch = linea.match(/⛔\s*([a-z0-9]{5,7})/);
        if (dependencyMatch) {
            resultado.dependencyId = dependencyMatch[1];
            console.log("Dependencia encontrada:", resultado.dependencyId);
        }
    
        return resultado;
    }
    
    public async verificarEstadoTarea(taskId: string): Promise<{
        completada: boolean;
        rutaArchivo?: string;
        tituloArchivo?: string;
        textoTarea?: string;
    }> {
        console.log("\nVerificando estado de tarea:", taskId);
        
        // Obtener todos los archivos y filtrar los excluidos
        const todosLosArchivos = this.plugin.app.vault.getMarkdownFiles();
        const filesParaProcesar = todosLosArchivos.filter(file => !this.debeExcluirArchivo(file));
        
        console.log(`Buscando en ${filesParaProcesar.length} archivos (excluidos: ${todosLosArchivos.length - filesParaProcesar.length})`);
        
        for (const file of filesParaProcesar) {
            try {
                const contenido = await this.plugin.app.vault.cachedRead(file);
                const lineas = contenido.split('\n');
                
                for (const linea of lineas) {
                    if (linea.includes(`🆔 ${taskId}`)) {
                        const estaCompletada = linea.trim().startsWith('- [x]');
                        const tituloArchivo = this.obtenerTituloNota(file);
                        const textoTarea = this.limpiarTextoTarea(linea);
                        console.log("Tarea encontrada en:", file.path);
                        console.log("Estado completada:", estaCompletada);
                        console.log("Texto de la tarea:", textoTarea);
                        
                        return {
                            completada: estaCompletada,
                            rutaArchivo: file.path,
                            tituloArchivo: tituloArchivo,
                            textoTarea: textoTarea
                        };
                    }
                }
            } catch (error) {
                console.error(`Error procesando archivo ${file.path}:`, error);
            }
        }
        
        console.log("Tarea no encontrada en los archivos permitidos");
        return {
            completada: false
        };
    }


    // En la clase TaskUtils

public extraerEtiquetas(linea: string): string[] {
    const etiquetas: string[] = [];
    
    // Patrones para identificar diferentes formatos de etiquetas
    const patronesEtiquetas = [
        // Etiquetas de personas con formato #px-Nombre_Apellido 
        /#px-[A-Za-z]+(?:_[A-Za-z]+)*(?:_[A-Za-z]+)?\b/g,
        
        // Etiquetas simples: #todoist
        /#[\w-]+\b/g,
        
        // Etiquetas con jerarquía usando "/": #cx/alguna/cosa
        /#[\w-]+(?:\/[\w-]+)+\b/g,
        
        // Etiquetas con jerarquía usando "-": #cx-alguna-cosa
        /#[\w-]+(?:-[\w-]+)+\b/g
    ];

    // Procesar cada patrón
    patronesEtiquetas.forEach(patron => {
        const coincidencias = linea.match(patron);
        if (coincidencias) {
            coincidencias.forEach(etiqueta => {
                // Evitar duplicados y asegurar que sea una etiqueta válida
                if (!etiquetas.includes(etiqueta) && this.esEtiquetaValida(etiqueta)) {
                    etiquetas.push(etiqueta);
                }
            });
        }
    });

    return this.organizarEtiquetas(etiquetas);
}

private esEtiquetaValida(etiqueta: string): boolean {
    // Verificar que la etiqueta cumpla con el formato básico
    if (!etiqueta.startsWith('#')) return false;

    // Validación específica para etiquetas de personas
    if (etiqueta.startsWith('#px-')) {
        const nombreCompleto = etiqueta.slice(4); // Remover '#px-'
        // Verificar formato Nombre_Apellido(_Empresa)?
        return /^[A-Za-z]+(?:_[A-Za-z]+)*$/.test(nombreCompleto);
    }

    // Verificar que no contenga caracteres inválidos
    const caracteresInvalidos = /[!@$%^&*()+={}\[\]:;"'<>,.?~\\|]/;
    if (caracteresInvalidos.test(etiqueta)) return false;

    // Verificar estructura para etiquetas con jerarquía
    const partesEtiqueta = etiqueta.slice(1).split(/[/-]/);
    return partesEtiqueta.every(parte => parte.length > 0);
}

private organizarEtiquetas(etiquetas: string[]): string[] {
    // Ordenar etiquetas por categorías conocidas y luego alfabéticamente
    const categoriasConocidas = {
        todoist: [] as string[],
        cx: [] as string[],
        px: [] as string[],
        otras: [] as string[]
    };

    etiquetas.forEach(etiqueta => {
        if (etiqueta.startsWith('#px-')) {
            categoriasConocidas.px.push(etiqueta);
        } else if (etiqueta.startsWith('#todoist')) {
            categoriasConocidas.todoist.push(etiqueta);
        } else if (etiqueta.match(/#cx(?:[/-]|$)/)) {
            categoriasConocidas.cx.push(etiqueta);
        } else {
            categoriasConocidas.otras.push(etiqueta);
        }
    });

    // Ordenar cada categoría alfabéticamente
    Object.values(categoriasConocidas).forEach(categoria => {
        categoria.sort((a, b) => a.localeCompare(b));
    });

    // Combinar todas las categorías en el orden deseado
    return [
        ...categoriasConocidas.todoist,
        ...categoriasConocidas.cx,
        ...categoriasConocidas.px,
        ...categoriasConocidas.otras
    ];
}

// Agregar método para verificar exclusiones
private debeExcluirArchivo(file: TFile): boolean {
    // Excluir la carpeta Plantillas y sus subcarpetas
    if (file.path.startsWith('Plantillas/')) {
        return true;
    }

    // Excluir la carpeta del sistema GTD y sus subcarpetas
    if (file.path.startsWith(`${this.plugin.settings.folder_SistemaGTD}/`)) {
        return true;
    }

    // Excluir carpeta de archivos (si existe)
    if (file.path.startsWith('Archivo/')) {
        return true;
    }

    return false;
}


}