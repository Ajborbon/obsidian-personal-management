import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface AreaVidaFieldHandler extends NoteFieldHandlerBase {
    getTrimestre(): Promise<string>;
    getFilename(): Promise<string>;
    getArea(): Promise<string>;
    getDescription(): Promise<string>;
    getNota(): Promise<any>;
}