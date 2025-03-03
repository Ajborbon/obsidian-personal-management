// src/modules/noteLifecycleManager/Interfaces/EntregableFieldHandler.ts
import { NoteFieldHandler } from './NoteFieldHandler';

export interface EntregableFieldHandler extends NoteFieldHandler {
    getTrimestre(): Promise<string>;
    getTipo(): Promise<string>;
    getCanales(): Promise<string[]>;
    getStatus(): Promise<string>;
    getPrioridad(): Promise<string>;
    getPublicacion(): Promise<string>;
    getPiezaNube(): Promise<string>;
    getUrlCanva(): Promise<string>;
    getHits(): Promise<number>;

    getFacturable(): Promise<boolean>;
    getPedidosAlCliente(): Promise<{ pedidos: string, pendientes: boolean }>;
}