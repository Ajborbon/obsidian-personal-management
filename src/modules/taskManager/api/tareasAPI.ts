// src/modules/taskManager/api/tareasAPI.ts

import { TFile, Notice } from 'obsidian';
import MyPlugin from '../../../main';
import { Task, EstadoTarea } from '../interfaces/taskInterfaces';
import { TaskUtils } from '../utils/taskUtils';

export class TareasAPI {
    private taskUtils: TaskUtils;

    constructor(private plugin: MyPlugin) {
        this.taskUtils = new TaskUtils(plugin);
    }

    public async mostrarTareasVencidas(): Promise<void> {
        console.log("Iniciando búsqueda de tareas vencidas...");
        const tareas = await this.getTareasVencidasAbiertas();
        
        if (tareas.length === 0) {
            console.log("No se encontraron tareas vencidas");
            new Notice('No hay tareas vencidas abiertas.');
            return;
        }
    
        console.log(`Preparando vista para ${tareas.length} tareas vencidas`);
    
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = "# Tareas Vencidas\n\n";
    
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

btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2e2e2e');
btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#1e1e1e');

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando tareas vencidas...');
        await gp.tareasAPI.mostrarTareasVencidas();
    } catch (error) {
        console.error('Error al actualizar tareas:', error);
        new Notice('Error al actualizar tareas');
    }
});
\`\`\`\n\n`;
    
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Total de tareas vencidas encontradas: ${tareas.length}\n\n`;

        // Agrupar tareas por nivel de retraso
        const tareasAgrupadas = {
            criticas: tareas.filter(t => {
                const fechaVenc = this.taskUtils.parsearFechaVencimiento(t.fechaVencimiento);
                const diasVencida = Math.ceil((hoy.getTime() - fechaVenc.getTime()) / (1000 * 3600 * 24));
                return diasVencida > 7;
            }),
            recientes: tareas.filter(t => {
                const fechaVenc = this.taskUtils.parsearFechaVencimiento(t.fechaVencimiento);
                const diasVencida = Math.ceil((hoy.getTime() - fechaVenc.getTime()) / (1000 * 3600 * 24));
                return diasVencida <= 7;
            })
        };

        // Renderizar secciones
        if (tareasAgrupadas.criticas.length > 0) {
            contenido += `## 🔴 Vencidas hace más de una semana (${tareasAgrupadas.criticas.length})\n\n`;
            contenido += this.renderizarGrupoTareasDetallado(tareasAgrupadas.criticas, hoy);
        }

        if (tareasAgrupadas.recientes.length > 0) {
            contenido += `## 🟠 Vencidas recientemente (${tareasAgrupadas.recientes.length})\n\n`;
            contenido += this.renderizarGrupoTareasDetallado(tareasAgrupadas.recientes, hoy);
        }

        try {
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Vencidas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas vencidas`);
        } catch (error) {
            await this.manejarError(error);
        }
    }

    public async getTareasVencidasAbiertas(): Promise<Task[]> {
        const files = this.plugin.app.vault.getMarkdownFiles();
        const tareas: Task[] = [];
        const hoy = this.taskUtils.obtenerFechaLocal();
        
        for (const file of files) {
            const contenido = await this.plugin.app.vault.cachedRead(file);
            const lineas = contenido.split('\n');
            const tituloNota = this.taskUtils.obtenerTituloNota(file);
            
            for (const linea of lineas) {
                if (linea.trim().startsWith('- [ ]')) {
                    const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                    
                    if (fechasYHoras.fechaVencimiento) {
                        const fechaV = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaVencimiento);
                        
                        if (fechaV < hoy) {
                            // Extraer y categorizar etiquetas
                            const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                            const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                            const textoTarea = this.taskUtils.limpiarTextoTarea(linea);

                            const tarea: Task = {
                                texto: textoTarea,
                                rutaArchivo: file.path,
                                nombreArchivo: file.basename,
                                titulo: tituloNota,
                                estado: EstadoTarea.Vencida,
                                ...fechasYHoras,
                                etiquetas: {
                                    todas: etiquetasExtraidas,
                                    todoist: etiquetasCategorizadas.todoist || [],
                                    contextos: etiquetasCategorizadas.contextos || [],
                                    personas: etiquetasCategorizadas.personas || [],
                                    otras: etiquetasCategorizadas.otras || []
                                }
                            };
                            
                            tareas.push(tarea);
                        }
                    }
                }
            }
        }

        // Ordenar por fecha de vencimiento (más antiguas primero)
        return tareas.sort((a, b) => {
            if (!a.fechaVencimiento || !b.fechaVencimiento) return 0;
            return this.taskUtils.parsearFechaVencimiento(a.fechaVencimiento).getTime() -
                   this.taskUtils.parsearFechaVencimiento(b.fechaVencimiento).getTime();
        });
    }

    public async getTareasProximas(diasProximos: number = 7): Promise<Task[]> {
        const files = this.plugin.app.vault.getMarkdownFiles();
        const tareas: Task[] = [];
        const hoy = this.taskUtils.obtenerFechaLocal();
        const limiteFuturo = new Date(hoy);
        limiteFuturo.setDate(limiteFuturo.getDate() + diasProximos);
        
        console.log("\n=== INICIO DE BÚSQUEDA DE TAREAS PRÓXIMAS ===");
        console.log(`Fecha actual: ${hoy.toLocaleDateString()}`);
        console.log(`Buscando tareas hasta: ${limiteFuturo.toLocaleDateString()}`);
        
        for (const file of files) {
            const contenido = await this.plugin.app.vault.cachedRead(file);
            const lineas = contenido.split('\n');
            const tituloNota = this.taskUtils.obtenerTituloNota(file);
            
            for (const linea of lineas) {
                if (linea.trim().startsWith('- [ ]')) {
                    const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                    
                    if (fechasYHoras.fechaVencimiento) {
                        const fechaV = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaVencimiento);
                        
                        // Verificar si la fecha está en el rango deseado
                        if (fechaV <= limiteFuturo) {
                            // Extraer y categorizar etiquetas
                            const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                            const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                            const textoTarea = this.taskUtils.limpiarTextoTarea(linea);

                            const tarea: Task = {
                                texto: textoTarea,
                                rutaArchivo: file.path,
                                nombreArchivo: file.basename,
                                titulo: tituloNota,
                                estado: fechaV < hoy ? EstadoTarea.Vencida : EstadoTarea.Abierta,
                                ...fechasYHoras,
                                etiquetas: {
                                    todas: etiquetasExtraidas,
                                    todoist: etiquetasCategorizadas.todoist || [],
                                    contextos: etiquetasCategorizadas.contextos || [],
                                    personas: etiquetasCategorizadas.personas || [],
                                    otras: etiquetasCategorizadas.otras || []
                                }
                            };
                            
                            tareas.push(tarea);
                        }
                    }
                }
            }
        }

        // Ordenar tareas por fecha de vencimiento
        return tareas.sort((a, b) => {
            if (!a.fechaVencimiento || !b.fechaVencimiento) return 0;
            return this.taskUtils.parsearFechaVencimiento(a.fechaVencimiento).getTime() -
                   this.taskUtils.parsearFechaVencimiento(b.fechaVencimiento).getTime();
        });
    }

    public async mostrarTareasProximas(diasProximos: number = 7): Promise<void> {
        console.log("Iniciando búsqueda de tareas próximas...");
        const tareas = await this.getTareasProximas(diasProximos);
        
        if (tareas.length === 0) {
            console.log("No se encontraron tareas próximas");
            new Notice('No hay tareas próximas o vencidas.');
            return;
        }
    
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = "# Tareas Próximas y Vencidas\n\n";
    
        // Agregar bloque dataviewjs con botón de actualización
        contenido += "```dataviewjs\n";
        contenido += `const gp = app.plugins.plugins['obsidian-personal-management'];
if (!gp) {
    dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
    return;
}

const container = this.container;
const btn = container.createEl('button', {text: '🔄 Actualizar Vista'});

btn.style.padding = '5px 15px';
btn.style.backgroundColor = '#1e1e1e';
btn.style.color = '#ffffff';
btn.style.border = '1px solid #4a4a4a';
btn.style.borderRadius = '4px';
btn.style.cursor = 'pointer';
btn.style.marginBottom = '10px';

btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2e2e2e');
btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#1e1e1e');

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando vista...');
        await gp.tareasAPI.mostrarTareasProximas(${diasProximos});
    } catch (error) {
        console.error('Error al actualizar tareas:', error);
        new Notice('Error al actualizar tareas');
    }
});
\`\`\`\n\n`;
    
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Mostrando tareas vencidas y próximas a vencer en los siguientes ${diasProximos} días\n`;
        contenido += `> Total de tareas encontradas: ${tareas.length}\n\n`;

        // Agrupar tareas por estado
        const tareasAgrupadas = {
            vencidas: tareas.filter(t => {
                const fechaVenc = this.taskUtils.parsearFechaVencimiento(t.fechaVencimiento);
                return fechaVenc < hoy;
            }),
            hoy: tareas.filter(t => {
                const fechaVenc = this.taskUtils.parsearFechaVencimiento(t.fechaVencimiento);
                return fechaVenc.toDateString() === hoy.toDateString();
            }),
            proximas: tareas.filter(t => {
                const fechaVenc = this.taskUtils.parsearFechaVencimiento(t.fechaVencimiento);
                return fechaVenc > hoy;
            })
        };

        // Renderizar cada sección
        if (tareasAgrupadas.vencidas.length > 0) {
            contenido += `## 🔴 Tareas Vencidas (${tareasAgrupadas.vencidas.length})\n\n`;
            contenido += this.renderizarGrupoTareasDetallado(tareasAgrupadas.vencidas, hoy);
        }

        if (tareasAgrupadas.hoy.length > 0) {
            contenido += `## 🟡 Vencen Hoy (${tareasAgrupadas.hoy.length})\n\n`;
            contenido += this.renderizarGrupoTareasDetallado(tareasAgrupadas.hoy, hoy);
        }

        if (tareasAgrupadas.proximas.length > 0) {
            contenido += `## 🟢 Próximos ${diasProximos} Días (${tareasAgrupadas.proximas.length})\n\n`;
            contenido += this.renderizarGrupoTareasDetallado(tareasAgrupadas.proximas, hoy);
        }

        try {
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Próximas y Vencidas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas`);
        } catch (error) {
            await this.manejarError(error);
        }
    }

    private renderizarGrupoTareasDetallado(tareas: Task[], fechaHoy: Date): string {
        let contenido = '';
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            
            info.tareas.forEach(tarea => {
                contenido += `- [ ] ${tarea.texto}\n`;
                
                // Mostrar fechas con información contextual
                if (tarea.fechaVencimiento) {
                    const fechaVenc = this.taskUtils.parsearFechaVencimiento(tarea.fechaVencimiento);
                    const diasDiferencia = Math.ceil((fechaVenc.getTime() - fechaHoy.getTime()) / (1000 * 3600 * 24));
                    
                    let estadoVencimiento = '';
                    if (diasDiferencia < 0) {
                        estadoVencimiento = `⚠️ Vencida hace ${Math.abs(diasDiferencia)} días`;
                    } else if (diasDiferencia === 0) {
                        estadoVencimiento = '⚠️ Vence hoy';
                    } else {
                        estadoVencimiento = `📅 Vence en ${diasDiferencia} días`;
                    }
                    
                    contenido += `    - ${estadoVencimiento} (${tarea.fechaVencimiento})\n`;
                }

                // Mostrar horas si existen
                if (tarea.horaInicio || tarea.horaFin) {
                    contenido += `    - ⏰ ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
                }
                
                // Mostrar otras fechas relevantes
                if (tarea.fechaStart && tarea.fechaStart !== tarea.fechaVencimiento) {
                    contenido += `    - 🛫 Comienza: ${tarea.fechaStart}\n`;
                }
                if (tarea.fechaScheduled && 
                    tarea.fechaScheduled !== tarea.fechaStart && 
                    tarea.fechaScheduled !== tarea.fechaVencimiento) {
                    contenido += `    - ⏳ Programada: ${tarea.fechaScheduled}\n`;
                }

                // Mostrar etiquetas categorizadas
                if (tarea.etiquetas.contextos && tarea.etiquetas.contextos.length > 0) {
                    contenido += `    - 🔄 ${tarea.etiquetas.contextos.join(' | ')}\n`;
                }
                
                if (tarea.etiquetas.personas && tarea.etiquetas.personas.length > 0) {
                    contenido += `    - 👤 ${tarea.etiquetas.personas.join(' | ')}\n`;
                }
                
                if (tarea.etiquetas.todoist && tarea.etiquetas.todoist.length > 0) {
                    contenido += `    - ✅ ${tarea.etiquetas.todoist.join(' ')}\n`;
                }
                
                if (tarea.etiquetas.otras && tarea.etiquetas.otras.length > 0) {
                    contenido += `    - 🏷️ ${tarea.etiquetas.otras.join(' ')}\n`;
                }
            });
            contenido += '\n';
        }
        
        return contenido;
    }


    private agruparTareasPorArchivo(tareas: Task[]): { [key: string]: { titulo: string; tareas: Task[] } } {
        return tareas.reduce((acc, tarea) => {
            if (!acc[tarea.rutaArchivo]) {
                acc[tarea.rutaArchivo] = {
                    titulo: tarea.titulo,
                    tareas: []
                };
            }
            acc[tarea.rutaArchivo].tareas.push(tarea);
            return acc;
        }, {});
    }

    private obtenerEstadoVencimiento(diasRestantes: number): string {
        if (diasRestantes < 0) return `Venció hace ${Math.abs(diasRestantes)} días`;
        if (diasRestantes === 0) return "Vence hoy";
        if (diasRestantes === 1) return "Vence mañana";
        return `Vence en ${diasRestantes} días`;
    }

    private async guardarYAbrirArchivo(nombreArchivo: string, contenido: string): Promise<void> {
        const archivoExistente = this.plugin.app.vault.getAbstractFileByPath(nombreArchivo);
        
        if (archivoExistente instanceof TFile) {
            await this.plugin.app.vault.modify(archivoExistente, contenido);
            await this.plugin.app.workspace.getLeaf().openFile(archivoExistente);
        } else {
            const nuevoArchivo = await this.plugin.app.vault.create(nombreArchivo, contenido);
            await this.plugin.app.workspace.getLeaf().openFile(nuevoArchivo);
        }
    }

    private async manejarError(error: Error): Promise<void> {
        console.error("Error al crear/actualizar la vista:", error);
        new Notice(`Error al mostrar las tareas: ${error.message}`);
        
        if (error.message.includes("no existe")) {
            try {
                await this.plugin.app.vault.createFolder(this.plugin.settings.folder_SistemaGTD);
                new Notice(`Se creó la carpeta ${this.plugin.settings.folder_SistemaGTD}. Intentando nuevamente...`);
                await this.mostrarTareasProximas();
            } catch (folderError) {
                console.error("Error al crear la carpeta:", folderError);
                new Notice("No se pudo crear la carpeta del sistema GTD");
            }
        }
    }

    public async getTareasHoy(): Promise<Task[]> {
        const files = this.plugin.app.vault.getMarkdownFiles();
        const tareas: Task[] = [];
        const hoy = this.taskUtils.obtenerFechaLocal();
        const fechaHoyStr = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        console.log("\n=== INICIO DE BÚSQUEDA DE TAREAS PARA HOY ===");
        console.log(`Fecha actual: ${fechaHoyStr}`);

        for (const file of files) {
            const contenido = await this.plugin.app.vault.cachedRead(file);
            const lineas = contenido.split('\n');
            const tituloNota = this.taskUtils.obtenerTituloNota(file);
            
            for (const linea of lineas) {
                if (linea.trim().startsWith('- [ ]')) {
                    const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                    const tieneAlgunaFechaHoy = (
                        fechasYHoras.fechaScheduled === fechaHoyStr ||
                        fechasYHoras.fechaStart === fechaHoyStr ||
                        fechasYHoras.fechaVencimiento === fechaHoyStr
                    );

                    if (tieneAlgunaFechaHoy) {
                        const textoTarea = this.taskUtils.limpiarTextoTarea(linea);
                        const etiquetasCompletas = this.taskUtils.extraerEtiquetas(linea);
                        const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasCompletas);

                        tareas.push({
                            texto: textoTarea,
                            rutaArchivo: file.path,
                            nombreArchivo: file.basename,
                            titulo: tituloNota,
                            estado: EstadoTarea.Abierta,
                            ...fechasYHoras,
                            etiquetas: {
                                todas: etiquetasCompletas,
                                ...etiquetasCategorizadas
                            }
                        });
                    }
                }
            }
        }

        // Ordenar tareas por prioridad de fecha y hora
        return tareas.sort((a, b) => {
            // Prioridad de tipos de fecha: due > start > scheduled
            const prioridadFecha = (tarea: Task): number => {
                if (tarea.fechaVencimiento === fechaHoyStr) return 3;
                if (tarea.fechaStart === fechaHoyStr) return 2;
                if (tarea.fechaScheduled === fechaHoyStr) return 1;
                return 0;
            };

            const prioridadA = prioridadFecha(a);
            const prioridadB = prioridadFecha(b);

            if (prioridadA !== prioridadB) return prioridadB - prioridadA;

            // Si tienen la misma prioridad de fecha, ordenar por hora si existe
            if (a.horaInicio && b.horaInicio) {
                return a.horaInicio.localeCompare(b.horaInicio);
            }

            return 0;
        });
    }

    public async mostrarTareasHoy(): Promise<void> {
        console.log("Iniciando búsqueda de tareas para hoy...");
        const tareas = await this.getTareasHoy();
        
        if (tareas.length === 0) {
            console.log("No se encontraron tareas para hoy");
            new Notice('No hay tareas programadas para hoy.');
            return;
        }
    
        console.log(`Preparando vista para ${tareas.length} tareas de hoy`);
    
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = "# Tareas para Hoy\n\n";
    
        // Agregar bloque dataviewjs con botón de actualización
        contenido += "```dataviewjs\n";
        contenido += `const gp = app.plugins.plugins['obsidian-personal-management'];
if (!gp) {
    dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
    return;
}

const container = this.container;
const btn = container.createEl('button', {text: '🔄 Actualizar Tareas de Hoy'});

btn.style.padding = '5px 15px';
btn.style.backgroundColor = '#1e1e1e';
btn.style.color = '#ffffff';
btn.style.border = '1px solid #4a4a4a';
btn.style.borderRadius = '4px';
btn.style.cursor = 'pointer';
btn.style.marginBottom = '10px';

btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2e2e2e');
btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#1e1e1e');

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando tareas de hoy...');
        await gp.tareasAPI.mostrarTareasHoy();
    } catch (error) {
        console.error('Error al actualizar tareas:', error);
        new Notice('Error al actualizar tareas');
    }
});
\`\`\`\n\n`;
    
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Total de tareas para hoy: ${tareas.length}\n\n`;
        
        // Agrupar tareas por tipo
        const tiposTarea = {
            vencimiento: tareas.filter(t => t.fechaVencimiento === hoy.toISOString().split('T')[0]),
            inicio: tareas.filter(t => t.fechaStart === hoy.toISOString().split('T')[0]),
            programadas: tareas.filter(t => t.fechaScheduled === hoy.toISOString().split('T')[0])
        };

        // Renderizar cada sección
        if (tiposTarea.vencimiento.length > 0) {
            contenido += "## 🎯 Vencen Hoy\n\n";
            contenido += this.renderizarGrupoTareas(tiposTarea.vencimiento);
        }

        if (tiposTarea.inicio.length > 0) {
            contenido += "## 🛫 Comienzan Hoy\n\n";
            contenido += this.renderizarGrupoTareas(tiposTarea.inicio);
        }

        if (tiposTarea.programadas.length > 0) {
            contenido += "## ⏳ Programadas para Hoy\n\n";
            contenido += this.renderizarGrupoTareas(tiposTarea.programadas);
        }

        try {
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas para Hoy.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas para hoy`);
        } catch (error) {
            await this.manejarError(error);
        }
    }

    private renderizarGrupoTareas(tareas: Task[]): string {
        let contenido = '';
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            
            info.tareas.forEach(tarea => {
                contenido += `- [ ] ${tarea.texto}\n`;
                
                // Añadir metadata relevante
                if (tarea.horaInicio || tarea.horaFin) {
                    contenido += `    - ⏰ ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
                }

                // Mostrar fechas relevantes
                if (tarea.fechaVencimiento) {
                    contenido += `    - 📅 ${tarea.fechaVencimiento}\n`;
                }
                if (tarea.fechaStart && tarea.fechaVencimiento !== tarea.fechaStart) {
                    contenido += `    - 🛫 ${tarea.fechaStart}\n`;
                }
                if (tarea.fechaScheduled && 
                    tarea.fechaScheduled !== tarea.fechaStart && 
                    tarea.fechaScheduled !== tarea.fechaVencimiento) {
                    contenido += `    - ⏳ ${tarea.fechaScheduled}\n`;
                }
                
                // Mostrar etiquetas solo si tienen contenido significativo
                const etiquetasFormateadas = {
                    todoist: tarea.etiquetas.todoist,
                    contextos: tarea.etiquetas.contextos.filter(c => c !== 'cx'),
                    personas: tarea.etiquetas.personas.filter(p => p !== 'px'),
                    otras: tarea.etiquetas.otras
                };

                if (etiquetasFormateadas.contextos.length > 0) {
                    contenido += `    - 🔄 ${etiquetasFormateadas.contextos.join(' | ')}\n`;
                }
                
                if (etiquetasFormateadas.personas.length > 0) {
                    contenido += `    - 👤 ${etiquetasFormateadas.personas.join(' | ')}\n`;
                }
                
                if (etiquetasFormateadas.todoist.length > 0) {
                    contenido += `    - ✅ ${etiquetasFormateadas.todoist.join(' ')}\n`;
                }
                
                if (etiquetasFormateadas.otras.length > 0) {
                    contenido += `    - 🏷️ ${etiquetasFormateadas.otras.join(' ')}\n`;
                }
            });
            contenido += '\n';
        }
        
        return contenido;
    }

    public async getTareasStartVencidas(): Promise<Task[]> {
        const files = this.plugin.app.vault.getMarkdownFiles();
        const tareas: Task[] = [];
        const hoy = this.taskUtils.obtenerFechaLocal();
        
        console.log("\n=== INICIO DE BÚSQUEDA DE TAREAS CON INICIO VENCIDO ===");
        console.log(`Fecha actual: ${hoy.toLocaleDateString()}`);
        
        for (const file of files) {
            const contenido = await this.plugin.app.vault.cachedRead(file);
            const lineas = contenido.split('\n');
            const tituloNota = this.taskUtils.obtenerTituloNota(file);
            
            for (const linea of lineas) {
                if (linea.trim().startsWith('- [ ]')) {
                    const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                    
                    if (fechasYHoras.fechaStart) {
                        const fechaInicio = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaStart);
                        
                        if (fechaInicio < hoy) {
                            const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                            const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                            const textoTarea = this.taskUtils.limpiarTextoTarea(linea);

                            // Determinar el estado basado en la fecha de vencimiento
                            let estado = EstadoTarea.Abierta;
                            if (fechasYHoras.fechaVencimiento) {
                                const fechaVenc = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaVencimiento);
                                if (fechaVenc < hoy) {
                                    estado = EstadoTarea.Vencida;
                                }
                            }

                            const tarea: Task = {
                                texto: textoTarea,
                                rutaArchivo: file.path,
                                nombreArchivo: file.basename,
                                titulo: tituloNota,
                                estado,
                                ...fechasYHoras,
                                etiquetas: {
                                    todas: etiquetasExtraidas,
                                    todoist: etiquetasCategorizadas.todoist || [],
                                    contextos: etiquetasCategorizadas.contextos || [],
                                    personas: etiquetasCategorizadas.personas || [],
                                    otras: etiquetasCategorizadas.otras || []
                                }
                            };
                            
                            tareas.push(tarea);
                        }
                    }
                }
            }
        }

        // Ordenar primero por estado (vencidas primero) y luego por fecha de inicio
        return tareas.sort((a, b) => {
            if (a.estado !== b.estado) {
                return a.estado === EstadoTarea.Vencida ? -1 : 1;
            }
            return this.taskUtils.parsearFechaVencimiento(a.fechaStart).getTime() -
                   this.taskUtils.parsearFechaVencimiento(b.fechaStart).getTime();
        });
    }

    public async mostrarTareasStartVencidas(): Promise<void> {
        console.log("Iniciando búsqueda de tareas con inicio vencido...");
        const tareas = await this.getTareasStartVencidas();
        
        if (tareas.length === 0) {
            console.log("No se encontraron tareas con inicio vencido");
            new Notice('No hay tareas pendientes de iniciar.');
            return;
        }
    
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = "# Tareas Pendientes de Iniciar\n\n";
    
        // Agregar bloque dataviewjs con botón de actualización
        contenido += "```dataviewjs\n";
        contenido += `const gp = app.plugins.plugins['obsidian-personal-management'];
if (!gp) {
    dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
    return;
}

const container = this.container;
const btn = container.createEl('button', {text: '🔄 Actualizar Tareas por Iniciar'});

btn.style.padding = '5px 15px';
btn.style.backgroundColor = '#1e1e1e';
btn.style.color = '#ffffff';
btn.style.border = '1px solid #4a4a4a';
btn.style.borderRadius = '4px';
btn.style.cursor = 'pointer';
btn.style.marginBottom = '10px';

btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2e2e2e');
btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#1e1e1e');

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando tareas por iniciar...');
        await gp.tareasAPI.mostrarTareasStartVencidas();
    } catch (error) {
        console.error('Error al actualizar tareas:', error);
        new Notice('Error al actualizar tareas');
    }
});
\`\`\`\n\n`;
    
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Total de tareas pendientes de iniciar: ${tareas.length}\n\n`;

        // Agrupar tareas por estado y retraso
        const tareasAgrupadas = {
            vencidasCriticas: tareas.filter(t => {
                const fechaInicio = this.taskUtils.parsearFechaVencimiento(t.fechaStart);
                const diasRetraso = Math.ceil((hoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
                return t.estado === EstadoTarea.Vencida && diasRetraso > 7;
            }),
            vencidasRecientes: tareas.filter(t => {
                const fechaInicio = this.taskUtils.parsearFechaVencimiento(t.fechaStart);
                const diasRetraso = Math.ceil((hoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
                return t.estado === EstadoTarea.Vencida && diasRetraso <= 7;
            }),
            retrasadasCriticas: tareas.filter(t => {
                const fechaInicio = this.taskUtils.parsearFechaVencimiento(t.fechaStart);
                const diasRetraso = Math.ceil((hoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
                return t.estado !== EstadoTarea.Vencida && diasRetraso > 7;
            }),
            retrasadasRecientes: tareas.filter(t => {
                const fechaInicio = this.taskUtils.parsearFechaVencimiento(t.fechaStart);
                const diasRetraso = Math.ceil((hoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
                return t.estado !== EstadoTarea.Vencida && diasRetraso <= 7;
            })
        };

        // Renderizar secciones
        if (tareasAgrupadas.vencidasCriticas.length > 0) {
            contenido += `## 🔴 Vencidas y con inicio retrasado > 7 días (${tareasAgrupadas.vencidasCriticas.length})\n\n`;
            contenido += this.renderizarGrupoTareasStartVencidas(tareasAgrupadas.vencidasCriticas, hoy);
        }

        if (tareasAgrupadas.vencidasRecientes.length > 0) {
            contenido += `## 🟠 Vencidas y con inicio retrasado reciente (${tareasAgrupadas.vencidasRecientes.length})\n\n`;
            contenido += this.renderizarGrupoTareasStartVencidas(tareasAgrupadas.vencidasRecientes, hoy);
        }

        if (tareasAgrupadas.retrasadasCriticas.length > 0) {
            contenido += `## 🟡 No vencidas, inicio retrasado > 7 días (${tareasAgrupadas.retrasadasCriticas.length})\n\n`;
            contenido += this.renderizarGrupoTareasStartVencidas(tareasAgrupadas.retrasadasCriticas, hoy);
        }

        if (tareasAgrupadas.retrasadasRecientes.length > 0) {
            contenido += `## 🟢 No vencidas, inicio retrasado reciente (${tareasAgrupadas.retrasadasRecientes.length})\n\n`;
            contenido += this.renderizarGrupoTareasStartVencidas(tareasAgrupadas.retrasadasRecientes, hoy);
        }

        try {
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Pendientes de Iniciar.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas pendientes de iniciar`);
        } catch (error) {
            await this.manejarError(error);
        }
    }

    private renderizarGrupoTareasStartVencidas(tareas: Task[], fechaHoy: Date): string {
        let contenido = '';
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            
            info.tareas.forEach(tarea => {
                contenido += `- [ ] ${tarea.texto}\n`;
                
                // Mostrar estado de inicio
                if (tarea.fechaStart) {
                    const fechaInicio = this.taskUtils.parsearFechaVencimiento(tarea.fechaStart);
                    const diasRetraso = Math.ceil((fechaHoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
                    contenido += `    - 🛫 Debió iniciar hace ${diasRetraso} días (${tarea.fechaStart})\n`;
                }
                
                // Mostrar fecha de vencimiento si existe
                if (tarea.fechaVencimiento) {
                    const fechaVenc = this.taskUtils.parsearFechaVencimiento(tarea.fechaVencimiento);
                    const diasHastaVencimiento = Math.ceil((fechaVenc.getTime() - fechaHoy.getTime()) / (1000 * 3600 * 24));
                    
                    if (diasHastaVencimiento < 0) {
                        contenido += `    - ⚠️ Vencida hace ${Math.abs(diasHastaVencimiento)} días (${tarea.fechaVencimiento})\n`;
                    } else {
                        contenido += `    - 📅 Vence en ${diasHastaVencimiento} días (${tarea.fechaVencimiento})\n`;
                    }
                }

                // Mostrar horas si existen
                if (tarea.horaInicio || tarea.horaFin) {
                    contenido += `    - ⏰ ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
                }
                
                // Mostrar etiquetas categorizadas
                if (tarea.etiquetas.contextos && tarea.etiquetas.contextos.length > 0) {
                    contenido += `    - 🔄 ${tarea.etiquetas.contextos.join(' | ')}\n`;
                }
                
                if (tarea.etiquetas.personas && tarea.etiquetas.personas.length > 0) {
                    contenido += `    - 👤 ${tarea.etiquetas.personas.join(' | ')}\n`;
                }
                
                if (tarea.etiquetas.todoist && tarea.etiquetas.todoist.length > 0) {
                    contenido += `    - ✅ ${tarea.etiquetas.todoist.join(' ')}\n`;
                }
                
                if (tarea.etiquetas.otras && tarea.etiquetas.otras.length > 0) {
                    contenido += `    - 🏷️ ${tarea.etiquetas.otras.join(' ')}\n`;
                }
            });
            contenido += '\n';
        }
        
        return contenido;
    }

    public async getTareasStartProximas(diasProximos: number = 7): Promise<Task[]> {
        const files = this.plugin.app.vault.getMarkdownFiles();
        const tareas: Task[] = [];
        const hoy = this.taskUtils.obtenerFechaLocal();
        const limiteFuturo = new Date(hoy);
        limiteFuturo.setDate(limiteFuturo.getDate() + diasProximos);
        
        console.log("\n=== INICIO DE BÚSQUEDA DE TAREAS POR INICIAR ===");
        console.log(`Fecha actual: ${hoy.toLocaleDateString()}`);
        console.log(`Buscando tareas hasta: ${limiteFuturo.toLocaleDateString()}`);
        
        for (const file of files) {
            const contenido = await this.plugin.app.vault.cachedRead(file);
            const lineas = contenido.split('\n');
            const tituloNota = this.taskUtils.obtenerTituloNota(file);
            
            for (const linea of lineas) {
                if (linea.trim().startsWith('- [ ]')) {
                    const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                    
                    if (fechasYHoras.fechaStart) {
                        const fechaInicio = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaStart);
                        
                        // Verificar si está en el rango (vencida o próxima)
                        if (fechaInicio <= limiteFuturo) {
                            const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                            const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                            const textoTarea = this.taskUtils.limpiarTextoTarea(linea);

                            // Determinar estado basado en fechas de inicio y vencimiento
                            let estado = fechaInicio < hoy ? EstadoTarea.Retrasada : EstadoTarea.Programada;
                            if (fechasYHoras.fechaVencimiento) {
                                const fechaVenc = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaVencimiento);
                                if (fechaVenc < hoy) {
                                    estado = EstadoTarea.Vencida;
                                }
                            }

                            const tarea: Task = {
                                texto: textoTarea,
                                rutaArchivo: file.path,
                                nombreArchivo: file.basename,
                                titulo: tituloNota,
                                estado,
                                ...fechasYHoras,
                                etiquetas: {
                                    todas: etiquetasExtraidas,
                                    todoist: etiquetasCategorizadas.todoist || [],
                                    contextos: etiquetasCategorizadas.contextos || [],
                                    personas: etiquetasCategorizadas.personas || [],
                                    otras: etiquetasCategorizadas.otras || []
                                }
                            };
                            
                            tareas.push(tarea);
                        }
                    }
                }
            }
        }

        // Ordenar por estado y fecha de inicio
        return tareas.sort((a, b) => {
            // Primero por estado (vencidas > retrasadas > programadas)
            if (a.estado !== b.estado) {
                const prioridad = {
                    [EstadoTarea.Vencida]: 3,
                    [EstadoTarea.Retrasada]: 2,
                    [EstadoTarea.Programada]: 1
                };
                return prioridad[b.estado] - prioridad[a.estado];
            }
            // Luego por fecha de inicio
            return this.taskUtils.parsearFechaVencimiento(a.fechaStart).getTime() -
                   this.taskUtils.parsearFechaVencimiento(b.fechaStart).getTime();
        });
    }

    public async mostrarTareasStartProximas(diasProximos: number = 7): Promise<void> {
        console.log("Iniciando búsqueda de tareas por iniciar...");
        const tareas = await this.getTareasStartProximas(diasProximos);
        
        if (tareas.length === 0) {
            console.log("No se encontraron tareas por iniciar");
            new Notice('No hay tareas por iniciar en el período especificado.');
            return;
        }
    
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = "# Tareas por Iniciar\n\n";
    
        // Agregar bloque dataviewjs con botón de actualización
        contenido += "```dataviewjs\n";
        contenido += `const gp = app.plugins.plugins['obsidian-personal-management'];
if (!gp) {
    dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
    return;
}

const container = this.container;
const btn = container.createEl('button', {text: '🔄 Actualizar Tareas por Iniciar'});

btn.style.padding = '5px 15px';
btn.style.backgroundColor = '#1e1e1e';
btn.style.color = '#ffffff';
btn.style.border = '1px solid #4a4a4a';
btn.style.borderRadius = '4px';
btn.style.cursor = 'pointer';
btn.style.marginBottom = '10px';

btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2e2e2e');
btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#1e1e1e');

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando vista de tareas por iniciar...');
        await gp.tareasAPI.mostrarTareasStartProximas(${diasProximos});
    } catch (error) {
        console.error('Error al actualizar tareas:', error);
        new Notice('Error al actualizar tareas');
    }
});
\`\`\`\n\n`;
    
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Mostrando tareas con inicio vencido y próximas a iniciar en los siguientes ${diasProximos} días\n`;
        contenido += `> Total de tareas encontradas: ${tareas.length}\n\n`;

        // Agrupar tareas por estado
        const tareasAgrupadas = {
            vencidas: tareas.filter(t => t.estado === EstadoTarea.Vencida),
            retrasadas: tareas.filter(t => t.estado === EstadoTarea.Retrasada),
            hoy: tareas.filter(t => {
                if (t.estado === EstadoTarea.Programada) {
                    const fechaInicio = this.taskUtils.parsearFechaVencimiento(t.fechaStart);
                    return fechaInicio.toDateString() === hoy.toDateString();
                }
                return false;
            }),
            proximas: tareas.filter(t => {
                if (t.estado === EstadoTarea.Programada) {
                    const fechaInicio = this.taskUtils.parsearFechaVencimiento(t.fechaStart);
                    return fechaInicio.toDateString() !== hoy.toDateString();
                }
                return false;
            })
        };

        // Renderizar secciones
        if (tareasAgrupadas.vencidas.length > 0) {
            contenido += `## 🔴 Vencidas (${tareasAgrupadas.vencidas.length})\n\n`;
            contenido += this.renderizarGrupoTareasStart(tareasAgrupadas.vencidas, hoy);
        }

        if (tareasAgrupadas.retrasadas.length > 0) {
            contenido += `## 🟠 Inicio Retrasado (${tareasAgrupadas.retrasadas.length})\n\n`;
            contenido += this.renderizarGrupoTareasStart(tareasAgrupadas.retrasadas, hoy);
        }

        if (tareasAgrupadas.hoy.length > 0) {
            contenido += `## 🟡 Inician Hoy (${tareasAgrupadas.hoy.length})\n\n`;
            contenido += this.renderizarGrupoTareasStart(tareasAgrupadas.hoy, hoy);
        }

        if (tareasAgrupadas.proximas.length > 0) {
            contenido += `## 🟢 Próximas a Iniciar (${tareasAgrupadas.proximas.length})\n\n`;
            contenido += this.renderizarGrupoTareasStart(tareasAgrupadas.proximas, hoy);
        }

        try {
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas por Iniciar.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas por iniciar`);
        } catch (error) {
            await this.manejarError(error);
        }
    }

    private renderizarGrupoTareasStart(tareas: Task[], fechaHoy: Date): string {
        let contenido = '';
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            
            info.tareas.forEach(tarea => {
                contenido += `- [ ] ${tarea.texto}\n`;
                
                // Mostrar estado de inicio
                if (tarea.fechaStart) {
                    const fechaInicio = this.taskUtils.parsearFechaVencimiento(tarea.fechaStart);
                    const diasDiferencia = Math.ceil((fechaInicio.getTime() - fechaHoy.getTime()) / (1000 * 3600 * 24));
                    
                    if (diasDiferencia < 0) {
                        contenido += `    - 🛫 Debió iniciar hace ${Math.abs(diasDiferencia)} días (${tarea.fechaStart})\n`;
                    } else if (diasDiferencia === 0) {
                        contenido += `    - 🛫 Inicia hoy (${tarea.fechaStart})\n`;
                    } else {
                        contenido += `    - 🛫 Inicia en ${diasDiferencia} días (${tarea.fechaStart})\n`;
                    }
                }
                
                // Mostrar fecha de vencimiento si existe
                if (tarea.fechaVencimiento) {
                    const fechaVenc = this.taskUtils.parsearFechaVencimiento(tarea.fechaVencimiento);
                    const diasHastaVencimiento = Math.ceil((fechaVenc.getTime() - fechaHoy.getTime()) / (1000 * 3600 * 24));
                    
                    if (diasHastaVencimiento < 0) {
                        contenido += `    - ⚠️ Vencida hace ${Math.abs(diasHastaVencimiento)} días (${tarea.fechaVencimiento})\n`;
                    } else {
                        contenido += `    - 📅 Vence en ${diasHastaVencimiento} días (${tarea.fechaVencimiento})\n`;
                    }
                }

                // Mostrar horas si existen
                if (tarea.horaInicio || tarea.horaFin) {
                    contenido += `    - ⏰ ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
                }
                
                // Mostrar etiquetas categorizadas
                if (tarea.etiquetas.contextos && tarea.etiquetas.contextos.length > 0) {
                    contenido += `    - 🔄 ${tarea.etiquetas.contextos.join(' | ')}\n`;
                }
                
                if (tarea.etiquetas.personas && tarea.etiquetas.personas.length > 0) {
                    contenido += `    - 👤 ${tarea.etiquetas.personas.join(' | ')}\n`;
                }
                
                if (tarea.etiquetas.todoist && tarea.etiquetas.todoist.length > 0) {
                    contenido += `    - ✅ ${tarea.etiquetas.todoist.join(' ')}\n`;
                }
                
                if (tarea.etiquetas.otras && tarea.etiquetas.otras.length > 0) {
                    contenido += `    - 🏷️ ${tarea.etiquetas.otras.join(' ')}\n`;
                }
            });
            contenido += '\n';
        }
        
        return contenido;
    }
}