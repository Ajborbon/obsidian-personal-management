import { TFile, Notice } from 'obsidian';
import MyPlugin from '../../../main';
import { Task, EstadoTarea } from '../Interfaces/taskInterfaces';



function obtenerFechaLocal(): Date {
    const ahora = new Date();
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

function parsearFechaVencimiento(fechaStr: string): Date {
    // Parsear la fecha y establecerla a las 00:00:00 en la zona horaria local
    const partes = fechaStr.split('-');
    return new Date(
        parseInt(partes[0]), // año
        parseInt(partes[1]) - 1, // mes (0-11)
        parseInt(partes[2]) // día
    );
}

// Agregar la función normalizarHora que falta:
function normalizarHora(hora: string): string | null {
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


export function extraerFechasYHoras(linea: string): {
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
        horaInicio: horaInicioMatch ? normalizarHora(horaInicioMatch[1].trim()) : undefined,
        horaFin: horaFinMatch ? normalizarHora(horaFinMatch[1].trim()) : undefined
    };
}

function limpiarTextoTarea(linea: string): string {
    return linea
        .replace(/^- \[ \]/, '')
        .replace(/➕ \d{4}-\d{2}-\d{2}/, '')
        .replace(/📅 \d{4}-\d{2}-\d{2}/, '')
        .replace(/⏳ \d{4}-\d{2}-\d{2}/, '')
        .replace(/🛫 \d{4}-\d{2}-\d{2}/, '')
        .replace(/\[hI:[^\]]+\]/, '')
        .replace(/\[hF:[^\]]+\]/, '')
        .replace(/\[link\]\([^\)]+\)/, '')
        .replace(/#\w+/, '')
        .replace(/%%\[todoist_id:: \d+\]%%/, '')
        .trim();
}

function obtenerTituloNota(file: TFile, plugin: MyPlugin): string {
    const metadata = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
    
    // Verificar si existen aliases y manejar tanto string como array
    if (metadata?.aliases) {
        if (Array.isArray(metadata.aliases)) {
            return metadata.aliases[0];
        } else if (typeof metadata.aliases === 'string') {
            return metadata.aliases;
        }
    }
    
    // Si no hay aliases pero hay titulo en frontmatter
    if (metadata?.titulo) {
        return metadata.titulo;
    }

    // Si el nombre del archivo incluye el tipo de nota, intentar extraer un nombre más limpio
    const nombreArchivo = file.basename;
    const coincidencia = nombreArchivo.match(/(?:PGTD|PQ|AI|AV|Ax|RR|DJ|OCA|CAC) - (.+)/);
    if (coincidencia && coincidencia[1]) {
        return coincidencia[1];
    }
    
    // Si todo lo demás falla, usar el nombre del archivo
    return nombreArchivo;
}

export async function getTareasVencidasAbiertas(plugin: MyPlugin): Promise<Task[]> {
    const files = plugin.app.vault.getMarkdownFiles();
    const tareas: Task[] = [];
    const hoy = obtenerFechaLocal();
    
    console.log("\n=== INICIO DE BÚSQUEDA DE TAREAS VENCIDAS ===");
    console.log(`Fecha actual (local): ${hoy.toLocaleDateString()}`);
    console.log(`Total de archivos a procesar: ${files.length}`);

    let archivosConTareas = 0;
    let tareasAnalizadas = 0;

    for (const file of files) {
        let archivoTieneTareas = false;
        const contenido = await plugin.app.vault.cachedRead(file);
        const lineas = contenido.split('\n');
        let tareasEnArchivo = 0;
        
        const tituloNota = obtenerTituloNota(file, plugin);
        
        for (const linea of lineas) {
            if (linea.trim().startsWith('- [ ]')) {
                tareasAnalizadas++;
                tareasEnArchivo++;
                
                const fechasYHoras = extraerFechasYHoras(linea);
                
                // Solo procesar si tiene fecha de vencimiento
                if (fechasYHoras.fechaVencimiento) {
                    const fechaV = parsearFechaVencimiento(fechasYHoras.fechaVencimiento);
                    
                    if (fechaV < hoy) {
                        if (!archivoTieneTareas) {
                            console.log(`\nArchivo: [[${file.path}|${tituloNota}]]`);
                            archivoTieneTareas = true;
                            archivosConTareas++;
                        }

                        let textoTarea = limpiarTextoTarea(linea);
                        console.log(`- Tarea vencida: "${textoTarea}" (Vence: ${fechasYHoras.fechaVencimiento})`);
                        
                        const tarea: Task = {
                            texto: textoTarea,
                            rutaArchivo: file.path,
                            nombreArchivo: file.basename,
                            titulo: tituloNota,
                            estado: EstadoTarea.Vencida,
                            ...fechasYHoras,  // Incluye todas las fechas y horas extraídas
                            etiquetas: extraerEtiquetas(linea)
                        };
                        
                        tareas.push(tarea);
                    }
                }
            }
        }
        
        if (tareasEnArchivo > 0) {
            console.log(`Total de tareas analizadas en el archivo: ${tareasEnArchivo}`);
        }
    }

    console.log(`\n=== RESUMEN FINAL DE BÚSQUEDA ===`);
    console.log(`Archivos procesados: ${files.length}`);
    console.log(`Archivos con tareas vencidas: ${archivosConTareas}`);
    console.log(`Total de tareas analizadas: ${tareasAnalizadas}`);
    console.log(`Total de tareas vencidas encontradas: ${tareas.length}`);

    return tareas;
}

