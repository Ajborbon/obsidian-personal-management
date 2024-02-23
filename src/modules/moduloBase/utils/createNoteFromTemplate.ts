import {TFile, TFolder} from "obsidian"
/**
 * Crea una nueva nota a partir de una plantilla utilizando el plugin Templater.
 * @param templaterPlugin Referencia al plugin Templater.
 * @param template La plantilla a utilizar, puede ser un TFile o el path como string.
 * @param folder El folder donde se creará la nueva nota. Opcional.
 * @param filename El nombre del archivo de la nueva nota. Opcional.
 * @param openNewNote Si se debe abrir la nueva nota tras crearla. Por defecto es true.
 * @returns Promise que resuelve a TFile si la nota fue creada, undefined en caso contrario.
 */
export async function createNoteFromTemplate(
    plugin: Plugin, // Esta es una suposición, necesitarás ajustar según cómo accedas a Templater en tu plugin
    template: TFile | string,
    folder?: TFolder,
    filename?: string,
    openNewNote: boolean = true
): Promise<TFile | undefined> {
    // Asegurarse de que el plugin Templater está instalado y habilitado
    if (!plugin || !plugin.app.plugins.enabledPlugins.has('templater-obsidian')) {
        console.error('El plugin Templater no está habilitado.');
        return;
    }
    // Forma de acceder al objeto tp normal que he usado desde DVJS
    const templaterPlugin = plugin.app.plugins.plugins['templater-obsidian'];
    const tp = templaterPlugin.templater.current_functions_object;
    

    if (!tp) {
    console.error("No se pudo acceder al objeto de funciones actuales de Templater.");
    return;
}
    // templateFile puede ser un string o el tfile obtenido de esta manera o con app.vault.getAbstractFileByPath()
    debugger
    let templateFile = tp.file.find_tfile(template);
    
    try {
        const newNote = await tp.file.create_new(templateFile, filename, openNewNote, folder);
        return newNote;
    } catch (error) {
        console.error('Error al crear la nota desde la plantilla:', error);
        return;
    }
}