import { NoteFieldHandler } from './NoteFieldHandler';

export interface ObjCompassAnualFieldHandler extends NoteFieldHandler {
    getTrimestre(): Promise<string[]>;
    getAño(): Promise<string>;
}