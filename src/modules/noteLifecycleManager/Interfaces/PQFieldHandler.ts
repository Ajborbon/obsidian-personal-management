import { NoteFieldHandler } from './NoteFieldHandler';

export interface PQFieldHandler extends NoteFieldHandler {
    getTrimestre(): Promise<string[]>;
}