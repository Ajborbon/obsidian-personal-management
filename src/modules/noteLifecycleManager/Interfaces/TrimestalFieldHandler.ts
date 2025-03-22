import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface TrimestralFieldHandler extends NoteFieldHandlerBase {
    getTrimestre(): Promise<string>;
    getNota(): Promise<any>;
}