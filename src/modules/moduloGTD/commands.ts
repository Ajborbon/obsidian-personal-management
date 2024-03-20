import { ingresarBandejaEntrada } from "./inbox";

// COMANDOS DEL MODULO GTD
export function registerCommands(plugin: Plugin): void {
    
    const id1 = plugin.addCommand({
        id: "ingresar-inbox",
        name: "Ingresar Bandeja de Entrada -> Inbox",
        callback: async () => {
            await ingresarBandejaEntrada(plugin);
        }
    });
    // Almacenar el ID del comando en registeredCommandIds.

    plugin.registeredCommandIdsGTD.push(id1.id);
}


export function deactivateCommands(plugin: Plugin): void {
    
    if (!plugin.registeredCommandIdsGTD) return;
    // Ejemplo de cómo podrías manejar la "desactivación" de comandos.
    plugin.registeredCommandIdsGTD.forEach(commandId => {
        const command = plugin.app.commands.commands[commandId];
        
        if (command) {
            // Sobrescribir el callback del comando para que no haga nada.
            command.callback = () => new Notice("Este comando ha sido desactivado.");
            // O simplemente eliminar el callback si eso se ajusta a tu lógica de aplicación.
            // delete command.callback;
        }
    });
}
