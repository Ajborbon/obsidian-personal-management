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

    private async procesarTareas(
        files: TFile[], 
        filtro: (task: Task) => boolean | Promise<boolean>,
        buscarEnEjecucion: boolean = false
    ): Promise<Task[]> {
        const tareas: Task[] = [];
        const errores: string[] = [];
        
        try {
            const filesParaProcesar = files.filter(file => !this.debeExcluirArchivo(file));
            console.log(`\n=== INICIANDO PROCESAMIENTO DE TAREAS ===`);
            console.log(`Procesando ${filesParaProcesar.length} archivos de ${files.length} totales`);

            for (const file of filesParaProcesar) {
                try {
                    const contenido = await this.plugin.app.vault.cachedRead(file);
                    const lineas = contenido.split('\n');
                    const tituloNota = this.taskUtils.obtenerTituloNota(file);

                    console.log(`\nProcesando archivo: ${file.path}`);

                    for (const linea of lineas) {
                        // Detectar el tipo de tarea basado en el checkbox
                        const esEnEjecucion = linea.trim().startsWith('- [/]');
                        const esAbierta = linea.trim().startsWith('- [ ]');
                        const esCompletada = linea.trim().startsWith('- [x]');

                        // Saltar líneas que no son tareas
                        if (!linea.trim().startsWith('- [')) continue;
                        
                        // Implementar lógica separada para tareas en ejecución
                        if (buscarEnEjecucion) {
                            if (!esEnEjecucion) continue; // Solo procesar tareas en ejecución
                        } else {
                            // Para otras búsquedas, ignorar tareas completadas y en ejecución
                            if (esCompletada || esEnEjecucion) continue;
                            if (!esAbierta) continue;
                        }

                        // Extraer el texto limpio de la tarea
                        const textoLimpio = this.taskUtils.limpiarTextoTarea(linea);
                        const textoOriginal = linea.trim();

                        // Extraer metadatos
                        const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                        const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                        const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                        const { taskId, dependencyId } = this.taskUtils.extraerDependenciasYIds(linea);

                        // Crear objeto de tarea
                        const tarea: Task = {
                            texto: textoLimpio,
                            textoOriginal: textoOriginal,
                            rutaArchivo: file.path,
                            nombreArchivo: file.basename,
                            titulo: tituloNota,
                            estado: esEnEjecucion ? EstadoTarea.EnEjecucion : EstadoTarea.Abierta,
                            ...fechasYHoras,
                            etiquetas: {
                                todas: etiquetasExtraidas,
                                ...etiquetasCategorizadas
                            },
                            taskId,
                            dependencyId
                        };

                        // Calcular peso y verificar dependencias
                        tarea.weight = TaskWeightCalculator.calculateWeight(tarea);
                        if (dependencyId) {
                            const estadoDependencia = await this.taskUtils.verificarEstadoTarea(dependencyId);
                            tarea.isBlocked = !estadoDependencia.completada;
                            tarea.dependencyLocation = estadoDependencia.rutaArchivo;
                            tarea.dependencyTitle = estadoDependencia.tituloArchivo;
                            tarea.dependencyTexto = estadoDependencia.textoTarea; // Agregar el texto de la tarea dependiente
                        }

                        // Aplicar filtro
                        const cumpleFiltro = await Promise.resolve(filtro(tarea));
                        if (cumpleFiltro) {
                            console.log(`-> Tarea agregada: ${textoLimpio.substring(0, 50)}...`);
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
            console.warn('\nErrores encontrados durante el procesamiento:', errores);
        }

        console.log(`\n=== PROCESAMIENTO COMPLETADO ===`);
        console.log(`Total de tareas encontradas: ${tareas.length}`);
        
        // Ordenar las tareas según corresponda
        return buscarEnEjecucion ? 
            this.organizarTareasEnEjecucion(tareas) : 
            TaskWeightCalculator.sortTasks(tareas);
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
            // Obtener tareas en ejecución
            const tareas = await this.procesarTareas(
                this.plugin.app.vault.getMarkdownFiles(),
                (tarea) => true, // No aplicamos filtro adicional porque ya filtramos por estado en procesarTareas
                true // Indicar que buscamos tareas en ejecución
            );

            if (tareas.length === 0) {
                new Notice('No se encontraron tareas en ejecución');
                return;
            }

            // Generar vista y guardar archivo
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
            contenido += this.renderizarGrupoTareasEnEjecucion(tareasConVencimiento);
        }

        if (tareasProgramadas.length > 0) {
            contenido += `## Programadas (${tareasProgramadas.length})\n\n`;
            contenido += this.renderizarGrupoTareasEnEjecucion(tareasProgramadas);
        }

        if (tareasConInicio.length > 0) {
            contenido += `## Con fecha de inicio (${tareasConInicio.length})\n\n`;
            contenido += this.renderizarGrupoTareasEnEjecucion(tareasConInicio);
        }

        if (tareasSinFecha.length > 0) {
            contenido += `## Sin fecha asignada (${tareasSinFecha.length})\n\n`;
            contenido += this.renderizarGrupoTareasEnEjecucion(tareasSinFecha);

        return contenido;
    }
}


        // Añadir método específico para renderizar grupos de tareas en ejecución
    private renderizarGrupoTareasEnEjecucion(tareas: Task[]): string {
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

        // Método principal para obtener tareas con dependencias
        public async getTareasDependientes(): Promise<{
            ejecutables: Task[],
            bloqueadas: Task[]
        }> {
            console.log("=== Iniciando búsqueda de tareas con dependencias ===");
            
            const tareas = await this.procesarTareas(
                this.plugin.app.vault.getMarkdownFiles(),
                async (tarea) => {
                    console.log("\nAnalizando tarea:", tarea.texto);
                    console.log("DependencyId:", tarea.dependencyId);
                    
                    if (!tarea.dependencyId) {
                        console.log("-> Ignorada: No tiene dependencia");
                        return false;
                    }
                    
                    const resultado = await this.taskUtils.verificarEstadoTarea(tarea.dependencyId);
                    console.log(`-> Dependencia ${tarea.dependencyId} completada:`, resultado.completada);
                    
                    tarea.isBlocked = !resultado.completada;
                    // Agregar información de la ubicación de la tarea dependiente
                    tarea.dependencyLocation = resultado.rutaArchivo;
                    tarea.dependencyTitle = resultado.tituloArchivo;
                    
                    return true;
                }
            );
        
            return {
                ejecutables: tareas.filter(t => !t.isBlocked),
                bloqueadas: tareas.filter(t => t.isBlocked)
            };
        }
    
        // Método para mostrar las tareas dependientes
        public async mostrarTareasDependientes(): Promise<void> {
            try {
                const { ejecutables, bloqueadas } = await this.getTareasDependientes();
                
                if (ejecutables.length === 0 && bloqueadas.length === 0) {
                    new Notice('No se encontraron tareas con dependencias.');
                    return;
                }
    
                const contenido = this.generarVistaDependencias(ejecutables, bloqueadas);
    
                await this.guardarYAbrirArchivo(
                    `${this.plugin.settings.folder_SistemaGTD}/Tareas con Dependencias.md`,
                    contenido
                );
                
                new Notice(`Se encontraron ${ejecutables.length + bloqueadas.length} tareas con dependencias`);
            } catch (error) {
                console.error("Error en mostrarTareasDependientes:", error);
                new Notice(`Error: ${error.message}`);
            }
        }
    
        // Método para generar la vista de dependencias
        private generarVistaDependencias(ejecutables: Task[], bloqueadas: Task[]): string {
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = `# Tareas con Dependencias\n\n`;
            
            contenido += this.generarBotonActualizacion("mostrarTareasDependientes");
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de tareas con dependencias: ${ejecutables.length + bloqueadas.length}\n\n`;
    
            if (ejecutables.length > 0) {
                contenido += `## Tareas Ejecutables (${ejecutables.length})\n`;
                contenido += `> [!success] Estas tareas ya pueden ser ejecutadas porque sus dependencias están completadas\n\n`;
                contenido += this.renderizarGrupoDependencias(ejecutables, true);
            }
    
            if (bloqueadas.length > 0) {
                contenido += `\n## Tareas Bloqueadas (${bloqueadas.length})\n`;
                contenido += `> [!warning] Estas tareas están esperando que se completen otras tareas\n\n`;
                contenido += this.renderizarGrupoDependencias(bloqueadas, false);
            }
    
            return contenido;
        }
    
        // Método para renderizar grupos de tareas con dependencias
        private renderizarGrupoDependencias(tareas: Task[], ejecutables: boolean): string {
            const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
            let contenido = '';
            
            for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
                contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
                info.tareas.forEach(tarea => {
                    contenido += this.renderizarTareaConDependencia(tarea, ejecutables);
                });
                contenido += '\n';
            }
            
            return contenido;
        }
    
        // Método para renderizar una tarea individual con dependencia
        private renderizarTareaConDependencia(tarea: Task, esEjecutable: boolean): string {
            console.log("\nRenderizando tarea:", tarea.texto);
            console.log("Es ejecutable:", esEjecutable);
            
            let contenido = `- [ ] ${tarea.texto}\n`;
            
            // Mostrar ID de la tarea si existe
            if (tarea.taskId) {
                contenido += `    🆔 ${tarea.taskId}\n`;
            }
            
  
            // Mostrar detalles de la dependencia
            if (tarea.dependencyId) {
                contenido += `    ↳ Depende de: ${tarea.dependencyTitle ? `[[${tarea.dependencyLocation}|${tarea.dependencyTitle}]]` : 'No encontrada'}`;
                if (tarea.dependencyTexto) {
                    contenido += `: "${tarea.dependencyTexto}"`;
                }
                contenido += esEjecutable ? ' ✅' : ' ⏳';
                contenido += '\n';
            }
        
            // Resto del contenido...
            if (tarea.fechaVencimiento) {
                contenido += `    📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}\n`;
            }
            if (tarea.fechaScheduled) {
                contenido += `    ⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}\n`;
            }
            if (tarea.fechaStart) {
                contenido += `    🛫 ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}\n`;
            }
        
            if (tarea.etiquetas.contextos?.length > 0) {
                contenido += `    🗂️ ${tarea.etiquetas.contextos.join(' | ')}\n`;
            }
            if (tarea.etiquetas.personas?.length > 0) {
                contenido += `    👤 ${tarea.etiquetas.personas.join(' | ')}\n`;
            }
        
            return contenido;
        }
        
        public async mostrarTareasPersonas(): Promise<void> {
            try {
                const { personasConTareas, totalPersonas, totalTareas } = await this.getTareasPersonas();
                
                if (totalPersonas === 0) {
                    new Notice('No se encontraron tareas asignadas a personas.');
                    return;
                }
        
                const contenido = this.generarVistaPersonas(personasConTareas, totalPersonas, totalTareas);
        
                await this.guardarYAbrirArchivo(
                    `${this.plugin.settings.folder_SistemaGTD}/Tareas por Persona.md`,
                    contenido
                );
                
                new Notice(`Se encontraron ${totalTareas} tareas asignadas a ${totalPersonas} personas`);
            } catch (error) {
                console.error("Error en mostrarTareasPersonas:", error);
                new Notice(`Error: ${error.message}`);
            }
        }

        private generarVistaPersonas(
            personasConTareas: Map<string, Task[]>,
            totalPersonas: number,
            totalTareas: number
        ): string {
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = `# Tareas Asignadas por Persona\n\n`;
            
            // Cabecera y resumen
            contenido += this.generarBotonActualizacion("mostrarTareasPersonas");
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de personas con tareas: ${totalPersonas}\n`;
            contenido += `> Total de tareas asignadas: ${totalTareas}\n\n`;
        
            // Resumen de asignaciones
            contenido += `## Resumen de Asignaciones\n`;
            Array.from(personasConTareas.entries())
                .sort(([, tareasA], [, tareasB]) => tareasB.length - tareasA.length)
                .forEach(([persona, tareas]) => {
                    const nombreFormateado = this.formatearNombrePersona(persona);
                    contenido += `- [[#${nombreFormateado}|${nombreFormateado}]] (${tareas.length} tareas)\n`;
                });
            contenido += '\n';
        
            // Detalle de tareas por persona
            contenido += `## Tareas por Persona\n\n`;
            Array.from(personasConTareas.entries())
                .sort(([, tareasA], [, tareasB]) => tareasB.length - tareasA.length)
                .forEach(([persona, tareas]) => {
                    contenido += `### ${this.formatearNombrePersona(persona)}\n[[#Resumen de Asignaciones|⬆️]]\n`;
                    
                    // Ordenar tareas por peso y mostrarlas directamente
                    const tareasOrdenadas = TaskWeightCalculator.sortTasks(tareas);
                    tareasOrdenadas.forEach(tarea => {
                        contenido += this.renderizarTareaPersona(tarea);
                    });
                    contenido += '\n';
                });
        
            return contenido;
        }
        
        private renderizarTareaPersona(tarea: Task): string {
            
            let contenido = `- [ ] ${tarea.texto}\n`;
        
            // Añadir ubicación de la tarea con número de línea si está disponible
            contenido += `    📍 [[${tarea.rutaArchivo}|${tarea.titulo}]]`;
            if (tarea.lineInfo?.numero) {
                contenido += ` (línea ${tarea.lineInfo.numero})`;
            }
            contenido += '\n'; 
            // Fechas
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
                contenido += `    ⏰ Fechas:\n        ${fechas.join('\n        ')}\n`;
            }
        
            // Horarios
            if (tarea.horaInicio || tarea.horaFin) {
                contenido += `    ⌚ Horario: ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
            }
        
            // Contextos
            if (tarea.etiquetas.contextos?.length > 0) {
                contenido += `    🗂️ Contextos: ${tarea.etiquetas.contextos.join(' | ')}\n`;
            }
        
            // Peso y prioridad
            if (tarea.weight) {
                const prioridad = this.obtenerPrioridadTarea(tarea.texto);
                if (prioridad) {
                    contenido += `    ${prioridad.emoji} Prioridad: ${prioridad.nombre}\n`;
                }
            }
        
            return contenido;
        }
        
        private formatearNombrePersona(tag: string): string {
            return tag.replace('#px-', '')
                     .replace(/_/g, ' ')
                     .split(' ')
                     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                     .join(' ');
        }

    
        private normalizarContexto(contexto: string): string {
            // Normalizar tanto formatos #cx-contexto como #cx/contexto
            return contexto.replace(/[/-]/g, ' → ').trim();
        }
    
        public async mostrarTareasContextos(): Promise<void> {
            try {
                const { contextosConTareas, totalContextos, totalTareas } = await this.getTareasContextos();
                
                if (totalContextos === 0) {
                    new Notice('No se encontraron tareas con contextos asignados.');
                    return;
                }
    
                const contenido = this.generarVistaContextos(contextosConTareas, totalContextos, totalTareas);
    
                await this.guardarYAbrirArchivo(
                    `${this.plugin.settings.folder_SistemaGTD}/Tareas por Contexto.md`,
                    contenido
                );
                
                new Notice(`Se encontraron ${totalTareas} tareas en ${totalContextos} contextos`);
            } catch (error) {
                console.error("Error en mostrarTareasContextos:", error);
                new Notice(`Error: ${error.message}`);
            }
        }
    
        private generarVistaContextos(
            contextosConTareas: Map<string, Task[]>,
            totalContextos: number,
            totalTareas: number
        ): string {
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = `# Tareas por Contexto\n\n`;
            
            // Cabecera y resumen
            contenido += this.generarBotonActualizacion("mostrarTareasContextos");
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de contextos con tareas: ${totalContextos}\n`;
            contenido += `> Total de tareas encontradas: ${totalTareas}\n\n`;
    
            // Construir árbol de contextos
            const arbolContextos = this.construirArbolContextos(contextosConTareas);
            
            // Resumen de contextos
            contenido += `## Resumen de Contextos\n`;
            this.generarResumenContextos(arbolContextos, 0).forEach(linea => {
                contenido += linea + '\n';
            });
            contenido += '\n';
    
            // Detalle de tareas por contexto
            contenido += `## Tareas por Contexto\n\n`;
            this.generarDetalleContextos(arbolContextos, contextosConTareas).forEach(bloque => {
                contenido += bloque;
            });
    
            return contenido;
        }
    
        private construirArbolContextos(contextosConTareas: Map<string, Task[]>): Map<string, any> {
            const arbol = new Map<string, any>();
    
            Array.from(contextosConTareas.keys()).forEach(contexto => {
                const niveles = contexto.split(' → ');
                let nodoActual = arbol;
    
                niveles.forEach((nivel, index) => {
                    if (!nodoActual.has(nivel)) {
                        nodoActual.set(nivel, {
                            tareas: index === niveles.length - 1 ? contextosConTareas.get(contexto) : [],
                            subcontextos: new Map(),
                            rutaCompleta: niveles.slice(0, index + 1).join(' → ')
                        });
                    }
                    nodoActual = nodoActual.get(nivel).subcontextos;
                });
            });
    
            return arbol;
        }
    
        private generarResumenContextos(arbol: Map<string, any>, nivel: number): string[] {
            const lineas: string[] = [];
            
            arbol.forEach((nodo, contexto) => {
                const indentacion = '  '.repeat(nivel);
                const rutaContexto = nodo.rutaCompleta;
                const cantidadTareas = nodo.tareas.length;
                
                if (cantidadTareas > 0) {
                    lineas.push(`${indentacion}- [[#${rutaContexto}|${contexto}]] (${cantidadTareas} tareas)`);
                } else {
                    lineas.push(`${indentacion}- ${contexto}`);
                }
    
                // Procesar subcontextos
                if (nodo.subcontextos.size > 0) {
                    lineas.push(...this.generarResumenContextos(nodo.subcontextos, nivel + 1));
                }
            });
    
            return lineas;
        }
    

        private generarBloqueContexto(contexto: string, tareas: Task[]): string {
            let bloque = `### ${contexto}\n[[#Resumen de Contextos|⬆️]]\n`;
    
            // Usar directamente las tareas ordenadas por el TaskWeightCalculator
            tareas.forEach(tarea => {
                bloque += this.renderizarTareaContexto(tarea);
            });
    
            return bloque + '\n';
        }
    

        public async getTareasPersonas(): Promise<{
            personasConTareas: Map<string, Task[]>,
            totalPersonas: number,
            totalTareas: number
        }> {
            console.log("\n=== INICIANDO BÚSQUEDA DE TAREAS ASIGNADAS A PERSONAS ===");
            
            const personasConTareas = new Map<string, Task[]>();
            const lineasPorArchivo = new Map<string, Map<string, LineInfo>>();
            
            const tareas = await this.procesarTareas(
                this.plugin.app.vault.getMarkdownFiles(),
                async (tarea) => {
                    if (!tarea.etiquetas.personas || tarea.etiquetas.personas.length === 0) {
                        return false;
                    }
                    
                    // Obtener información de líneas solo cuando sea necesario
                    if (!lineasPorArchivo.has(tarea.rutaArchivo)) {
                        lineasPorArchivo.set(
                            tarea.rutaArchivo,
                            await this.taskUtils.encontrarLineasTarea(
                                this.plugin.app.vault.getAbstractFileByPath(tarea.rutaArchivo) as TFile
                            )
                        );
                    }
                    
                    // Agregar información de línea a la tarea
                    const lineasArchivo = lineasPorArchivo.get(tarea.rutaArchivo);
                    if (lineasArchivo) {
                        const lineInfo = lineasArchivo.get(tarea.texto);
                        if (lineInfo) {
                            tarea.lineInfo = lineInfo;
                        }
                    }
                    
                    tarea.etiquetas.personas.forEach(tag => {
                        const personaTag = `#px-${tag}`;
                        if (!personasConTareas.has(personaTag)) {
                            personasConTareas.set(personaTag, []);
                        }
                        personasConTareas.get(personaTag)!.push(tarea);
                    });
                    
                    return true;
                }
            );
    
            // Ordenar las tareas de cada persona
            personasConTareas.forEach((tareas, persona) => {
                const tareasOrdenadas = TaskWeightCalculator.sortTasks(tareas);
                personasConTareas.set(persona, tareasOrdenadas);
            });
    
            return {
                personasConTareas,
                totalPersonas: personasConTareas.size,
                totalTareas: Array.from(personasConTareas.values())
                    .reduce((sum, tareas) => sum + tareas.length, 0)
            };
        }

        public async getTareasContextos(): Promise<{
            contextosConTareas: Map<string, Task[]>,
            totalContextos: number,
            totalTareas: number
        }> {
            console.log("\n=== INICIANDO BÚSQUEDA DE TAREAS POR CONTEXTO ===");
            
            const contextosConTareas = new Map<string, Task[]>();
            const lineasPorArchivo = new Map<string, Map<string, LineInfo>>();
            
            const tareas = await this.procesarTareas(
                this.plugin.app.vault.getMarkdownFiles(),
                async (tarea) => {
                    console.log("\nAnalizando tarea:", tarea.texto);
                    if (!tarea.etiquetas.contextos || tarea.etiquetas.contextos.length === 0) {
                        return false;
                    }
                    
                    // Obtener información de líneas manteniendo la lógica existente
                    if (!lineasPorArchivo.has(tarea.rutaArchivo)) {
                        lineasPorArchivo.set(
                            tarea.rutaArchivo,
                            await this.taskUtils.encontrarLineasTarea(
                                this.plugin.app.vault.getAbstractFileByPath(tarea.rutaArchivo) as TFile
                            )
                        );
                    }
                    
                    const lineasArchivo = lineasPorArchivo.get(tarea.rutaArchivo);
                    if (lineasArchivo) {
                        const lineInfo = lineasArchivo.get(tarea.texto);
                        if (lineInfo) {
                            tarea.lineInfo = lineInfo;
                        }
                    }
                    
                    // Mantener la lógica existente de procesamiento de contextos
                    tarea.etiquetas.contextos.forEach(contexto => {
                        const contextoNormalizado = this.normalizarContexto(contexto);
                        if (!contextosConTareas.has(contextoNormalizado)) {
                            contextosConTareas.set(contextoNormalizado, []);
                        }
                        contextosConTareas.get(contextoNormalizado)!.push(tarea);
                    });
                    
                    return true;
                }
            );
    
            // Mantener la organización y peso existentes
            contextosConTareas.forEach((tareas, contexto) => {
                // Usar el sistema de pesos existente
                const tareasOrdenadas = TaskWeightCalculator.sortTasks(tareas);
                contextosConTareas.set(contexto, tareasOrdenadas);
            });
    
            return {
                contextosConTareas,
                totalContextos: contextosConTareas.size,
                totalTareas: Array.from(contextosConTareas.values())
                    .reduce((sum, tareas) => sum + tareas.length, 0)
            };
        }
    
        private generarDetalleContextos(
            arbol: Map<string, any>, 
            contextosConTareas: Map<string, Task[]>
        ): string[] {
            const bloques: string[] = [];
        
            const procesarNodo = (nodo: Map<string, any>, rutaActual: string[] = []) => {
                nodo.forEach((info, contexto) => {
                    const rutaCompleta = info.rutaCompleta;
                    
                    if (info.tareas.length > 0) {
                        // Asegurar que las tareas estén ordenadas por el sistema de pesos
                        const tareasOrdenadas = TaskWeightCalculator.sortTasks(info.tareas);
                        bloques.push(this.generarBloqueContexto(rutaCompleta, tareasOrdenadas));
                    }
        
                    if (info.subcontextos.size > 0) {
                        procesarNodo(info.subcontextos, [...rutaActual, contexto]);
                    }
                });
            };
        
            procesarNodo(arbol);
            return bloques;
        }
    
        private renderizarTareaContexto(tarea: Task): string {
            let contenido = `- [ ] ${tarea.texto}\n`;
            
            // Añadir ubicación con número de línea
            contenido += `    📍 [[${tarea.rutaArchivo}|${tarea.titulo}]]`;
            if (tarea.lineInfo?.numero) {
                contenido += ` (línea ${tarea.lineInfo.numero})`;
            }
            contenido += '\n';
    
            // Mostrar el peso y prioridad primero (manteniendo el sistema existente)
            const prioridad = this.obtenerPrioridadTarea(tarea.texto);
            if (prioridad) {
                contenido += `    ${prioridad.emoji} Prioridad: ${prioridad.nombre}\n`;
            }
            if (tarea.weight) {
                const { baseWeight, timeWeight, priorityWeight } = tarea.weight;
                if (baseWeight + timeWeight + priorityWeight > 0) {
                    contenido += `    ⚖️ Peso total: ${tarea.weight.totalWeight}\n`;
                }
            }
            
            // Fechas (manteniendo el formato existente)
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
                contenido += `    ⏰ Fechas:\n        ${fechas.join('\n        ')}\n`;
            }
    
            // Horarios
            if (tarea.horaInicio || tarea.horaFin) {
                contenido += `    ⌚ Horario: ${tarea.horaInicio || '--:--'} - ${tarea.horaFin || '--:--'}\n`;
            }
    
            // Personas asignadas
            if (tarea.etiquetas.personas?.length > 0) {
                contenido += `    👤 Asignado a: ${tarea.etiquetas.personas.map(p => 
                    this.formatearNombrePersona(`#px-${p}`)
                ).join(' | ')}\n`;
            }
    
            // Dependencias
            if (tarea.dependencyId) {
                contenido += `    ↳ Depende de: `;
                if (tarea.dependencyTitle) {
                    contenido += `[[${tarea.dependencyLocation}|${tarea.dependencyTitle}]]`;
                    if (tarea.dependencyTexto) {
                        contenido += `: "${tarea.dependencyTexto}"`;
                    }
                }
                contenido += tarea.isBlocked ? ' ⏳' : ' ✅';
                contenido += '\n';
            }
    
            return contenido;
        }


        // -- Contextos GTD

        // Añadir este método a la clase TareasAPI en src/modules/taskManager/api/tareasAPI.ts


// Método para verificar si un nodo o sus descendientes tienen tareas
private tieneAlgunaTarea(nodo: Map<string, any>): boolean {
    for (const [_, info] of nodo.entries()) {
        if (info.tareas.length > 0) {
            return true;
        }
        
        if (info.subcontextos.size > 0 && this.tieneAlgunaTarea(info.subcontextos)) {
            return true;
        }
    }
    
    return false;
}

// Método para generar el resumen de contextos con indentación
private generarResumenContextosMarkdown(arbol: Map<string, any>, nivel: number, resultado: string): string {
    let res = resultado;
    
    // Ordenar contextos por cantidad de tareas
    const sortedKeys = Array.from(arbol.keys()).sort((a, b) => {
        const tareasA = arbol.get(a).tareas.length;
        const tareasB = arbol.get(b).tareas.length;
        return tareasB - tareasA;
    });
    
    for (const contexto of sortedKeys) {
        const info = arbol.get(contexto);
        const cantidadTareas = info.tareas.length;
        const rutaCompleta = info.rutaCompleta;
        
        // Indentación con espacios
        const indentacion = "    ".repeat(nivel);
        
        // Formato de elemento de lista
        if (cantidadTareas > 0) {
            // Crear identificador de encabezado usando la ruta completa
            const headerId = this.crearHeaderId(rutaCompleta || contexto);
            res += `${indentacion}- [[#${headerId}|${this.formatearNombreContexto(contexto)}]] (${cantidadTareas} tareas)\n`;
        } else if (this.tieneAlgunaTarea(info.subcontextos)) {
            res += `${indentacion}- **${this.formatearNombreContexto(contexto)}**\n`;
        }
        
        // Procesar subcontextos si tienen tareas
        if (info.subcontextos.size > 0) {
            res = this.generarResumenContextosMarkdown(info.subcontextos, nivel + 1, res);
        }
    }
    
    return res;
}


