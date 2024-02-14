import { App, Menu, Plugin, TFile } from "obsidian";
import { SearchAreasDeVidaModal } from "./modal"; // Asegúrate de tener el import correcto para tu modal

export function registerRibbonMenu(plugin: Plugin): void {
    // Este es el ícono del menú en el ribbon, cambia "dice" por el ícono que prefieras
    plugin.addRibbonIcon("folder-search-2", "Búsqueda Avanzada", async (event) => {
        // Crear el menú al hacer clic en el ícono
        const menu = new Menu(plugin.app);

        // Agregar opciones al menú

        // Áreas de Vida
        menu.addItem((item) =>
            item.setTitle("Áreas de Vida")
                .onClick(() => {
                    // Corrección: Asegúrate de abrir el modal correctamente
                    new SearchAreasDeVidaModal(plugin.app, (estadoSeleccionado) => {
                        console.log("Estado seleccionado:", estadoSeleccionado);
                        // Aquí puedes continuar con la lógica para manejar el estado seleccionado
                    }).open(); // Corregido: Añadido .open() para abrir el modal
                }));

        // Áreas de Interés
        menu.addItem((item) =>
            item.setTitle("Áreas de Interés")
                .onClick(() => {
                    // Aquí la lógica para la búsqueda de "Áreas de Interés"
                    console.log("Áreas de Interés");
                }));

        // Anotación
        menu.addItem((item) =>
            item.setTitle("Anotación")
                .onClick(() => {
                    // Aquí la lógica para la búsqueda de "Anotación"
                    console.log("Anotación");
                }));

        // Recurso Recurrente
        menu.addItem((item) =>
            item.setTitle("Recurso Recurrente")
                .onClick(() => {
                    // Aquí la lógica para la búsqueda de "Recurso Recurrente"
                    console.log("Recurso Recurrente");
                }));

        // Gestión Diaria
        menu.addItem((item) =>
            item.setTitle("Gestión Diaria")
                .onClick(() => {
                    // Aquí la lógica para la búsqueda de "Gestión Diaria"
                    console.log("Gestión Diaria");
                }));

        // Registro de Tiempo
        menu.addItem((item) =>
            item.setTitle("Registro de Tiempo")
                .onClick(() => {
                    // Aquí la lógica para la búsqueda de "Registro de Tiempo"
                    console.log("Registro de Tiempo");
                }));

        // Mostrar el menú en la posición del cursor
        menu.showAtPosition({ x: event.pageX, y: event.pageY });
    });
}
