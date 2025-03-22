import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface AnualFieldHandler extends NoteFieldHandlerBase {
    getAño(): Promise<string>;
    getNota(): Promise<any>;
}