// Método para formatear el nombre del contexto de manera más legible
private formatearNombreContexto(contexto: string): string {
    // Si es un contexto con jerarquía (tiene →), obtener solo la última parte
    if (contexto.includes(' → ')) {
        return contexto.split(' → ').pop() || contexto;
    }
    return contexto;
}



// ---------- Taeas huerfanas

// Método para TareasAPI que busca tareas sin contextos, personas, fechas o clasificación GTD

/**
 * Obtiene todas las tareas que no tienen asignado contexto, persona, fechas o clasificación GTD
 * @returns {Promise<Object>} Objeto con tareas agrupadas por nota y contadores
 */
public async getTareasSinClasificar(): Promise<{
    tareasPorNota: Map<string, {
        titulo: string,
        ruta: string,
        tareas: Task[]
    }>,
    totalTareas: number,
    totalNotas: number
}> {
    try {
        console.log("\n=== INICIANDO BÚSQUEDA DE TAREAS SIN CLASIFICAR ===");
        
        // Mapa para agrupar tareas por archivo
        const tareasPorNota = new Map<string, {
            titulo: string,
            ruta: string,
            tareas: Task[]
        }>();

        // Mapa para guardar información de líneas por archivo (optimización)
        const lineasPorArchivo = new Map<string, Map<string, LineInfo>>();
        
        // Obtener todas las tareas sin filtro inicial
        const tareas = await this.procesarTareas(
            this.plugin.app.vault.getMarkdownFiles(),
            async (tarea) => {
                // Verificar que la tarea no tenga:
                // 1. Contextos (#cx-)
                const sinContextos = !tarea.etiquetas.contextos || tarea.etiquetas.contextos.length === 0;
                
                // 2. Personas asignadas (#px-)
                const sinPersonas = !tarea.etiquetas.personas || tarea.etiquetas.personas.length === 0;
                
                // 3. Fechas (Due, Start, Scheduled)
                const sinFechas = !tarea.fechaVencimiento && !tarea.fechaStart && !tarea.fechaScheduled;
                
                // 4. Clasificación GTD (#GTD-)
                const sinGTD = !tarea.etiquetas.todas.some(tag => tag.startsWith('#GTD-'));
                
                // 5. No está clasificada para inbox (#inbox)
                const noInbox = !tarea.etiquetas.todas.some(tag => tag.toLowerCase() === '#inbox');
                
                // Comprobar si cumple todos los criterios (sin clasificaciones)
                const sinClasificar = sinContextos && sinPersonas && sinFechas && sinGTD && noInbox;
                
                // Si la tarea cumple los criterios, agregar información de línea
                if (sinClasificar) {
                    // Optimización: obtener información de líneas solo cuando sea necesario
                    if (!lineasPorArchivo.has(tarea.rutaArchivo)) {
                        try {
                            const archivo = this.plugin.app.vault.getAbstractFileByPath(tarea.rutaArchivo) as TFile;
                            if (archivo) {
                                lineasPorArchivo.set(
                                    tarea.rutaArchivo,
                                    await this.taskUtils.encontrarLineasTarea(archivo)
                                );
                            }
                        } catch (error) {
                            console.error(`Error al buscar líneas en ${tarea.rutaArchivo}:`, error);
                        }
                    }
                    
                    // Agregar información de línea a la tarea
                    const lineasArchivo = lineasPorArchivo.get(tarea.rutaArchivo);
                    if (lineasArchivo) {
                        const lineInfo = lineasArchivo.get(tarea.texto);
                        if (lineInfo) {
                            tarea.lineInfo = lineInfo;
                        }
                    }
                    
                    // Agrupar por archivo
                    if (!tareasPorNota.has(tarea.rutaArchivo)) {
                        tareasPorNota.set(tarea.rutaArchivo, {
                            titulo: tarea.titulo,
                            ruta: tarea.rutaArchivo,
                            tareas: []
                        });
                    }
                    
                    tareasPorNota.get(tarea.rutaArchivo).tareas.push(tarea);
                }
                
                return sinClasificar;
            }
        );
        
        // Contar totales
        const totalTareas = tareas.length;
        const totalNotas = tareasPorNota.size;
        
        console.log(`=== BÚSQUEDA COMPLETADA ===`);
        console.log(`Total de tareas sin clasificar: ${totalTareas}`);
        console.log(`Total de notas con tareas sin clasificar: ${totalNotas}`);
        
        return {
            tareasPorNota,
            totalTareas,
            totalNotas
        };
    } catch (error) {
        console.error("Error en getTareasSinClasificar:", error);
        throw error;
    }
}