function extraerEtiquetas(linea: string): string[] {
    const matches = linea.match(/#[\w\/]+/g);
    return matches ? matches : [];
}

export async function mostrarTareasVencidas(plugin: MyPlugin): Promise<void> {
    console.log("Iniciando búsqueda de tareas vencidas taskManager...");
    const tareas = await getTareasVencidasAbiertas(plugin);
    
    if (tareas.length === 0) {
        console.log("No se encontraron tareas vencidas");
        new Notice('No hay tareas vencidas abiertas.');
        return;
    }

    console.log(`Preparando vista para ${tareas.length} tareas vencidas`);

    const hoy = obtenerFechaLocal();
    let contenido = "# Tareas Vencidas Abiertas\n\n";

    // Agregar bloque dataviewjs con botón de actualización
    contenido += "```dataviewjs\n";
    contenido += `const gp = app.plugins.plugins['obsidian-personal-management'];
if (!gp) {
    dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
    return;
}

const container = this.container;
const btn = container.createEl('button', {text: '🔄 Actualizar Tareas Vencidas'});

btn.style.padding = '5px 15px';
btn.style.backgroundColor = '#1e1e1e';
btn.style.color = '#ffffff';
btn.style.border = '1px solid #4a4a4a';
btn.style.borderRadius = '4px';
btn.style.cursor = 'pointer';
btn.style.marginBottom = '10px';

btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = '#2e2e2e';
});
btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = '#1e1e1e';
});

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando tareas vencidas...');
        await gp.mostrarTareasVencidas();
    } catch (error) {
        console.error('Error al actualizar tareas:', error);
        new Notice('Error al actualizar tareas vencidas');
    }
});
\`\`\`\n\n`;

    contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    contenido += `> Total de tareas vencidas encontradas: ${tareas.length}\n\n`;
    
    const tareasPorArchivo = tareas.reduce((acc, tarea) => {
        if (!acc[tarea.rutaArchivo]) {
            acc[tarea.rutaArchivo] = {
                titulo: tarea.titulo,
                tareas: []
            };
        }
        acc[tarea.rutaArchivo].tareas.push(tarea);
        return acc;
    }, {} as { [key: string]: { titulo: string; tareas: Task[] } });

    for (const rutaArchivo in tareasPorArchivo) {
        contenido += `## [[${rutaArchivo}|${tareasPorArchivo[rutaArchivo].titulo}]]\n\n`;
        tareasPorArchivo[rutaArchivo].tareas.forEach(tarea => {
            const fechaVenc = parsearFechaVencimiento(tarea.fechaVencimiento);
            const diasVencida = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 3600 * 24));
            const estadoVencimiento = diasVencida === 0 ? "Vence hoy" : 
                                    diasVencida === 1 ? "Venció ayer" :
                                    `Venció hace ${diasVencida} días`;
            
            contenido += `- [ ] ${tarea.texto}\n`;
            contenido += `    - 📅 ${tarea.fechaVencimiento} *(${estadoVencimiento})*\n`;
            
            // Agregar fechas adicionales si existen
            if (tarea.fechaScheduled) {
                contenido += `    - ⏳ ${tarea.fechaScheduled}\n`;
            }
            if (tarea.fechaStart) {
                contenido += `    - 🛫 ${tarea.fechaStart}\n`;
            }
            if (tarea.horaInicio || tarea.horaFin) {
                contenido += `    - ⏰ ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
            }
        });
        contenido += "\n";
    }

    try {
        const folderSistemaGTD = plugin.settings.folder_SistemaGTD;
        const folder = plugin.app.vault.getAbstractFileByPath(folderSistemaGTD);
        
        if (!folder) {
            throw new Error(`La carpeta ${folderSistemaGTD} no existe`);
        }

        const nombreArchivo = `${folderSistemaGTD}/Tareas Vencidas xFile.md`;
        const archivoExistente = plugin.app.vault.getAbstractFileByPath(nombreArchivo);
        
        if (archivoExistente instanceof TFile) {
            await plugin.app.vault.modify(archivoExistente, contenido);
            await plugin.app.workspace.getLeaf().openFile(archivoExistente);
            console.log(`Archivo actualizado en: ${nombreArchivo}`);
        } else {
            const nuevoArchivo = await plugin.app.vault.create(nombreArchivo, contenido);
            await plugin.app.workspace.getLeaf().openFile(nuevoArchivo);
            console.log(`Nuevo archivo creado en: ${nombreArchivo}`);
        }

        new Notice(`Se encontraron ${tareas.length} tareas vencidas`);
        console.log("Vista de tareas vencidas creada exitosamente");
    } catch (error) {
        console.error("Error al crear/actualizar la vista:", error);
        new Notice(`Error al mostrar las tareas vencidas: ${error.message}`);
        
        if (error.message.includes("no existe")) {
            try {
                await plugin.app.vault.createFolder(plugin.settings.folder_SistemaGTD);
                new Notice(`Se creó la carpeta ${plugin.settings.folder_SistemaGTD}. Intentando nuevamente...`);
                await mostrarTareasVencidas(plugin);
            } catch (folderError) {
                console.error("Error al crear la carpeta:", folderError);
                new Notice("No se pudo crear la carpeta del sistema GTD");
            }
        }
    }
}