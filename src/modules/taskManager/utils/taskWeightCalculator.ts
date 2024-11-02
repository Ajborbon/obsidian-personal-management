// src/modules/taskManager/utils/taskWeightCalculator.ts

import { Task, EstadoTarea } from '../interfaces/taskInterfaces';
import { TaskUtils } from './taskUtils';

export class TaskWeightCalculator {
    private static taskUtils: TaskUtils;
    
    private static readonly WEIGHTS = {
        HORA_FIN: 5,
        HORA_INICIO: 5,
        DUE_DATE: 5,
        SCHEDULED: 4,
        START: 3,
        PRIORITY: {
            HIGHEST: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: -1,
            LOWEST: -2
        }
    };

    public static setTaskUtils(utils: TaskUtils) {
        TaskWeightCalculator.taskUtils = utils;
    }

    public static getFechaPrioritaria(task: Task, tipoFecha: 'start' | 'due' | 'scheduled' | 'any' = 'any'): string | null {
        if (!task) return null;

        switch (tipoFecha) {
            case 'start':
                return task.fechaStart || null;
            case 'due':
                return task.fechaVencimiento || null;
            case 'scheduled':
                return task.fechaScheduled || null;
            case 'any':
                return task.fechaVencimiento || task.fechaScheduled || task.fechaStart || null;
            default:
                return null;
        }
    }