/**
 * Muestra una vista con todas las tareas sin clasificar agrupadas por nota
 * @returns {Promise<void>}
 */
public async mostrarTareasSinClasificar(): Promise<void> {
    try {
        // Obtener tareas sin clasificar
        const { tareasPorNota, totalTareas, totalNotas } = await this.getTareasSinClasificar();
        
        if (totalTareas === 0) {
            new Notice('No se encontraron tareas sin clasificar.');
            return;
        }
        
        // Generar contenido del archivo
        const contenido = this.generarVistaTareasSinClasificar(tareasPorNota, totalTareas, totalNotas);
        
        // Guardar y abrir archivo
        await this.guardarYAbrirArchivo(
            `${this.plugin.settings.folder_SistemaGTD}/Tareas Sin Clasificar.md`,
            contenido
        );
        
        new Notice(`Se encontraron ${totalTareas} tareas sin clasificar en ${totalNotas} notas`);
    } catch (error) {
        console.error("Error en mostrarTareasSinClasificar:", error);
        new Notice(`Error: ${error.message}`);
    }
}

/**
 * Genera el contenido de la vista de tareas sin clasificar
 * @param {Map} tareasPorNota - Mapa con las tareas agrupadas por nota
 * @param {number} totalTareas - Total de tareas sin clasificar
 * @param {number} totalNotas - Total de notas con tareas sin clasificar
 * @returns {string} - Contenido markdown para el archivo
 */
