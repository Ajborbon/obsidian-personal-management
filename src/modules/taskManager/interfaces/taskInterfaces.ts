// src/modules/taskManager/interfaces/taskInterfaces.ts

export interface Task {
    texto: string;           // Texto limpio de la tarea (sin metadatos)
    textoOriginal: string;   // Texto completo original de la tarea incluyendo checkbox y metadatos
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
    tipoVencimiento?: string[];  // Nueva propiedad para indicar el tipo de vencimiento
    dependencyId?: string;    // ID de la tarea de la que depende (⛔)
    taskId?: string;         // ID propio de la tarea (🆔)
    isBlocked?: boolean;     // Estado de bloqueo calculado
    dependencyLocation?: string;  // Ruta del archivo donde está la tarea dependiente
    dependencyTitle?: string;     // Título de la nota donde está la tarea dependiente
    dependencyTexto?: string;  // Texto de la tarea de la que se depende.
    //Utilizado para tareas x personas
    peso?: number;
    prioridad?: string;
    ubicacion?: {
        archivo: string;
        titulo: string;
    };
    lineInfo?: LineInfo;    // Opcional para mantener compatibilidad
}


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
    Diferida = 'diferida',
    EnEjecucion = 'en_ejecucion'  // Nuevo estado
}

export interface LineInfo {
    numero: number;
    texto: string;
}

// En src/modules/taskManager/interfaces/taskInterfaces.ts
// Asegúrate de que esté definido el tipo LineInfo si no existe ya:

export interface LineInfo {
    numero: number;
    texto: string;
}