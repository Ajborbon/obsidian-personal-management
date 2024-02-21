import { Plugin, Notice, Modal, TFile, TFolder } from "obsidian";
import { buscarRegistrosActivos, crearObjetoRegistro, verificarTareasActivas, definirTipoRegistro, createNoteFromTemplate } from "./utils"
import {modal_Ahora} from "./modals/modal_Ahora"

export function registerCommands(plugin: Plugin): void {
    
    const id1 = plugin.addCommand({
        id: "registros-de-tiempo-del-dia",
        name: "Registros de tiempo del día",
        checkCallback: (checking: boolean) => {
            const activeLeaf = plugin.app.workspace.activeLeaf;
            if (activeLeaf) {
                const filePath = activeLeaf.view.file?.path || "";
                if (filePath.startsWith("Estructura/Periodos/Diario/")) {
                    if (!checking) {
                        // Aquí iría la lógica del comando
                        console.log("Registros de tiempo del día");
                    }
                    return true;
                }
            }
            return false;
        }
    });
    // Almacenar el ID del comando en registeredCommandIds.

    plugin.registeredCommandIdsRT.push(id1.id);

    const id2 = plugin.addCommand({
        id: "ahora-RegistroTiempo",
        name: "Tarea activa en registro de tiempo",
        callback: async () => {
            const activa = await buscarRegistrosActivos(plugin.app);
            
            if (!activa) {
                new Notice("No hay notas activas");
            } else {
                // Crea y muestra el modal personalizado con la nota activa
                let modal = new modal_Ahora(plugin.app, activa);
                modal.open();
            }
        },
    });
    // Almacenar el ID del comando en registeredCommandIds.
    plugin.registeredCommandIdsRT.push(id2.id);
    
    const id3 = plugin.addCommand({
        id: "crear-registro-tiempo",
        name: "Crear Registro de Tiempo",
        callback: async () => {
            const registro = await crearObjetoRegistro(plugin);
           
            if (!registro) {
                new Notice("No se pudo crear el objeto de registro.");
                return;
            }
            await verificarTareasActivas(registro, plugin.app)
            await definirTipoRegistro(registro,plugin.app)
            // Asumiendo que se tiene una función o método para procesar el objeto `registro`
            // Por ejemplo, podría ser crear una nueva nota con la información de `registro`
            
        },
    });
    // Almacenar el ID del comando en registeredCommandIds.
    plugin.registeredCommandIdsRT.push(id3.id);


    const id4 = plugin.addCommand({
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
    plugin.registeredCommandIdsRT.push(id4.id);
}


// Esta parte del código sería hipotética y depende de cómo gestionas el estado y el ciclo de vida de los comandos en tu plugin.
export function deactivateCommands(plugin: Plugin): void {
    
    if (!plugin.registeredCommandIdsRT) return;
    // Ejemplo de cómo podrías manejar la "desactivación" de comandos.
    plugin.registeredCommandIdsRT.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        
        if (command) {
            // Sobrescribir el callback del comando para que no haga nada.
            command.callback = () => new Notice("Este comando ha sido desactivado.");
            // O simplemente eliminar el callback si eso se ajusta a tu lógica de aplicación.
            // delete command.callback;
        }
    });
}

