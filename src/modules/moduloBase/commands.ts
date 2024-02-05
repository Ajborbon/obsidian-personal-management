import { EditorCommand } from "obsidian";

export const ejemploCommand: EditorCommand = {
    id: "abrir-ejemplo-view",
    name: "Abrir Ejemplo View",
    editorCallback: (editor, view) => {
        // Lógica para abrir o interactuar con la vista
        console.log("Ejemplo Command ejecutado");
    },
};

