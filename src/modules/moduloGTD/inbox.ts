import { Notice, Plugin, TFile, MarkdownView, Alert } from 'obsidian';
import { DateTime } from 'luxon';
import { BandejaDeEntradaModal} from '../modales/inboxModal'

export async function ingresarBandejaEntrada(plugin: Plugin): void {
    let inboxPath = `${plugin.settings.file_Inbox}.md`;
    let inboxFile = app.vault.getAbstractFileByPath(inboxPath);
    const activeFile = app.workspace.getActiveFile();

    if (!activeFile) {
        new Notice("No hay archivo activo");
        return; // Asegura que hay un archivo activo antes de continuar
    }
    let inbox;


    // Uso del Modal
    const modal = new BandejaDeEntradaModal(plugin.app);
    modal.open();

    const { text, saveInCurrent } = await modal.waitForInput();
    
    if (text.length < 3) {
        new Notice("Inbox cancelada");
        return; // Termina la ejecución de la función aquí.
    }
    let destino = saveInCurrent ? activeFile : inboxFile;
    let hoy = DateTime.now().toFormat('yyyy-MM-dd');
    let hora = DateTime.now().toFormat('HH:mm');
    inbox = `- [ ] 🧠 ${text} #inbox [created:: ${hoy}] a las ${hora}\n`;

    
    // Lógica para escribir en el archivo
    if (destino instanceof TFile) {
        if (destino === inboxFile) {
            // Manejamos la promesa con .then() y .catch() para el manejo de errores
            insertAtStartUsingProcess(inbox, destino)
                .then(() => {
                    // Si la promesa se resuelve sin errores, muestra un Notice
                    new Notice("Bandeja de entrada actualizada con éxito.");
                })
                .catch((error) => {
                    debugger;
                    console.error(error);
                    // Si ocurre un error, muestra un Alert
                    new Notice("Error al agregar contenido al inicio del archivo: " + error.message);

                });
        } else {
            await insertInboxAtCursor(inbox);
        }
    }
}

async function insertInboxAtCursor(inbox) {
    debugger
    const activeLeaf = app.workspace.activeLeaf;
    if (activeLeaf) {
        const editor = activeLeaf.view.sourceMode.cmEditor;
        const cursor = editor.getCursor();
        editor.replaceRange(inbox, cursor);
    }
}

async function insertAtStartUsingProcess(inbox, file) {
    if (!(file instanceof TFile)) return;
    // Utiliza Vault.process para modificar el contenido del archivo
    await app.vault.process(file, (content) => {
        // Concatena el texto de entrada en la primera línea y el contenido original
        const newContent = inbox + content;
        return newContent; // Retorna el nuevo contenido para ser guardado
    });
}



