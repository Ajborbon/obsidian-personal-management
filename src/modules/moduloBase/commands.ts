import {crearCarpeta} from "./utils/crearCarpeta"
import {crearPlantilla} from "./utils/crearPlantilla"
import {plantilla} from "../../plantillas/Anotaciones/Plt - Anotaciones"
import {TFile, TFolder} from "obsidian"
import {createNoteFromTemplate} from "./utils/createNoteFromTemplate"

export function registerCommands(plugin: Plugin): void {


    const comando1 = plugin.addCommand({
        id: "Creacion-Carpeta",
        name: "Creación de Carpeta",
        callback: async () => {
            debugger
            await crearCarpeta('Mi Carpeta de plugin');
        }
    });
    plugin.registeredCommandIdsMB.push(comando1.id);

    const comando2 = plugin.addCommand({
        id: "crear-template",
        name: "Crear un archivo template",
        callback: async () => {
             
            const archivo = await crearPlantilla(plantilla);
            if (!archivo) {
                new Notice("No se pudo crear el archivo.");
                return;
            }
         
        },
    });
    // Almacenar el ID del comando en registeredCommandIds.
    plugin.registeredCommandIdsMB.push(comando2.id);


    const comando3 = plugin.addCommand({
        id: "crear-archivo-template",
        name: "Crear archivo desde template",
        callback: async () => {
            
            const pluginId = 'templater-obsidian';
            const isPluginInstalled = plugin.app.plugins.enabledPlugins.has(pluginId);
            //const templaterPlugin = plugin.app.plugins.plugins[pluginId];
            // Intenta obtener la plantilla como TFile
            let template = "Plantillas/Anotaciones/Plt - Anotaciones.md";
            
            // Intenta obtener la carpeta como TFolder
            let folderObj = plugin.app.vault.getAbstractFileByPath("Inbox");
            if (!(folderObj instanceof TFolder)) {
                new Notice("La carpeta especificada no existe o no es una carpeta.");
                return; // Salir si no se encuentra la carpeta o no es una carpeta
            }

            let fileName = "toDefine"
            let openNote = true
            
            debugger
            const archivo = await createNoteFromTemplate(plugin, template, folderObj, fileName, openNote);

            if (!archivo) {
                new Notice("No se pudo crear el archivo.");
                return;
            }
         
        },
    });
    // Almacenar el ID del comando en registeredCommandIds.
    plugin.registeredCommandIdsMB.push(comando3.id);

}


export function deactivateCommands(plugin: Plugin): void {
    
    if (!plugin.registeredCommandIdsMB) return;
    // Ejemplo de cómo podrías manejar la "desactivación" de comandos.
    plugin.registeredCommandIdsMB.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        
        if (command) {
            // Sobrescribir el callback del comando para que no haga nada.
            command.callback = () => new Notice("Este comando ha sido desactivado.");
            // O simplemente eliminar el callback si eso se ajusta a tu lógica de aplicación.
            // delete command.callback;
        }
    });
}
