import { TFile, Notice } from 'obsidian';
import MyPlugin from '../../main';

export interface Task {
    texto: string;
    archivo: string;
    titulo: string;
    fechaVencimiento: string;
}

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
                
                const patronesVencimiento = [
                    /📅 (\d{4}-\d{2}-\d{2})/,
                    /due:(\d{4}-\d{2}-\d{2})/,
                    /\[due::(\d{4}-\d{2}-\d{2})\]/
                ];
                
                let fechaVencimiento = null;
                for (const patron of patronesVencimiento) {
                    const match = linea.match(patron);
                    if (match) {
                        fechaVencimiento = match[1];
                        break;
                    }
                }
                
                if (fechaVencimiento) {
                    const fechaV = parsearFechaVencimiento(fechaVencimiento);
                    
                    if (fechaV < hoy) {
                        if (!archivoTieneTareas) {
                            console.log(`\nArchivo: [[${file.path}|${tituloNota}]]`);
                            archivoTieneTareas = true;
                            archivosConTareas++;
                        }

                        let textoTarea = linea
                            .replace(/^- \[ \]/, '')
                            .replace(/➕ \d{4}-\d{2}-\d{2}/, '')
                            .replace(/📅 \d{4}-\d{2}-\d{2}/, '')
                            .replace(/\[link\]\([^\)]+\)/, '')
                            .replace(/#\w+/, '')
                            .replace(/%%\[todoist_id:: \d+\]%%/, '')
                            .trim();
                        
                        console.log(`- Tarea vencida: "${textoTarea}" (Vence: ${fechaVencimiento})`);
                        
                        tareas.push({
                            texto: textoTarea,
                            archivo: file.path,
                            titulo: tituloNota,
                            fechaVencimiento: fechaVencimiento
                        });
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

export async function mostrarTareasVencidas(plugin: MyPlugin): Promise<void> {
    console.log("Iniciando búsqueda de tareas vencidas...");
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

// Estilizar el botón
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
        if (!acc[tarea.archivo]) {
            acc[tarea.archivo] = {
                titulo: tarea.titulo,
                tareas: []
            };
        }
        acc[tarea.archivo].tareas.push(tarea);
        return acc;
    }, {});

    for (const archivo in tareasPorArchivo) {
        contenido += `## [[${archivo}|${tareasPorArchivo[archivo].titulo}]]\n\n`;
        tareasPorArchivo[archivo].tareas.forEach(tarea => {
            const fechaVenc = parsearFechaVencimiento(tarea.fechaVencimiento);
            const diasVencida = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 3600 * 24));
            const estadoVencimiento = diasVencida === 0 ? "Vence hoy" : 
                                    diasVencida === 1 ? "Venció ayer" :
                                    `Venció hace ${diasVencida} días`;
            
            contenido += `- [ ] ${tarea.texto}\n`;
            contenido += `    - 📅 ${tarea.fechaVencimiento} *(${estadoVencimiento})*\n`;
        });
        contenido += "\n";
    }

    try {
        // Obtener la carpeta del sistema GTD
        const folderSistemaGTD = plugin.settings.folder_SistemaGTD;
        const folder = plugin.app.vault.getAbstractFileByPath(folderSistemaGTD);
        
        // Verificar que la carpeta existe
        if (!folder) {
            throw new Error(`La carpeta ${folderSistemaGTD} no existe`);
        }

        // Generar nombre de archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
        const nombreArchivo = `${folderSistemaGTD}/Tareas Vencidas xFile.md`;
        
        // Verificar si el archivo ya existe
        const archivoExistente = plugin.app.vault.getAbstractFileByPath(nombreArchivo);
        
        if (archivoExistente instanceof TFile) {
            // Si existe, actualizar su contenido
            await plugin.app.vault.modify(archivoExistente, contenido);
            await plugin.app.workspace.getLeaf().openFile(archivoExistente);
            console.log(`Archivo actualizado en: ${nombreArchivo}`);
        } else {
            // Si no existe, crear nuevo archivo
            const nuevoArchivo = await plugin.app.vault.create(nombreArchivo, contenido);
            await plugin.app.workspace.getLeaf().openFile(nuevoArchivo);
            console.log(`Nuevo archivo creado en: ${nombreArchivo}`);
        }

        new Notice(`Se encontraron ${tareas.length} tareas vencidas`);
        console.log("Vista de tareas vencidas creada exitosamente");
    } catch (error) {
        console.error("Error al crear/actualizar la vista:", error);
        new Notice(`Error al mostrar las tareas vencidas: ${error.message}`);
        
        // Si hay error con la carpeta, intentar crearla
        if (error.message.includes("no existe")) {
            try {
                await plugin.app.vault.createFolder(plugin.settings.folder_SistemaGTD);
                new Notice(`Se creó la carpeta ${plugin.settings.folder_SistemaGTD}. Intentando nuevamente...`);
                // Llamar recursivamente la función después de crear la carpeta
                await mostrarTareasVencidas(plugin);
            } catch (folderError) {
                console.error("Error al crear la carpeta:", folderError);
                new Notice("No se pudo crear la carpeta del sistema GTD");
            }
        }
    }
}