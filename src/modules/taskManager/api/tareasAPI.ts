// src/modules/taskManager/api/tareasAPI.ts

import { TFile, Notice } from 'obsidian';
import MyPlugin from '../../../main';
import { Task, EstadoTarea } from '../interfaces/taskInterfaces';
import { TaskUtils } from '../utils/taskUtils';
import { TaskWeightCalculator } from '../utils/taskWeightCalculator';

export class TareasAPI {
    private taskUtils: TaskUtils;

    constructor(private plugin: MyPlugin) {
        this.taskUtils = new TaskUtils(plugin);
        TaskWeightCalculator.setTaskUtils(this.taskUtils);
    }

    // Métodos principales de búsqueda de tareas
    public async getTareasVencidasAbiertas(): Promise<Task[]> {
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => TaskWeightCalculator.shouldIncludeTask(tarea, 'vencidas', this.taskUtils.obtenerFechaLocal())
        );
    }

    public async getTareasHoy(): Promise<Task[]> {
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => TaskWeightCalculator.shouldIncludeTask(tarea, 'hoy', this.taskUtils.obtenerFechaLocal())
        );
    }

    public async getTareasProximas(diasProximos: number = 7): Promise<Task[]> {
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => TaskWeightCalculator.shouldIncludeTask(tarea, 'proximas', this.taskUtils.obtenerFechaLocal())
        );
    }

    public async getTareasStartVencidas(): Promise<Task[]> {
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => TaskWeightCalculator.shouldIncludeTask(tarea, 'start_vencidas', this.taskUtils.obtenerFechaLocal())
        );
    }

    public async getTareasStartProximas(diasProximos: number = 7): Promise<Task[]> {
        const hoy = this.taskUtils.obtenerFechaLocal();
        const limiteFuturo = new Date(hoy);
        limiteFuturo.setDate(limiteFuturo.getDate() + diasProximos);

        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => {
                if (!tarea.fechaStart) return false;
                const fechaStart = this.taskUtils.parsearFechaVencimiento(tarea.fechaStart);
                return fechaStart && fechaStart <= limiteFuturo && fechaStart >= hoy;
            }
        );
    }

    // Método central de procesamiento de tareas
    private async procesarTareas(files: TFile[], filtro: (task: Task) => boolean): Promise<Task[]> {
        const tareas: Task[] = [];
        const errores: string[] = [];

        try {
            for (const file of files) {
                try {
                    const contenido = await this.plugin.app.vault.cachedRead(file);
                    const lineas = contenido.split('\n');
                    const tituloNota = this.taskUtils.obtenerTituloNota(file);

                    for (const linea of lineas) {
                        if (!linea.trim().startsWith('- [ ]')) continue;

                        const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                        if (!this.tieneFechasValidas(fechasYHoras)) continue;

                        const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                        const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                        const textoTarea = this.taskUtils.limpiarTextoTarea(linea);

                        const tarea: Task = {
                            texto: textoTarea,
                            rutaArchivo: file.path,
                            nombreArchivo: file.basename,
                            titulo: tituloNota,
                            estado: EstadoTarea.Abierta,
                            ...fechasYHoras,
                            etiquetas: {
                                todas: etiquetasExtraidas,
                                ...etiquetasCategorizadas
                            }
                        };

                        tarea.weight = TaskWeightCalculator.calculateWeight(tarea);

                        if (filtro(tarea)) {
                            tareas.push(tarea);
                        }
                    }
                } catch (fileError) {
                    errores.push(`Error procesando archivo ${file.path}: ${fileError.message}`);
                }
            }
        } catch (error) {
            console.error('Error general procesando tareas:', error);
            new Notice('Error procesando tareas. Revisa la consola para más detalles.');
        }

        if (errores.length > 0) {
            console.warn('Errores encontrados durante el procesamiento:', errores);
        }

        return TaskWeightCalculator.sortTasks(tareas);
    }

    // Métodos de renderizado y visualización
    private generarBotonActualizacion(metodo: string, parametros?: number): string {
        return `\`\`\`dataviewjs
const gp = app.plugins.plugins['obsidian-personal-management'];
if (!gp) {
    dv.paragraph("⚠️ Plugin de Gestión Personal no encontrado");
    return;
}

const btn = this.container.createEl('button', {text: '🔄 Actualizar Vista'});
btn.style.cssText = 'padding: 5px 15px; background-color: #1e1e1e; color: #ffffff; border: 1px solid #4a4a4a; border-radius: 4px; cursor: pointer; margin-bottom: 10px;';

btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#2e2e2e');
btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#1e1e1e');

btn.addEventListener('click', async () => {
    try {
        new Notice('Actualizando vista...');
        await gp.tareasAPI.${metodo}(${parametros || ''});
    } catch (error) {
        console.error('Error:', error);
        new Notice('Error al actualizar tareas');
    }
});
\`\`\`\n\n`;
    }

    private async guardarYAbrirArchivo(nombreArchivo: string, contenido: string): Promise<void> {
        try {
            const archivoExistente = this.plugin.app.vault.getAbstractFileByPath(nombreArchivo);
            
            if (archivoExistente instanceof TFile) {
                await this.plugin.app.vault.modify(archivoExistente, contenido);
                await this.plugin.app.workspace.getLeaf().openFile(archivoExistente);
            } else {
                const nuevoArchivo = await this.plugin.app.vault.create(nombreArchivo, contenido);
                await this.plugin.app.workspace.getLeaf().openFile(nuevoArchivo);
            }
        } catch (error) {
            console.error("Error al guardar/abrir archivo:", error);
            throw new Error(`Error al guardar/abrir archivo: ${error.message}`);
        }
    }

    // Métodos públicos de visualización correspondientes a los comandos
    public async mostrarTareasVencidas(): Promise<void> {
        try {
            const tareas = await this.getTareasVencidasAbiertas();
            if (tareas.length === 0) {
                new Notice('No hay tareas vencidas abiertas.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                "Tareas Vencidas",
                "mostrarTareasVencidas"
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Vencidas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas vencidas`);
        } catch (error) {
            console.error("Error en mostrarTareasVencidas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    public async mostrarTareasProximas(diasProximos: number = 7): Promise<void> {
        try {
            const tareas = await this.getTareasProximas(diasProximos);
            if (tareas.length === 0) {
                new Notice('No hay tareas próximas.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                "Tareas Próximas",
                "mostrarTareasProximas",
                diasProximos
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Próximas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas próximas`);
        } catch (error) {
            console.error("Error en mostrarTareasProximas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    public async mostrarTareasHoy(): Promise<void> {
        try {
            const tareas = await this.getTareasHoy();
            if (tareas.length === 0) {
                new Notice('No hay tareas programadas para hoy.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                "Tareas para Hoy",
                "mostrarTareasHoy"
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas para Hoy.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas para hoy`);
        } catch (error) {
            console.error("Error en mostrarTareasHoy:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    public async mostrarTareasStartVencidas(): Promise<void> {
        try {
            const tareas = await this.getTareasStartVencidas();
            if (tareas.length === 0) {
                new Notice('No hay tareas con inicio vencido.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                "Tareas con Inicio Vencido",
                "mostrarTareasStartVencidas"
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas con Inicio Vencido.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas con inicio vencido`);
        } catch (error) {
            console.error("Error en mostrarTareasStartVencidas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    public async mostrarTareasStartProximas(diasProximos: number = 7): Promise<void> {
        try {
            const tareas = await this.getTareasStartProximas(diasProximos);
            if (tareas.length === 0) {
                new Notice('No hay tareas por iniciar en el período especificado.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                "Tareas por Iniciar",
                "mostrarTareasStartProximas",
                diasProximos
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas por Iniciar.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas por iniciar`);
        } catch (error) {
            console.error("Error en mostrarTareasStartProximas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    // Métodos de utilidad privados
    private tieneFechasValidas(fechasYHoras: any): boolean {
        const { fechaVencimiento, fechaScheduled, fechaStart } = fechasYHoras;
        return fechaVencimiento || fechaScheduled || fechaStart;
    }

    private generarVistaCompleta(
        tareas: Task[],
        titulo: string,
        metodoActualizacion: string,
        diasProximos?: number
    ): string {
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = `# ${titulo}\n\n`;
        
        contenido += this.generarBotonActualizacion(metodoActualizacion, diasProximos);
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        if (diasProximos) {
            contenido += `> Mostrando tareas para los próximos ${diasProximos} días\n`;
        }
        contenido += `> Total de tareas encontradas: ${tareas.length}\n\n`;
        
        contenido += this.renderizarTareasAgrupadas(tareas);
        
        return contenido;
    }

    private renderizarTareasAgrupadas(tareas: Task[]): string {
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        let contenido = '';
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            info.tareas.forEach(tarea => {
                contenido += this.renderizarTarea(tarea);
            });
            contenido += '\n';
        }
        
        return contenido;
    }

    private renderizarTarea(tarea: Task): string {
        let contenido = `- [ ] ${tarea.texto}\n`;
        
        // Fechas con contexto
        if (tarea.fechaVencimiento) {
            contenido += `    - 📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}\n`;
        }
        if (tarea.fechaScheduled) {
            contenido += `    - ⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}\n`;
        }
        if (tarea.fechaStart) {
            contenido += `    - 🛫 ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}\n`;
        }

        // Horarios
        if (tarea.horaInicio || tarea.horaFin) {
            contenido += `    - ⏰ Horario: ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
        }

        // Etiquetas
        if (tarea.etiquetas.contextos?.length > 0) {
            contenido += `    - 🗂️ Contextos: ${tarea.etiquetas.contextos.join(' | ')}\n`;
        }
        if (tarea.etiquetas.personas?.length > 0) {
            contenido += `    - 👤 Personas: ${tarea.etiquetas.personas.join(' | ')}\n`;
        }
        if (tarea.etiquetas.todoist?.length > 0) {
            contenido += `    - 📲 Todoist: ${tarea.etiquetas.todoist.join(' ')}\n`;
        }
        if (tarea.etiquetas.otras?.length > 0) {
            contenido += `    - 🏷️ Otras: ${tarea.etiquetas.otras.join(' ')}\n`;
        }

        // Prioridad
        const prioridad = this.obtenerPrioridadTarea(tarea.texto);
        if (prioridad) {
            contenido += `    - ${prioridad.emoji} Prioridad: ${prioridad.nombre}\n`;
        }

        return contenido;
    }

    private obtenerPrioridadTarea(texto: string): { emoji: string; nombre: string } | null {
        if (texto.includes('🔺')) return { emoji: '🔺', nombre: 'Muy Alta' };
        if (texto.includes('⏫')) return { emoji: '⏫', nombre: 'Alta' };
        if (texto.includes('🔼')) return { emoji: '🔼', nombre: 'Media' };
        if (texto.includes('🔽')) return { emoji: '🔽', nombre: 'Baja' };
        if (texto.includes('⏬')) return { emoji: '⏬', nombre: 'Muy Baja' };
        return null;
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
        }, {} as { [key: string]: { titulo: string; tareas: Task[] } });
    }

    private formatearFechaConContexto(fecha: string, tipo: 'due' | 'scheduled' | 'start'): string {
        try {
            const fechaObj = this.taskUtils.parsearFechaVencimiento(fecha);
            if (!fechaObj) return fecha;

            const hoy = this.taskUtils.obtenerFechaLocal();
            const diferenciaDias = Math.ceil(
                (fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
            );

            let textoBase = '';
            switch (tipo) {
                case 'due':
                    textoBase = diferenciaDias < 0 ? 'Venció' : 'Vence';
                    break;
                case 'scheduled':
                    textoBase = 'Programada';
                    break;
                case 'start':
                    textoBase = diferenciaDias < 0 ? 'Debió iniciar' : 'Inicia';
                    break;
            }

            let contexto = '';
            if (diferenciaDias === 0) {
                contexto = 'hoy';
            } else if (diferenciaDias === 1) {
                contexto = 'mañana';
            } else if (diferenciaDias === -1) {
                contexto = 'ayer';
            } else if (diferenciaDias < 0) {
                contexto = `hace ${Math.abs(diferenciaDias)} días`;
            } else {
                contexto = `en ${diferenciaDias} días`;
            }

            return `${textoBase} ${fecha} (${contexto})`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return fecha;
        }
    }
}