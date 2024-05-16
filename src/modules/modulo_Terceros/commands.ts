import { google } from 'googleapis';
//import * as googleApi from 'googleapis';
//import * as googleAuth from 'googleapis/build/src/auth/apikeyclient';
import {GoogleCalendarPlugin} from "./utils/googleCalendarPlugin.ts"
import {TFile, TFolder} from "obsidian"


export function registerCommands(plugin: Plugin): void {


const comando1 = plugin.addCommand({
        id: 'fetch-and-write-google-calendar-events',
        name: 'Sincronizar Google Calendar',
        callback: async () => {
            
            // Asumimos que tienes una forma de manejar la clave API seguramente
            const apiKey = '426438366463-quhdiq1lm5bsd9tem7k6qenb770cab8m.apps.googleusercontent.com';  // Reemplaza con tu API key de Google
            debugger;
            // Crea una instancia de ApiKeyClient
            //const auth = new google.auth.ApiKeyClient({ key: apiKey });
            
            //const auth = new googleApi.auth.ApiKeyClient(apiKey);
            
            const googleCalendarPlugin = new GoogleCalendarPlugin(apiKey, app);
            debugger;
            await googleCalendarPlugin.fetchEvents();
            new Notice('Google Calendar events have been fetched and written successfully.');
        }
    });
    plugin.registeredCommandIds_Terceros.push(comando1.id);

}


export function deactivateCommands(plugin: Plugin): void {
    
    if (!plugin.registeredCommandIds_Terceros) return;
    // Ejemplo de cómo podrías manejar la "desactivación" de comandos.
    plugin.registeredCommandIds_Terceros.forEach((commandId: string | number) => {
        const command = plugin.app.commands.commands[commandId];
        
        if (command) {
            // Sobrescribir el callback del comando para que no haga nada.
            command.callback = () => new Notice("Este comando ha sido desactivado.");
            // O simplemente eliminar el callback si eso se ajusta a tu lógica de aplicación.
            // delete command.callback;
        }
    });
}