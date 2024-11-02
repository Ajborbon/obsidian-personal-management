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

    // Actualizar el array de archivos a excluir
    private readonly ARCHIVOS_RESULTADOS = [
        'Tareas en Ejecución.md',
        'Tareas Vencidas.md',
        'Tareas Próximas.md',
        'Tareas para Hoy.md',
        'Tareas con Inicio Vencido.md',
        'Tareas por Iniciar.md',
        'Tareas Programadas.md',
        'Tareas Scheduled Vencidas.md',
        'Tareas Scheduled Próximas.md',
        'Todas las Tareas Vencidas.md'
    ];

    private debeExcluirArchivo(file: TFile): boolean {
        // Excluir la carpeta Plantillas
        if (file.path.startsWith('Plantillas/') || file.path.startsWith('Archivo/Plantillas/')) {
            return true;
        }

        // Excluir archivos de resultados
        const nombreArchivo = file.path.split('/').pop();
        if (this.ARCHIVOS_RESULTADOS.includes(nombreArchivo || '')) {
            return true;
        }

        // Excluir cualquier archivo en la carpeta de resultados del sistema GTD
        if (file.path.startsWith(`${this.plugin.settings.folder_SistemaGTD}/`)) {
            return true;
        }

        return false;
    }

    private async procesarTareas(
        files: TFile[], 
        filtro: (task: Task) => boolean,
        buscarEnEjecucion: boolean = false
    ): Promise<Task[]> {
        const tareas: Task[] = [];
        const errores: string[] = [];

        try {
            // Filtrar archivos excluyendo plantillas y archivos de resultados
            const filesParaProcesar = files.filter(file => !this.debeExcluirArchivo(file));

            // Agregar log para depuración
            console.log(`Procesando ${filesParaProcesar.length} archivos de ${files.length} totales`);

            for (const file of filesParaProcesar) {
                try {
                    const contenido = await this.plugin.app.vault.cachedRead(file);
                    const lineas = contenido.split('\n');
                    const tituloNota = this.taskUtils.obtenerTituloNota(file);

                    for (const linea of lineas) {
                        const esEnEjecucion = linea.trim().startsWith('- [/]');
                        const esAbierta = linea.trim().startsWith('- [ ]');
                        
                        if ((!buscarEnEjecucion && !esAbierta) || 
                            (buscarEnEjecucion && !esEnEjecucion)) {
                            continue;
                        }

                        const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                        const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                        const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                        const textoTarea = this.taskUtils.limpiarTextoTarea(linea);

                        const tarea: Task = {
                            texto: textoTarea,
                            rutaArchivo: file.path,
                            nombreArchivo: file.basename,
                            titulo: tituloNota,
                            estado: esEnEjecucion ? EstadoTarea.EnEjecucion : EstadoTarea.Abierta,
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
                    console.error(`Error en archivo ${file.path}:`, fileError);
                }
            }
        } catch (error) {
            console.error('Error general procesando tareas:', error);
            new Notice('Error procesando tareas. Revisa la consola para más detalles.');
        }

        if (errores.length > 0) {
            console.warn('Errores encontrados durante el procesamiento:', errores);
        }

        return this.organizarTareasEnEjecucion(TaskWeightCalculator.sortTasks(tareas));
    }

    private guardarYAbrirArchivo(
        nombreArchivo: string, 
        contenido: string
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // Asegurarse de que existe la carpeta del sistema GTD
                const carpetaGTD = this.plugin.app.vault.getAbstractFileByPath(
                    this.plugin.settings.folder_SistemaGTD
                );
                
                if (!carpetaGTD) {
                    await this.plugin.app.vault.createFolder(
                        this.plugin.settings.folder_SistemaGTD
                    );
                }

                const archivoExistente = this.plugin.app.vault.getAbstractFileByPath(nombreArchivo);
                
                if (archivoExistente instanceof TFile) {
                    await this.plugin.app.vault.modify(archivoExistente, contenido);
                    await this.plugin.app.workspace.getLeaf().openFile(archivoExistente);
                } else {
                    const nuevoArchivo = await this.plugin.app.vault.create(nombreArchivo, contenido);
                    await this.plugin.app.workspace.getLeaf().openFile(nuevoArchivo);
                }
                resolve();
            } catch (error) {
                console.error("Error al guardar/abrir archivo:", error);
                reject(error);
            }
        });
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
    
    // Agrupar las fechas para mejor visualización
    const fechas = [];
    if (tarea.fechaVencimiento) {
        fechas.push(`📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}`);
    }
    if (tarea.fechaScheduled) {
        fechas.push(`⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}`);
    }
    if (tarea.fechaStart) {
        fechas.push(`🛫 ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}`);
    }
    
    if (fechas.length > 0) {
        contenido += `    - Fechas:\n        ${fechas.join('\n        ')}\n`;
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
            contenido += `    - 👤 : ${tarea.etiquetas.personas.join(' | ')}\n`;
        }
        if (tarea.etiquetas.todoist?.length > 0) {
            contenido += `    - 📲 : ${tarea.etiquetas.todoist.join(' ')}\n`;
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

    // Añadir nuevo método para obtener tareas futuras
    public async getTareasFuturas(diasFuturos: number = 7): Promise<Task[]> {
    const hoy = this.taskUtils.obtenerFechaLocal();
    const limiteFuturo = new Date(hoy);
    limiteFuturo.setDate(limiteFuturo.getDate() + diasFuturos);

    return await this.procesarTareas(
        this.plugin.app.vault.getMarkdownFiles(),
        (tarea) => {
            const fechasRelevantes = [
                tarea.fechaVencimiento,
                tarea.fechaScheduled,
                tarea.fechaStart
            ].filter(Boolean);

            return fechasRelevantes.some(fecha => {
                const fechaObj = this.taskUtils.parsearFechaVencimiento(fecha!);
                return fechaObj && fechaObj > hoy && fechaObj <= limiteFuturo;
            });
        }
    );
    }

    // Añadir método para mostrar tareas futuras
    public async mostrarTareasFuturas(diasFuturos: number = 7): Promise<void> {
        try {
            const tareas = await this.getTareasFuturas(diasFuturos);
            if (tareas.length === 0) {
                new Notice(`No hay tareas programadas para los próximos ${diasFuturos} días.`);
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                `Tareas Programadas (Próximos ${diasFuturos} días)`,
                "mostrarTareasFuturas",
                diasFuturos
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Programadas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas programadas para los próximos ${diasFuturos} días`);
        } catch (error) {
            console.error("Error en mostrarTareasFuturas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    // Añadir nuevo método para obtener tareas en ejecución
    public async getTareasEnEjecucion(): Promise<Task[]> {
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => {
                // Modificar el procesamiento de tareas para detectar estado [/]
                const taskLine = tarea.texto.trim();
                return taskLine.startsWith('- [/]');
            },
        true // nuevo parámetro para indicar que buscamos tareas en ejecución
        );
    }

    // Añadir método para mostrar tareas en ejecución
    public async mostrarTareasEnEjecucion(): Promise<void> {
        try {
            const tareas = await this.getTareasEnEjecucion();
            if (tareas.length === 0) {
                new Notice('No hay tareas en ejecución.');
                return;
            }

            const contenido = this.generarVistaEnEjecucion(tareas);

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas en Ejecución.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas en ejecución`);
        } catch (error) {
            console.error("Error en mostrarTareasEnEjecucion:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    private generarVistaEnEjecucion(tareas: Task[]): string {
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = `# Tareas en Ejecución\n\n`;
        
        // Añadir botón de actualización
        contenido += this.generarBotonActualizacion("mostrarTareasEnEjecucion");
        
        // Añadir información general
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Total de tareas en ejecución: ${tareas.length}\n\n`;

        // Separar tareas por categorías
        const tareasConVencimiento = tareas.filter(t => t.fechaVencimiento);
        const tareasProgramadas = tareas.filter(t => !t.fechaVencimiento && t.fechaScheduled);
        const tareasConInicio = tareas.filter(t => !t.fechaVencimiento && !t.fechaScheduled && t.fechaStart);
        const tareasSinFecha = tareas.filter(t => !t.fechaVencimiento && !t.fechaScheduled && !t.fechaStart);

        // Renderizar cada sección
        if (tareasConVencimiento.length > 0) {
            contenido += `## Con fecha de vencimiento (${tareasConVencimiento.length})\n\n`;
            contenido += this.renderizarGrupoTareas(tareasConVencimiento);
        }

        if (tareasProgramadas.length > 0) {
            contenido += `## Programadas (${tareasProgramadas.length})\n\n`;
            contenido += this.renderizarGrupoTareas(tareasProgramadas);
        }

        if (tareasConInicio.length > 0) {
            contenido += `## Con fecha de inicio (${tareasConInicio.length})\n\n`;
            contenido += this.renderizarGrupoTareas(tareasConInicio);
        }

        if (tareasSinFecha.length > 0) {
            contenido += `## Sin fecha asignada (${tareasSinFecha.length})\n\n`;
            contenido += this.renderizarGrupoTareas(tareasSinFecha);
        }

        return contenido;
    }

    private renderizarGrupoTareas(tareas: Task[]): string {
    const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
    let contenido = '';
    
    for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
        contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
        info.tareas.forEach(tarea => {
            contenido += this.renderizarTareaEnEjecucion(tarea);
        });
        contenido += '\n';
    }
    
    return contenido;
    }   

    private renderizarTareaEnEjecucion(tarea: Task): string {
        let contenido = `${tarea.texto}\n`;
        
        // Renderizar fechas si existen
        if (tarea.fechaVencimiento || tarea.fechaScheduled || tarea.fechaStart) {
            contenido += `    - Fechas:\n`;
            if (tarea.fechaVencimiento) {
                contenido += `        - 📅 : ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}\n`;
            }
            if (tarea.fechaScheduled) {
                contenido += `        - ⏳ : ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}\n`;
            }
            if (tarea.fechaStart) {
                contenido += `        - 🛫: ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}\n`;
            }
        }

        // Renderizar horarios si existen
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

    private organizarTareasEnEjecucion(tareas: Task[]): Task[] {
        return tareas.sort((a, b) => {
            const fechaA = a.fechaVencimiento || a.fechaScheduled || a.fechaStart;
            const fechaB = b.fechaVencimiento || b.fechaScheduled || b.fechaStart;

            if (fechaA && fechaB) {
                const fechaObjA = this.taskUtils.parsearFechaVencimiento(fechaA);
                const fechaObjB = this.taskUtils.parsearFechaVencimiento(fechaB);
                if (fechaObjA && fechaObjB) {
                    return fechaObjA.getTime() - fechaObjB.getTime();
                }
            }

            // Si una tarea tiene fecha y la otra no, la que tiene fecha va primero
            if (fechaA) return -1;
            if (fechaB) return 1;

            // Si ninguna tiene fecha, mantener el orden por peso
            return (b.weight?.totalWeight || 0) - (a.weight?.totalWeight || 0);
        });
    }

     // Nuevo método para obtener tareas scheduled vencidas
     public async getTareasScheduledVencidas(): Promise<Task[]> {
        const hoy = this.taskUtils.obtenerFechaLocal();
        
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => {
                if (!tarea.fechaScheduled) return false;
                const fechaScheduled = this.taskUtils.parsearFechaVencimiento(tarea.fechaScheduled);
                return fechaScheduled !== null && fechaScheduled < hoy;
            }
        );
    }

    // Nuevo método para obtener tareas scheduled próximas
    public async getTareasScheduledProximas(diasProximos: number = 7): Promise<Task[]> {
        const hoy = this.taskUtils.obtenerFechaLocal();
        const limiteFuturo = new Date(hoy);
        limiteFuturo.setDate(limiteFuturo.getDate() + diasProximos);

        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => {
                if (!tarea.fechaScheduled) return false;
                const fechaScheduled = this.taskUtils.parsearFechaVencimiento(tarea.fechaScheduled);
                return fechaScheduled !== null && 
                       fechaScheduled >= hoy && 
                       fechaScheduled <= limiteFuturo;
            }
        );
    }

    // Método para mostrar tareas scheduled vencidas
    public async mostrarTareasScheduledVencidas(): Promise<void> {
        try {
            const tareas = await this.getTareasScheduledVencidas();
            if (tareas.length === 0) {
                new Notice('No hay tareas scheduled vencidas.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                "Tareas Scheduled Vencidas",
                "mostrarTareasScheduledVencidas"
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Scheduled Vencidas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas scheduled vencidas`);
        } catch (error) {
            console.error("Error en mostrarTareasScheduledVencidas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    // Método para mostrar tareas scheduled próximas
    public async mostrarTareasScheduledProximas(diasProximos: number = 7): Promise<void> {
        try {
            const tareas = await this.getTareasScheduledProximas(diasProximos);
            if (tareas.length === 0) {
                new Notice('No hay tareas scheduled próximas.');
                return;
            }

            const contenido = this.generarVistaCompleta(
                tareas,
                `Tareas Scheduled Próximas (${diasProximos} días)`,
                "mostrarTareasScheduledProximas",
                diasProximos
            );

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Scheduled Próximas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas scheduled próximas`);
        } catch (error) {
            console.error("Error en mostrarTareasScheduledProximas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

       // Método auxiliar para la visualización de fechas scheduled
    private formatearFechaScheduled(fecha: string): string {
        const fechaObj = this.taskUtils.parsearFechaVencimiento(fecha);
        if (!fechaObj) return fecha;

        const hoy = this.taskUtils.obtenerFechaLocal();
        const diferenciaDias = Math.ceil(
            (fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        );

        let contexto = '';
        if (diferenciaDias < 0) {
            contexto = `(retrasada ${Math.abs(diferenciaDias)} días)`;
        } else if (diferenciaDias === 0) {
            contexto = '(hoy)';
        } else if (diferenciaDias === 1) {
            contexto = '(mañana)';
        } else {
            contexto = `(en ${diferenciaDias} días)`;
        }

        return `${fecha} ${contexto}`;
    }

     // Método para obtener todas las tareas vencidas
     public async getTodasTareasVencidas(): Promise<Task[]> {
        const hoy = this.taskUtils.obtenerFechaLocal();
        
        return await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            (tarea) => {
                let estaVencida = false;
                
                // Verificar fecha de vencimiento (due)
                if (tarea.fechaVencimiento) {
                    const fechaVenc = this.taskUtils.parsearFechaVencimiento(tarea.fechaVencimiento);
                    if (fechaVenc && fechaVenc < hoy) {
                        tarea.tipoVencimiento = ['due'];
                        estaVencida = true;
                    }
                }
                
                // Verificar fecha scheduled
                if (tarea.fechaScheduled) {
                    const fechaSched = this.taskUtils.parsearFechaVencimiento(tarea.fechaScheduled);
                    if (fechaSched && fechaSched < hoy) {
                        tarea.tipoVencimiento = tarea.tipoVencimiento || [];
                        tarea.tipoVencimiento.push('scheduled');
                        estaVencida = true;
                    }
                }
                
                // Verificar fecha de inicio (start)
                if (tarea.fechaStart) {
                    const fechaStart = this.taskUtils.parsearFechaVencimiento(tarea.fechaStart);
                    if (fechaStart && fechaStart < hoy) {
                        tarea.tipoVencimiento = tarea.tipoVencimiento || [];
                        tarea.tipoVencimiento.push('start');
                        estaVencida = true;
                    }
                }
                
                return estaVencida;
            }
        );
    }

    // Método para mostrar todas las tareas vencidas
    public async mostrarTodasTareasVencidas(): Promise<void> {
        try {
            const tareas = await this.getTodasTareasVencidas();
            if (tareas.length === 0) {
                new Notice('No hay tareas vencidas.');
                return;
            }

            const contenido = this.generarVistaTodasVencidas(tareas);

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Todas las Tareas Vencidas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas vencidas`);
        } catch (error) {
            console.error("Error en mostrarTodasTareasVencidas:", error);
            new Notice(`Error: ${error.message}`);
        }
    }

    // Método específico para generar la vista de todas las tareas vencidas
    private generarVistaTodasVencidas(tareas: Task[]): string {
        const hoy = this.taskUtils.obtenerFechaLocal();
        let contenido = `# Todas las Tareas Vencidas\n\n`;
        
        contenido += this.generarBotonActualizacion("mostrarTodasTareasVencidas");
        contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        contenido += `> Total de tareas vencidas: ${tareas.length}\n\n`;

        // Organizar tareas por tipo de vencimiento
        const tareasVencDue = tareas.filter(t => t.tipoVencimiento?.includes('due'));
        const tareasVencScheduled = tareas.filter(t => t.tipoVencimiento?.includes('scheduled'));
        const tareasVencStart = tareas.filter(t => t.tipoVencimiento?.includes('start'));

        // Sección de tareas con fecha de vencimiento (due)
        if (tareasVencDue.length > 0) {
            contenido += `## Tareas con Fecha de Vencimiento Pasada (${tareasVencDue.length})\n\n`;
            contenido += this.renderizarGrupoTareasVencidas(tareasVencDue, 'due');
        }

        // Sección de tareas scheduled vencidas
        if (tareasVencScheduled.length > 0) {
            contenido += `## Tareas Scheduled Retrasadas (${tareasVencScheduled.length})\n\n`;
            contenido += this.renderizarGrupoTareasVencidas(tareasVencScheduled, 'scheduled');
        }

        // Sección de tareas start vencidas
        if (tareasVencStart.length > 0) {
            contenido += `## Tareas con Inicio Retrasado (${tareasVencStart.length})\n\n`;
            contenido += this.renderizarGrupoTareasVencidas(tareasVencStart, 'start');
        }

        return contenido;
    }

    // Método auxiliar para renderizar grupos de tareas vencidas
    private renderizarGrupoTareasVencidas(tareas: Task[], tipo: 'due' | 'scheduled' | 'start'): string {
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        let contenido = '';
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            info.tareas.forEach(tarea => {
                contenido += this.renderizarTareaVencida(tarea, tipo);
            });
            contenido += '\n';
        }
        
        return contenido;
    }

    // Método auxiliar para renderizar una tarea vencida
    private renderizarTareaVencida(tarea: Task, tipo: 'due' | 'scheduled' | 'start'): string {
        let contenido = `- [ ] ${tarea.texto}\n`;
        
        // Mostrar información de fechas relevante según el tipo
        switch (tipo) {
            case 'due':
                contenido += `    - 📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento!, 'due')}\n`;
                if (tarea.fechaScheduled) {
                    contenido += `    - ⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}\n`;
                }
                if (tarea.fechaStart) {
                    contenido += `    - 🛫 ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}\n`;
                }
                break;
            
            case 'scheduled':
                contenido += `    - ⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled!, 'scheduled')}\n`;
                if (tarea.fechaVencimiento) {
                    contenido += `    - 📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}\n`;
                }
                if (tarea.fechaStart) {
                    contenido += `    - 🛫 ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}\n`;
                }
                break;
            
            case 'start':
                contenido += `    - 🛫 ${this.formatearFechaConContexto(tarea.fechaStart!, 'start')}\n`;
                if (tarea.fechaVencimiento) {
                    contenido += `    - 📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}\n`;
                }
                if (tarea.fechaScheduled) {
                    contenido += `    - ⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}\n`;
                }
                break;
        }

        // Renderizar horarios si existen
        if (tarea.horaInicio || tarea.horaFin) {
            contenido += `    - ⏰ Horario: ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
        }

        // Renderizar etiquetas
        if (tarea.etiquetas.contextos?.length > 0) {
            contenido += `    - 🗂️ Contextos: ${tarea.etiquetas.contextos.join(' | ')}\n`;
        }
        if (tarea.etiquetas.personas?.length > 0) {
            contenido += `    - 👤: ${tarea.etiquetas.personas.join(' | ')}\n`;
        }
        if (tarea.etiquetas.todoist?.length > 0) {
            contenido += `    - 📲: ${tarea.etiquetas.todoist.join(' ')}\n`;
        }
        if (tarea.etiquetas.otras?.length > 0) {
            contenido += `    - 🏷️ Otras: ${tarea.etiquetas.otras.join(' ')}\n`;
        }

        return contenido;
    }
}