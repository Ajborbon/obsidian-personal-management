// src/modules/moduloGTD/tasks/interfaces/Task.ts
export interface Task {
    texto: string;
    archivo: string;
    titulo: string;
    fechaVencimiento?: string;
    fechaProgramada?: string;
    etiquetas?: string[];
    // ... otros campos comunes
}