    public static shouldIncludeTask(task: Task, searchType: string, currentDate: Date): boolean {
        if (!TaskWeightCalculator.taskUtils) {
            console.error('TaskUtils no inicializado en TaskWeightCalculator');
            return false;
        }

        try {
            switch (searchType) {
                case 'start_vencidas': {
                    const fechaStart = task.fechaStart;
                    if (!fechaStart) return false;
                    
                    const fechaStartObj = TaskWeightCalculator.taskUtils.parsearFechaVencimiento(fechaStart);
                    return fechaStartObj !== null && fechaStartObj < currentDate;
                }

                case 'vencidas': {
                    const fechaVencimiento = task.fechaVencimiento;
                    if (!fechaVencimiento) return false;

                    const fechaVencObj = TaskWeightCalculator.taskUtils.parsearFechaVencimiento(fechaVencimiento);
                    return fechaVencObj !== null && fechaVencObj < currentDate;
                }

                case 'hoy': {
                    const fechas = [task.fechaVencimiento, task.fechaScheduled, task.fechaStart].filter(f => f);
                    return fechas.some(fecha => {
                        const fechaObj = TaskWeightCalculator.taskUtils.parsearFechaVencimiento(fecha!);
                        return fechaObj?.toDateString() === currentDate.toDateString();
                    });
                }

                case 'proximas': {
                    const fechaVencimiento = task.fechaVencimiento;
                    if (!fechaVencimiento) return false;

                    const fechaVencObj = TaskWeightCalculator.taskUtils.parsearFechaVencimiento(fechaVencimiento);
                    if (!fechaVencObj) return false;

                    const diasDiferencia = Math.ceil(
                        (fechaVencObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return diasDiferencia >= 0 && diasDiferencia <= 7;
                }

                default:
                    return false;
            }
        } catch (error) {
            console.error('Error en shouldIncludeTask:', error);
            return false;
        }
    }

    public static calculateWeight(task: Task): { baseWeight: number; timeWeight: number; priorityWeight: number; totalWeight: number } {
        let baseWeight = 0;
        let timeWeight = 0;
        let priorityWeight = 0;

        // Pesos por fechas
        if (task.fechaVencimiento) baseWeight += this.WEIGHTS.DUE_DATE;
        if (task.fechaScheduled) baseWeight += this.WEIGHTS.SCHEDULED;
        if (task.fechaStart) baseWeight += this.WEIGHTS.START;

        // Pesos por horas
        if (task.horaFin) timeWeight += this.WEIGHTS.HORA_FIN;
        if (task.horaInicio) timeWeight += this.WEIGHTS.HORA_INICIO;

        // Peso por prioridad
        const texto = task.texto.toLowerCase();
        if (texto.includes('🔺')) priorityWeight += this.WEIGHTS.PRIORITY.HIGHEST;
        if (texto.includes('⏫')) priorityWeight += this.WEIGHTS.PRIORITY.HIGH;
        if (texto.includes('🔼')) priorityWeight += this.WEIGHTS.PRIORITY.MEDIUM;
        if (texto.includes('🔽')) priorityWeight += this.WEIGHTS.PRIORITY.LOW;
        if (texto.includes('⏬')) priorityWeight += this.WEIGHTS.PRIORITY.LOWEST;

        return {
            baseWeight,
            timeWeight,
            priorityWeight,
            totalWeight: baseWeight + timeWeight + priorityWeight
        };
    }

    public static sortTasks(tasks: Task[]): Task[] {
        if (!TaskWeightCalculator.taskUtils) {
            console.error('TaskUtils no inicializado en TaskWeightCalculator');
            return tasks;
        }

        return tasks.sort((a, b) => {
            try {
                // Primero ordenar por fecha
                const fechaA = this.getFechaPrioritaria(a, 'any');
                const fechaB = this.getFechaPrioritaria(b, 'any');

                if (fechaA !== fechaB) {
                    const dateA = fechaA ? TaskWeightCalculator.taskUtils.parsearFechaVencimiento(fechaA) : null;
                    const dateB = fechaB ? TaskWeightCalculator.taskUtils.parsearFechaVencimiento(fechaB) : null;
                    
                    if (dateA && dateB) {
                        return dateA.getTime() - dateB.getTime();
                    }
                    return 0;
                }

                // Si las fechas son iguales, ordenar por hora
                if (a.horaInicio && b.horaInicio) {
                    if (a.horaInicio !== b.horaInicio) {
                        return a.horaInicio.localeCompare(b.horaInicio);
                    }
                } else if (a.horaInicio) {
                    return -1;
                } else if (b.horaInicio) {
                    return 1;
                }

                // Si las horas son iguales o no existen, ordenar por peso
                const weightA = a.weight?.totalWeight ?? 0;
                const weightB = b.weight?.totalWeight ?? 0;
                return weightB - weightA;

            } catch (error) {
                console.error('Error ordenando tareas:', error);
                return 0;
            }
        });
    }

    private static calculateBaseWeight(task: Task): number {
        let weight = 0;

        // Pesos por fechas
        if (task.fechaVencimiento) weight += this.WEIGHTS.DUE_DATE;
        if (task.fechaScheduled) weight += this.WEIGHTS.SCHEDULED;
        if (task.fechaStart) weight += this.WEIGHTS.START;

        return weight;
    }

    private static calculateTimeWeight(task: Task): number {
        let weight = 0;

        if (task.horaFin) weight += this.WEIGHTS.HORA_FIN;
        if (task.horaInicio) weight += this.WEIGHTS.HORA_INICIO;

        return weight;
    }

    private static calculatePriorityWeight(task: Task): number {
        const texto = task.texto.toLowerCase();

        if (texto.includes('🔺')) return this.WEIGHTS.PRIORITY.HIGHEST;
        if (texto.includes('⏫')) return this.WEIGHTS.PRIORITY.HIGH;
        if (texto.includes('🔼')) return this.WEIGHTS.PRIORITY.MEDIUM;
        if (texto.includes('🔽')) return this.WEIGHTS.PRIORITY.LOW;
        if (texto.includes('⏬')) return this.WEIGHTS.PRIORITY.LOWEST;

        return 0;
    }


    private static esFechaValida(fecha: string): boolean {
        try {
            const fechaObj = new Date(fecha);
            return fechaObj.toString() !== 'Invalid Date';
        } catch {
            return false;
        }
    }


}