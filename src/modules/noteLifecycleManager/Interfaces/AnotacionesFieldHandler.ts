import { NoteFieldHandler } from './NoteFieldHandler';

export interface AnotacionesFieldHandler extends NoteFieldHandler {
    getClasificacion(): Promise<{ clase: string | null, tag: string | null } | undefined>;
}