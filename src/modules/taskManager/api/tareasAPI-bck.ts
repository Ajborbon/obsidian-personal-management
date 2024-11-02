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
        try {
            const files = this.plugin.app.vault.getMarkdownFiles();
            const hoy = this.taskUtils.obtenerFechaLocal();
            const dias = typeof diasProximos === 'number' && !isNaN(diasProximos) ? diasProximos : 7;
            const limiteFuturo = new Date(hoy);
            limiteFuturo.setDate(limiteFuturo.getDate() + dias);
            
            console.log("\n=== INICIO DE BÚSQUEDA DE TAREAS POR INICIAR ===");
            console.log(`Fecha actual: ${hoy.toLocaleDateString()}`);
            console.log(`Buscando tareas hasta: ${limiteFuturo.toLocaleDateString()}`);
            
            const tareas: Task[] = [];
            
            for (const file of files) {
                try {
                    const contenido = await this.plugin.app.vault.cachedRead(file);
                    const lineas = contenido.split('\n');
                    const tituloNota = this.taskUtils.obtenerTituloNota(file);
                    
                    for (const linea of lineas) {
                        if (!linea.trim().startsWith('- [ ]')) continue;
    
                        const fechasYHoras = this.taskUtils.extraerFechasYHoras(linea);
                        
                        if (fechasYHoras.fechaStart) {
                            const fechaStart = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaStart);
                            
                            // Verificar si está en el rango (desde hoy hasta limiteFuturo)
                            if (fechaStart && fechaStart <= limiteFuturo && fechaStart >= hoy) {
                                const etiquetasExtraidas = this.taskUtils.extraerEtiquetas(linea);
                                const etiquetasCategorizadas = this.taskUtils.categorizarEtiquetas(etiquetasExtraidas);
                                const textoTarea = this.taskUtils.limpiarTextoTarea(linea);
    
                                // Determinar estado basado en fechas
                                let estado = EstadoTarea.Programada;
                                if (fechasYHoras.fechaVencimiento) {
                                    const fechaVenc = this.taskUtils.parsearFechaVencimiento(fechasYHoras.fechaVencimiento);
                                    if (fechaVenc && fechaVenc < hoy) {
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
    
                                // Calcular el peso de la tarea
                                tarea.weight = TaskWeightCalculator.calculateWeight(tarea);
                                
                                tareas.push(tarea);
                            }
                        }
                    }
                } catch (fileError) {
                    console.error(`Error procesando archivo ${file.path}:`, fileError);
                    continue;
                }
            }
    
            // Ordenar las tareas
            return tareas.sort((a, b) => {
                // Primero ordenar por fecha de inicio
                const fechaStartA = this.taskUtils.parsearFechaVencimiento(a.fechaStart);
                const fechaStartB = this.taskUtils.parsearFechaVencimiento(b.fechaStart);
                
                if (fechaStartA && fechaStartB) {
                    const fechaDiff = fechaStartA.getTime() - fechaStartB.getTime();
                    if (fechaDiff !== 0) return fechaDiff;
                }
    
                // Si las fechas son iguales, ordenar por hora de inicio
                if (a.horaInicio && b.horaInicio) {
                    if (a.horaInicio !== b.horaInicio) {
                        return a.horaInicio.localeCompare(b.horaInicio);
                    }
                } else if (a.horaInicio) {
                    return -1;
                } else if (b.horaInicio) {
                    return 1;
                }
    
                // Si no hay horas o son iguales, ordenar por peso
                const pesoA = a.weight?.totalWeight ?? 0;
                const pesoB = b.weight?.totalWeight ?? 0;
                if (pesoA !== pesoB) {
                    return pesoB - pesoA; // Orden descendente por peso
                }
    
                // Como último criterio, ordenar por texto
                return a.texto.localeCompare(b.texto);
            });
    
        } catch (error) {
            console.error('Error obteniendo tareas próximas a iniciar:', error);
            new Notice(`Error al obtener tareas próximas a iniciar para ${diasProximos} días`);
            return [];
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
                        try {
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
                        } catch (lineaError) {
                            errores.push(`Error procesando línea en ${file.path}: ${lineaError.message}`);
                            continue;
                        }
                    }
                } catch (fileError) {
                    errores.push(`Error procesando archivo ${file.path}: ${fileError.message}`);
                    continue;
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

    private tieneFechasValidas(fechasYHoras: any): boolean {
        const { fechaVencimiento, fechaScheduled, fechaStart } = fechasYHoras;
        return fechaVencimiento || fechaScheduled || fechaStart;
    }

    public async getTareasVencidasAbiertas(): Promise<Task[]> {
        try {
            const files = this.plugin.app.vault.getMarkdownFiles();
            const hoy = this.taskUtils.obtenerFechaLocal();
            
            return this.procesarTareas(files, (tarea) => 
                TaskWeightCalculator.shouldIncludeTask(tarea, 'vencidas', hoy));
        } catch (error) {
            console.error('Error obteniendo tareas vencidas:', error);
            new Notice('Error al obtener tareas vencidas');
            return [];
        }
    }

    public async getTareasHoy(): Promise<Task[]> {
        try {
            const files = this.plugin.app.vault.getMarkdownFiles();
            const hoy = this.taskUtils.obtenerFechaLocal();
            
            return this.procesarTareas(files, (tarea) => 
                TaskWeightCalculator.shouldIncludeTask(tarea, 'hoy', hoy));
        } catch (error) {
            console.error('Error obteniendo tareas de hoy:', error);
            new Notice('Error al obtener tareas de hoy');
            return [];
        }
    }

    public async getTareasProximas(diasProximos: number = 7): Promise<Task[]> {
        try {
            const files = this.plugin.app.vault.getMarkdownFiles();
            const hoy = this.taskUtils.obtenerFechaLocal();
            
            return this.procesarTareas(files, (tarea) => 
                TaskWeightCalculator.shouldIncludeTask(tarea, 'proximas', hoy));
        } catch (error) {
            console.error('Error obteniendo tareas próximas:', error);
            new Notice(`Error al obtener tareas próximas para ${diasProximos} días`);
            return [];
        }
    }

    private async generarContenidoVista(
        tareas: Task[],
        titulo: string,
        metodoActualizacion: string,
        fecha: Date,
        diasProximos?: number
    ): Promise<string> {
        try {
            let contenido = `# ${titulo}\n\n`;
            
            // Agregar bloque dataviewjs con botón de actualización
            contenido += this.generarBotonActualizacion(metodoActualizacion, diasProximos);
            
            // Agregar información de actualización
            contenido += `> [!info] Actualizado: ${fecha.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de tareas encontradas: ${tareas.length}\n\n`;
            
            // Agregar tareas agrupadas
            contenido += this.renderizarGrupoTareas(tareas);
            
            return contenido;
        } catch (error) {
            console.error('Error generando contenido de vista:', error);
            throw new Error('Error al generar el contenido de la vista');
        }
    }

    private generarBotonActualizacion(metodo: string, diasProximos?: number): string {
        // Construir los parámetros solo si existen
        const parametros = diasProximos !== undefined ? `${diasProximos}` : '';
        
        return `\`\`\`dataviewjs
    const gp = app.plugins.plugins['obsidian-personal-management'];
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
            await gp.tareasAPI.${metodo}(${parametros});
        } catch (error) {
            console.error('Error al actualizar tareas:', error);
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

    private async manejarError(error: Error): Promise<void> {
        console.error("Error en la operación:", error);
        new Notice(`Error: ${error.message}`);
        
        if (error.message.includes("no existe")) {
            try {
                await this.plugin.app.vault.createFolder(this.plugin.settings.folder_SistemaGTD);
                new Notice(`Se creó la carpeta ${this.plugin.settings.folder_SistemaGTD}. Intentando nuevamente...`);
                // No reintentar automáticamente para evitar posibles bucles
            } catch (folderError) {
                console.error("Error al crear la carpeta:", folderError);
                new Notice("No se pudo crear la carpeta del sistema GTD");
            }
        }
    }

    private obtenerPrioridadTarea(texto: string): { emoji: string; nombre: string } | null {
        if (texto.includes('🔺')) return { emoji: '🔺', nombre: 'Muy Alta' };
        if (texto.includes('⏫')) return { emoji: '⏫', nombre: 'Alta' };
        if (texto.includes('🔼')) return { emoji: '🔼', nombre: 'Media' };
        if (texto.includes('🔽')) return { emoji: '🔽', nombre: 'Baja' };
        if (texto.includes('⏬')) return { emoji: '⏬', nombre: 'Muy Baja' };
        return null;
    }

    private agruparTareasPorTipo(tareas: Task[]): {
        vencimiento: Task[];
        inicio: Task[];
        programadas: Task[];
    } {
        const grupos = {
            vencimiento: [] as Task[],
            inicio: [] as Task[],
            programadas: [] as Task[]
        };

        tareas.forEach(tarea => {
            if (tarea.fechaVencimiento) {
                grupos.vencimiento.push(tarea);
            } else if (tarea.fechaStart) {
                grupos.inicio.push(tarea);
            } else if (tarea.fechaScheduled) {
                grupos.programadas.push(tarea);
            }
        });

        // Ordenar cada grupo por hora/peso
        Object.values(grupos).forEach(grupo => TaskWeightCalculator.sortTasks(grupo));

        return grupos;
    }

    private agruparTareasPorRetraso(tareas: Task[]): {
        criticas: Task[];
        recientes: Task[];
    } {
        const hoy = this.taskUtils.obtenerFechaLocal();
        const grupos = {
            criticas: [] as Task[],
            recientes: [] as Task[]
        };

        tareas.forEach(tarea => {
            if (!tarea.fechaStart) return;
            
            const fechaStart = new Date(tarea.fechaStart);
            const diasRetraso = Math.floor((hoy.getTime() - fechaStart.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diasRetraso > 7) {
                grupos.criticas.push(tarea);
            } else {
                grupos.recientes.push(tarea);
            }
        });

        // Ordenar cada grupo usando el nuevo ordenamiento
        grupos.criticas = TaskWeightCalculator.sortTasks(grupos.criticas);
        grupos.recientes = TaskWeightCalculator.sortTasks(grupos.recientes);

        return grupos;
    }

    private formatearFechaConContexto(fecha: string, tipo: 'due' | 'scheduled' | 'start'): string {
        try {
            const fechaObj = new Date(fecha);
            const hoy = this.taskUtils.obtenerFechaLocal();
            const diferenciaDias = Math.ceil(
                (fechaObj.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
            );

            let textoBase = '';
            let contexto = '';

            switch (tipo) {
                case 'due':
                    textoBase = diferenciaDias < 0 ? 'Venció' : 'Vence';
                    break;
                case 'scheduled':
                    textoBase = 'Programada';
                    break;
                case 'start':
                    textoBase = 'Inicio';
                    break;
            }

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

            return `${textoBase}: ${fecha} (${contexto})`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return `${tipo}: ${fecha}`;
        }
    }

    private renderizarGrupoTareas(tareas: Task[]): string {
        let contenido = '';
        const tareasPorArchivo = this.agruparTareasPorArchivo(tareas);
        
        for (const [rutaArchivo, info] of Object.entries(tareasPorArchivo)) {
            contenido += `### [[${rutaArchivo}|${info.titulo}]]\n\n`;
            
            info.tareas.forEach(tarea => {
                // Texto principal de la tarea
                contenido += `- [ ] ${tarea.texto}\n`;
                
                // Fechas con contexto
                if (tarea.fechaVencimiento) {
                    contenido += `    - 📅 ${this.formatearFechaConContexto(tarea.fechaVencimiento, 'due')}\n`;
                }
                if (tarea.fechaScheduled && tarea.fechaScheduled !== tarea.fechaVencimiento) {
                    contenido += `    - ⏳ ${this.formatearFechaConContexto(tarea.fechaScheduled, 'scheduled')}\n`;
                }
                if (tarea.fechaStart && 
                    tarea.fechaStart !== tarea.fechaScheduled && 
                    tarea.fechaStart !== tarea.fechaVencimiento) {
                    contenido += `    - 🛫 ${this.formatearFechaConContexto(tarea.fechaStart, 'start')}\n`;
                }

                // Resto de la información de la tarea
                if (tarea.horaInicio || tarea.horaFin) {
                    const horaInicioStr = tarea.horaInicio || '--:--';
                    const horaFinStr = tarea.horaFin || '--:--';
                    contenido += `    - ⏰ Horario: ${horaInicioStr} - ${horaFinStr}\n`;
                }

                // Etiquetas
                const etiquetas = tarea.etiquetas;
                
                if (etiquetas.contextos?.length > 0) {
                    contenido += `    - 🔄 Contextos: ${etiquetas.contextos.join(' | ')}\n`;
                }
                
                if (etiquetas.personas?.length > 0) {
                    contenido += `    - 👤 Personas: ${etiquetas.personas.join(' | ')}\n`;
                }
                
                if (etiquetas.todoist?.length > 0) {
                    contenido += `    - ✅ Todoist: ${etiquetas.todoist.join(' ')}\n`;
                }
                
                if (etiquetas.otras?.length > 0) {
                    contenido += `    - 🏷️ Otras: ${etiquetas.otras.join(' ')}\n`;
                }

                // Prioridad
                const prioridad = this.obtenerPrioridadTarea(tarea.texto);
                if (prioridad) {
                    contenido += `    - ${prioridad.emoji} Prioridad: ${prioridad.nombre}\n`;
                }

                // Peso total
                if (tarea.weight) {
                    contenido += `    - 📊 Peso: ${tarea.weight.totalWeight}\n`;
                }
            });
            contenido += '\n';
        }
        
        return contenido;
    }

    public static getFechaPrioritaria(task: Task): string | null {
        if (task.fechaVencimiento) return task.fechaVencimiento;
        if (task.fechaScheduled) return task.fechaScheduled;
        if (task.fechaStart) return task.fechaStart;
        return null;
    }


    public async mostrarTareasHoy(): Promise<void> {
        try {
            console.log("Iniciando búsqueda de tareas para hoy...");
            const tareas = await this.getTareasHoy();
            
            if (tareas.length === 0) {
                console.log("No se encontraron tareas para hoy");
                new Notice('No hay tareas programadas para hoy.');
                return;
            }

            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = "# Tareas para Hoy\n\n";
            
            contenido += this.generarBotonActualizacion("mostrarTareasHoy");
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de tareas para hoy: ${tareas.length}\n\n`;

            // Para tareas de hoy, separamos por tipo de fecha pero mantenemos el formato
            const tareasPorTipo = this.agruparTareasPorTipo(tareas);
            
            if (tareasPorTipo.vencimiento.length > 0) {
                contenido += `## Vencen hoy (${this.formatearFechaGrupo(hoy.toISOString().split('T')[0])})\n\n`;
                contenido += this.renderizarGrupoTareas(tareasPorTipo.vencimiento);
            }

            if (tareasPorTipo.inicio.length > 0) {
                contenido += `## Comienzan hoy (${this.formatearFechaGrupo(hoy.toISOString().split('T')[0])})\n\n`;
                contenido += this.renderizarGrupoTareas(tareasPorTipo.inicio);
            }

            if (tareasPorTipo.programadas.length > 0) {
                contenido += `## Programadas para hoy (${this.formatearFechaGrupo(hoy.toISOString().split('T')[0])})\n\n`;
                contenido += this.renderizarGrupoTareas(tareasPorTipo.programadas);
            }

            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas para Hoy.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas para hoy`);
        } catch (error) {
            await this.manejarError(error);
        }
    }

    public async getTareasStartVencidas(): Promise<Task[]> {
        try {
            const files = this.plugin.app.vault.getMarkdownFiles();
            const hoy = this.taskUtils.obtenerFechaLocal();
            
            return this.procesarTareas(files, (tarea) => 
                TaskWeightCalculator.shouldIncludeTask(tarea, 'start_vencidas', hoy));
        } catch (error) {
            console.error('Error obteniendo tareas con inicio vencido:', error);
            return [];
        }
    }

    private agruparTareasPorRetrasoInicio(tareas: Task[], fechaActual: Date): {
        criticas: Task[];
        recientes: Task[];
    } {
        const grupos = {
            criticas: [] as Task[],
            recientes: [] as Task[]
        };

        tareas.forEach(tarea => {
            if (!tarea.fechaStart) return;
            
            const fechaStart = this.taskUtils.parsearFechaVencimiento(tarea.fechaStart);
            if (!fechaStart) return;

            const diasRetraso = Math.floor(
                (fechaActual.getTime() - fechaStart.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (diasRetraso > 7) {
                grupos.criticas.push(tarea);
            } else {
                grupos.recientes.push(tarea);
            }
        });

        // Ordenar cada grupo por fecha y peso
        grupos.criticas = TaskWeightCalculator.sortTasks(grupos.criticas);
        grupos.recientes = TaskWeightCalculator.sortTasks(grupos.recientes);

        return grupos;
    }

    
    private agruparTareasPorFecha(tareas: Task[], tipoVista: 'vencidas' | 'proximas' | 'start' = 'vencidas'): { [fecha: string]: Task[] } {
        console.log("\n=== INICIO AGRUPACIÓN POR FECHA ===");
        console.log(`Total de tareas a agrupar: ${tareas.length}`);
        console.log(`Tipo de vista: ${tipoVista}`);
        
        try {
            const grupos: { [fecha: string]: Task[] } = {};
            
            tareas.forEach((tarea, index) => {
                console.log(`\nProcesando tarea ${index + 1}:`);
                console.log(`- Texto: ${tarea.texto}`);
                console.log(`- Fecha Start: ${tarea.fechaStart}`);
                console.log(`- Fecha Vencimiento: ${tarea.fechaVencimiento}`);
                
                // Determinar la fecha clave según el tipo de vista
                let fechaClave: string | null = null;
                
                switch (tipoVista) {
                    case 'vencidas':
                        // Para tareas vencidas, usar la fecha de vencimiento
                        if (tarea.fechaVencimiento) {
                            fechaClave = tarea.fechaVencimiento;
                            console.log(`- Usando fecha vencimiento: ${fechaClave}`);
                        }
                        break;
                    
                    case 'proximas':
                        // Para tareas próximas, usar la fecha más cercana entre vencimiento y scheduled
                        if (tarea.fechaVencimiento) {
                            fechaClave = tarea.fechaVencimiento;
                        } else if (tarea.fechaScheduled) {
                            fechaClave = tarea.fechaScheduled;
                        }
                        console.log(`- Usando fecha próxima: ${fechaClave}`);
                        break;
                    
                    case 'start':
                        // Para tareas por iniciar o con inicio vencido, usar la fecha de inicio
                        if (tarea.fechaStart) {
                            fechaClave = tarea.fechaStart;
                            console.log(`- Usando fecha inicio: ${fechaClave}`);
                        }
                        break;
                }
                
                if (!fechaClave) {
                    console.log("-> Ignorando tarea sin fecha clave");
                    return;
                }
    
                // Normalizar la fecha para asegurar formato YYYY-MM-DD
                const [año, mes, dia] = fechaClave.split('-').map(Number);
                const fechaNormalizada = `${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                console.log(`- Fecha normalizada: ${fechaNormalizada}`);
    
                if (!grupos[fechaNormalizada]) {
                    console.log(`-> Creando nuevo grupo para fecha ${fechaNormalizada}`);
                    grupos[fechaNormalizada] = [];
                }
                
                grupos[fechaNormalizada].push(tarea);
                console.log(`-> Tarea agregada al grupo ${fechaNormalizada}`);
                console.log(`-> Total tareas en este grupo: ${grupos[fechaNormalizada].length}`);
            });
    
            return grupos;
        } catch (error) {
            console.error('Error en agruparTareasPorFecha:', error);
            return {};
        }
    }
    
    private formatearFechaGrupo(fecha: string): string {
        try {
            console.log(`\n=== FORMATEANDO FECHA: ${fecha} ===`);
            
            // Separar la fecha en sus componentes
            const [año, mes, dia] = fecha.split('-').map(num => parseInt(num));
            console.log(`- Componentes de fecha: año=${año}, mes=${mes}, dia=${dia}`);
            
            // Crear fecha en zona horaria local
            const fechaObj = new Date(año, mes - 1, dia);
            console.log(`- Fecha objeto creada: ${fechaObj.toISOString()}`);
            
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const diaSemana = diasSemana[fechaObj.getDay()];
            console.log(`- Día de la semana: ${diaSemana}`);
            
            // Formatear manualmente para evitar problemas de zona horaria
            const diaStr = dia.toString().padStart(2, '0');
            const mesStr = (mes).toString().padStart(2, '0');
            const fechaFormateada = `${diaStr}/${mesStr}/${año}`;
            
            console.log(`- Fecha formateada final: ${fechaFormateada} ${diaSemana}`);
            return `${fechaFormateada} ${diaSemana}`;
            
        } catch (error) {
            console.error('Error formateando fecha de grupo:', error);
            console.log('Fecha original:', fecha);
            return fecha;
        }
    }
    
    // También necesitamos asegurar que la fecha se maneje correctamente en renderizarTareasAgrupadasPorInicio
    private renderizarTareasAgrupadasPorInicio(tareas: Task[]): string {
        console.log("\n=== INICIO RENDERIZADO DE TAREAS AGRUPADAS ===");
        console.log(`Total de tareas a renderizar: ${tareas.length}`);
        
        let contenido = '';
        const gruposPorFecha = this.agruparTareasPorFecha(tareas);
        
        // Ordenar las fechas
        const fechasOrdenadas = Object.keys(gruposPorFecha).sort((a, b) => {
            console.log(`Comparando fechas: ${a} vs ${b}`);
            // Comparar fechas como strings YYYY-MM-DD
            return a.localeCompare(b);
        });
    
        console.log("\nFechas ordenadas para renderizar:");
        fechasOrdenadas.forEach(fecha => console.log(`- ${fecha}`));
    
        for (const fecha of fechasOrdenadas) {
            console.log(`\nRenderizando grupo de fecha: ${fecha}`);
            const tareasDeFecha = gruposPorFecha[fecha];
            console.log(`- Tareas en este grupo: ${tareasDeFecha.length}`);
            
            const fechaFormateada = this.formatearFechaGrupo(fecha);
            console.log(`- Fecha formateada: ${fechaFormateada}`);
            
            contenido += `## ${fechaFormateada}\n\n`;
            contenido += this.renderizarGrupoTareas(tareasDeFecha);
        }
    
        return contenido;
    }

    private renderizarTareasAgrupadas(tareas: Task[], tipoVista: 'vencidas' | 'proximas' | 'start' = 'vencidas'): string {
        console.log("\n=== INICIO RENDERIZADO DE TAREAS AGRUPADAS ===");
        console.log(`Total de tareas a renderizar: ${tareas.length}`);
        console.log(`Tipo de vista: ${tipoVista}`);
        
        if (tareas.length === 0) {
            console.log("No hay tareas para renderizar");
            return "";
        }
    
        let contenido = '';
        const gruposPorFecha = this.agruparTareasPorFecha(tareas, tipoVista);
        
        console.log("Grupos por fecha creados:", Object.keys(gruposPorFecha));
    
        // Ordenar las fechas
        const fechasOrdenadas = Object.keys(gruposPorFecha).sort((a, b) => {
            console.log(`Comparando fechas para ordenar: ${a} vs ${b}`);
            const [yearA, monthA, dayA] = a.split('-').map(Number);
            const [yearB, monthB, dayB] = b.split('-').map(Number);
            
            const fechaA = new Date(yearA, monthA - 1, dayA);
            const fechaB = new Date(yearB, monthB - 1, dayB);
            
            return fechaA.getTime() - fechaB.getTime();
        });
    
        for (const fecha of fechasOrdenadas) {
            console.log(`\nProcesando fecha: ${fecha}`);
            const tareasDeFecha = gruposPorFecha[fecha];
            
            if (!tareasDeFecha || tareasDeFecha.length === 0) {
                console.log(`No hay tareas para la fecha ${fecha}`);
                continue;
            }
    
            console.log(`Encontradas ${tareasDeFecha.length} tareas para la fecha ${fecha}`);
            const fechaFormateada = this.formatearFechaGrupo(fecha);
            console.log(`Fecha formateada: ${fechaFormateada}`);
            
            // Ordenar tareas según el tipo de vista
            const tareasOrdenadas = this.ordenarTareasPorHoraYPeso(tareasDeFecha);
            
            contenido += `## ${fechaFormateada}\n\n`;
            contenido += this.renderizarGrupoTareas(tareasOrdenadas);
        }
    
        return contenido;
    }
    
    private ordenarTareasPorHoraYPeso(tareas: Task[]): Task[] {
        return tareas.sort((a, b) => {
            // Primero ordenar por hora si existe
            if (a.horaInicio && b.horaInicio) {
                if (a.horaInicio !== b.horaInicio) {
                    return a.horaInicio.localeCompare(b.horaInicio);
                }
            } else if (a.horaInicio) {
                return -1;
            } else if (b.horaInicio) {
                return 1;
            }
    
            // Si no hay horas o son iguales, ordenar por peso
            const pesoA = a.weight?.totalWeight ?? 0;
            const pesoB = b.weight?.totalWeight ?? 0;
            return pesoB - pesoA; // Orden descendente por peso
        });
    }
    
    public async mostrarTareasVencidas(): Promise<void> {
        try {
            console.log("\n=== INICIO MOSTRAR TAREAS VENCIDAS ===");
            const tareas = await this.getTareasVencidasAbiertas();
            
            console.log(`Total de tareas vencidas encontradas: ${tareas.length}`);
            if (tareas.length > 0) {
                console.log("Primera tarea vencida:", {
                    texto: tareas[0].texto,
                    fechaVencimiento: tareas[0].fechaVencimiento,
                    horaInicio: tareas[0].horaInicio
                });
            }
    
            if (tareas.length === 0) {
                console.log("No se encontraron tareas vencidas");
                new Notice('No hay tareas vencidas abiertas.');
                return;
            }
    
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = "# Tareas Vencidas\n\n";
            
            contenido += this.generarBotonActualizacion("mostrarTareasVencidas");
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de tareas vencidas: ${tareas.length}\n\n`;
            
            contenido += this.renderizarTareasAgrupadas(tareas, 'vencidas');
    
            console.log("Guardando archivo de tareas vencidas...");
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Vencidas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas vencidas`);
        } catch (error) {
            console.error("Error en mostrarTareasVencidas:", error);
            await this.manejarError(error);
        }
    }
    
    public async mostrarTareasProximas(diasProximos: number = 7): Promise<void> {
        try {
            console.log("Iniciando búsqueda de tareas próximas...");
            const tareas = await this.getTareasProximas(diasProximos);
            
            if (tareas.length === 0) {
                console.log("No se encontraron tareas próximas");
                new Notice('No hay tareas próximas.');
                return;
            }
    
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = "# Tareas Próximas\n\n";
            
            // Asegurarse de que diasProximos tenga un valor válido
            const diasMostrar = typeof diasProximos === 'number' ? diasProximos : 7;
            
            contenido += this.generarBotonActualizacion("mostrarTareasProximas", diasMostrar);
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Mostrando tareas para los próximos ${diasMostrar} días\n`;
            contenido += `> Total de tareas encontradas: ${tareas.length}\n\n`;
            
            contenido += this.renderizarTareasAgrupadas(tareas, 'proximas');
    
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas Próximas.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas próximas`);
        } catch (error) {
            await this.manejarError(error);
        }
    }
    
    public async mostrarTareasStartVencidas(): Promise<void> {
        try {
            console.log("\n=== INICIO MOSTRAR TAREAS START VENCIDAS ===");
            const tareas = await this.getTareasStartVencidas();
            
            console.log(`Total de tareas recuperadas: ${tareas.length}`);
            if (tareas.length > 0) {
                console.log("\nPrimera tarea encontrada:");
                console.log(`- Texto: ${tareas[0].texto}`);
                console.log(`- Fecha Start: ${tareas[0].fechaStart}`);
                console.log(`- Fecha Vencimiento: ${tareas[0].fechaVencimiento}`);
            }
    
            if (tareas.length === 0) {
                console.log("No se encontraron tareas con inicio vencido");
                new Notice('No hay tareas con inicio vencido.');
                return;
            }
    
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = "# Tareas con Inicio Vencido\n\n";
            
            contenido += this.generarBotonActualizacion("mostrarTareasStartVencidas");
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Total de tareas con inicio vencido: ${tareas.length}\n\n`;
    
            // Agrupar por nivel de retraso
            const tareasAgrupadas = this.agruparTareasPorRetrasoInicio(tareas, hoy);
            
            if (tareasAgrupadas.criticas.length > 0) {
                contenido += `## 🔴 Retrasadas > 7 días (${tareasAgrupadas.criticas.length})\n\n`;
                contenido += this.renderizarTareasAgrupadas(tareasAgrupadas.criticas, 'start');
            }
    
            if (tareasAgrupadas.recientes.length > 0) {
                contenido += `## 🟠 Retrasadas ≤ 7 días (${tareasAgrupadas.recientes.length})\n\n`;
                contenido += this.renderizarTareasAgrupadas(tareasAgrupadas.recientes, 'start');
            }
    
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas con Inicio Vencido.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas con inicio vencido`);
        } catch (error) {
            console.error("Error completo en mostrarTareasStartVencidas:", error);
            await this.manejarError(error);
        }
    }
    
    public async mostrarTareasStartProximas(diasProximos: number = 7): Promise<void> {
        try {
            console.log("Iniciando búsqueda de tareas por iniciar...");
            const tareas = await this.getTareasStartProximas(diasProximos);
            
            if (tareas.length === 0) {
                console.log("No se encontraron tareas por iniciar");
                new Notice('No hay tareas por iniciar en el período especificado.');
                return;
            }
    
            const hoy = this.taskUtils.obtenerFechaLocal();
            let contenido = "# Tareas por Iniciar\n\n";
            
            // Asegurarse de que diasProximos tenga un valor
            const diasMostrar = typeof diasProximos === 'number' && !isNaN(diasProximos) ? diasProximos : 7;
            
            contenido += this.generarBotonActualizacion("mostrarTareasStartProximas", diasMostrar);
            contenido += `> [!info] Actualizado: ${hoy.toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
            contenido += `> Mostrando tareas que inician en los próximos ${diasMostrar} días\n`;
            contenido += `> Total de tareas encontradas: ${tareas.length}\n\n`;
            
            // Utilizar el nuevo formato de agrupación por fechas con tipo 'start'
            contenido += this.renderizarTareasAgrupadas(tareas, 'start');
    
            await this.guardarYAbrirArchivo(
                `${this.plugin.settings.folder_SistemaGTD}/Tareas por Iniciar.md`,
                contenido
            );
            new Notice(`Se encontraron ${tareas.length} tareas por iniciar`);
        } catch (error) {
            await this.manejarError(error);
        }
    }
    
}
