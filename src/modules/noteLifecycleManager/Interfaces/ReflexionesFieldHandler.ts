
import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface ReflexionesFieldHandler extends NoteFieldHandlerBase {
    getReflexiones(): Promise<string[]>;
}