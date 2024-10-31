// src/modules/taskManager/utils/taskUtils.ts

import { TFile } from 'obsidian';
import MyPlugin from '../../../main';

export class TaskUtils {
    constructor(private plugin: MyPlugin) {}

    public obtenerFechaLocal(): Date {
        const ahora = new Date();
        return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    }

    public parsearFechaVencimiento(fechaStr: string): Date {
        const partes = fechaStr.split('-');
        return new Date(
            parseInt(partes[0]),
            parseInt(partes[1]) - 1,
            parseInt(partes[2])
        );
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
 

    public extraerEtiquetas(linea: string): string[] {
        const etiquetas: string[] = [];
        
        // Patrón para identificar diferentes formatos de etiquetas
        const patronesEtiquetas = [
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
            if (etiqueta.startsWith('#todoist')) {
                categoriasConocidas.todoist.push(etiqueta);
            } else if (etiqueta.match(/#cx(?:[/-]|$)/)) {
                categoriasConocidas.cx.push(etiqueta);
            } else if (etiqueta.match(/#px(?:[/-]|$)/)) {
                categoriasConocidas.px.push(etiqueta);
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

    public categorizarEtiquetas(etiquetas: string[]): {
        todoist: string[],
        contextos: string[],
        personas: string[],
        otras: string[]
    } {
        return {
            todoist: etiquetas.filter(e => e.startsWith('#todoist')),
            // Filtrar #cx solo y transformar el formato
            contextos: etiquetas
                .filter(e => e.match(/#cx(?:[/-].+)$/))
                .map(e => this.limpiarPrefijo(e, 'cx')),
            // Filtrar #px solo y transformar el formato
            personas: etiquetas
                .filter(e => e.match(/#px(?:[/-].+)$/))
                .map(e => this.limpiarPrefijo(e, 'px')),
            otras: etiquetas.filter(e => !e.match(/#(todoist|cx|px)(?:[/-]|$)/))
        };
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

    private limpiarPrefijo(etiqueta: string, prefijo: string): string {
        // Remover el prefijo (#cx o #px) y el separador (/ o -)
        const sinPrefijo = etiqueta.replace(new RegExp(`#${prefijo}[/-]`), '');
        
        // Convertir separadores restantes a formato legible
        return sinPrefijo
            .replace(/-/g, ' → ')  // Reemplazar guiones con flechas
            .replace(/\//g, ' → '); // Reemplazar slashes con flechas
    }

    private formatearEtiquetasParaVista(categorias: {
        todoist: string[],
        contextos: string[],
        personas: string[],
        otras: string[]
    }): string {
        let resultado = '';

        if (categorias.todoist.length > 0) {
            resultado += `    - Todoist: ${categorias.todoist.join(' ')}\n`;
        }

        if (categorias.contextos.length > 0) {
            resultado += `    - Contextos: ${categorias.contextos.join(' | ')}\n`;
        }

        if (categorias.personas.length > 0) {
            resultado += `    - Personas: ${categorias.personas.join(' | ')}\n`;
        }

        if (categorias.otras.length > 0) {
            resultado += `    - Otras: ${categorias.otras.join(' ')}\n`;
        }

        return resultado;
    }

}