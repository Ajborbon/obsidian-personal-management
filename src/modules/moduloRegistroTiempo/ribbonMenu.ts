/*
 * Filename: /src/modules/moduloRegistroTiempo/ribbonMenu.ts
 * Path: /src/modules/moduloRegistroTiempo
 * Created Date: 2024-03-04 17:58:30
 * Author: Andrés Julián Borbón
 * -----
 * Last Modified: 2025-02-23 17:47:17
 * Modified By: Andrés Julián Borbón
 * -----
 * Copyright (c) 2025 - Andrés Julián Borbón
 */


import { App, Menu, Plugin, TFile } from "obsidian";
import { cumpleCondicion } from "./utils";

export function registerRibbonMenu(plugin: Plugin): void {
    // Este es el ícono del menú en el ribbon, cambia "dice" por el ícono que prefieras
    
    plugin.ribbonButtonRT = plugin.addRibbonIcon("clock", "Registro de Tiempo", async (event) => {
        
        // Crear el menú al hacer clic en el ícono
        const menu = new Menu(plugin.app);

        // Agregar opciones al menú
        // La opción ahora, solo se activa si hay algún registro de tiempo en ejecución.
        if (await cumpleCondicion(plugin.app)) {
            menu.addItem((item) =>
                item.setTitle("Ahora")
                    .onClick(() => {
                        console.log("Ahora");
                    }));
        }


        menu.addItem((item) =>
            item.setTitle("Registrar Tiempo")
                .onClick(() => {
                    // Aquí la lógica para "Registrar Tiempo"
                    console.log("Registrar Tiempo");
                }));


        // La opción Detener Registro, solo se activa si hay algún registro de tiempo en ejecución.
        if (await cumpleCondicion(plugin.app)) {
            menu.addItem((item) =>
                item.setTitle("Detener Registro")
                    .onClick(() => {
                        // Aquí la lógica para "Detener Registro"
                        console.log("Detener Registro");
                    }));
        }

        menu.addItem((item) =>
            item.setTitle("Tareas en progreso")
                .onClick(() => {
                    // Aquí la lógica para "Tareas en progreso"
                    console.log("Tareas en progreso");
                }));

        menu.addItem((item) =>
            item.setTitle("Registros de hoy")
                .onClick(() => {
                    // Aquí la lógica para "Registros de hoy"
                    console.log("Registros de hoy");
                }));

        // Mostrar el menú en la posición del cursor
        menu.showAtPosition({ x: event.pageX, y: event.pageY });
    });
}

export function deactivateRibbonMenu(plugin: Plugin): void {
    if (plugin.ribbonButtonRT) {
        plugin.ribbonButtonRT.remove();
        plugin.ribbonButtonRT = null;
    }
}
