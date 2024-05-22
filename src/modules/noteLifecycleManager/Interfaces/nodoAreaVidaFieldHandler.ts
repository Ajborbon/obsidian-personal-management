import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface nodoAreaVidaFieldHandler extends NoteFieldHandlerBase {
    getNota(): Promise<any>;
}