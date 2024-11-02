// src/modules/taskManager/interfaces/taskInterfaces.ts

export interface Task {
    texto: string;
    rutaArchivo: string;
    nombreArchivo: string;
    titulo: string;
    estado: EstadoTarea;
    fechaCreacion?: string;
    fechaScheduled?: string;
    fechaStart?: string;
    fechaVencimiento?: string;
    horaInicio?: string;
    horaFin?: string;
    etiquetas: {
        todas: string[];       // Todas las etiquetas en su forma original
        todoist: string[];     // Etiquetas específicas de todoist
        contextos: string[];   // Etiquetas que comienzan con cx
        personas: string[];    // Etiquetas que comienzan con px
        otras: string[];       // Otras etiquetas no categorizadas
    };
    weight?: TaskWeight;
}

// src/modules/taskManager/interfaces/taskInterfaces.ts

export interface TaskWeight {
    baseWeight: number;
    timeWeight: number;
    priorityWeight: number;
    totalWeight: number;
}

export enum EstadoTarea {
    Abierta = 'abierta',
    Completada = 'completada',
    Vencida = 'vencida',
    Retrasada = 'retrasada',
    Programada = 'programada',
    Diferida = 'diferida'
}