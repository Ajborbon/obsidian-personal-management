import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface NoteFieldHandler extends NoteFieldHandlerBase{
    getAsunto(): Promise<string[]>;
    getProyectoGTD(): Promise<string[]>;
    getProyectoQ(): Promise<string[]>;
    getAreaInteres(): Promise<string[]>;
    getAreaVida(): Promise<string[]>;
  }