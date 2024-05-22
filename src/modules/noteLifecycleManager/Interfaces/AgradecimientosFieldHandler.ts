
import { NoteFieldHandlerBase } from './NoteFieldHandlerBase';

export interface AgradecimientosFieldHandler extends NoteFieldHandlerBase {
    getAgradecimientos(): Promise<string[]>;
}