private generarVistaTareasSinClasificar(
    tareasPorNota: Map<string, {
        titulo: string,
        ruta: string,
        tareas: Task[]
    }>,
    totalTareas: number,
    totalNotas: number
): string {
    const hoy = this.taskUtils.obtenerFechaLocal();
    let contenido = `# Tareas Sin Clasificar\n\n`;
    
    // Agregar botón de actualización
    contenido += this.generarBotonActualizacion("mostrarTareasSinClasificar");
    
    // Añadir información general
    contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    contenido += `> Total de tareas sin clasificar: ${totalTareas}\n`;
    contenido += `> Total de notas con tareas sin clasificar: ${totalNotas}\n\n`;
    
    // Ordenar notas por cantidad de tareas (descendente)
    const notasOrdenadas = Array.from(tareasPorNota.values())
        .sort((a, b) => b.tareas.length - a.tareas.length);
    
    // Generar secciones por nota
    for (const notaInfo of notasOrdenadas) {
        contenido += `## [[${notaInfo.ruta}|${notaInfo.titulo}]] (${notaInfo.tareas.length})\n\n`;
        
        // Renderizar cada tarea
        for (const tarea of notaInfo.tareas) {
            contenido += this.renderizarTareaSinClasificar(tarea);
        }
        
        contenido += '\n';
    }
    
    return contenido;
}

/**
 * Renderiza una tarea sin clasificar en formato markdown
 * @param {Task} tarea - Tarea a renderizar
 * @returns {string} - Representación markdown de la tarea
 */
private renderizarTareaSinClasificar(tarea: Task): string {
    let contenido = `- [ ] ${tarea.texto}\n`;
    
    // Agregar metainformación
    if (tarea.lineInfo?.numero) {
        contenido += `    - 📍 Línea: ${tarea.lineInfo.numero}\n`;
    }
    
    // Agregar etiquetas si tiene alguna (aunque no sean de las categorías buscadas)
    if (tarea.etiquetas.todas.length > 0) {
        contenido += `    - 🏷️ Etiquetas: ${tarea.etiquetas.todas.join(' ')}\n`;
    }
    
    return contenido;
}

     
}