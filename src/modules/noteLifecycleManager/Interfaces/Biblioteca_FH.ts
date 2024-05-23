import { NoteFieldHandler } from './NoteFieldHandler';

export interface Biblioteca_FH extends NoteFieldHandler {
    getParametrosLibro(): Promise<any>;
    getFormato(): Promise<string>;
    getPaginas(): Promise<string>;
}