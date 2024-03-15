import {Modal} from 'obsidian';

class FileLinkModal extends Modal {
    constructor(app) {
        super(app);
    }

    onOpen() {
        let { contentEl } = this;
        
        // Aplicar estilos flexbox para centrar contenido
        contentEl.style.display = 'flex';
        contentEl.style.flexDirection = 'column';
        contentEl.style.justifyContent = 'center';
        contentEl.style.alignItems = 'center';
        contentEl.style.height = '50%';  // Asegúrate de que el modal ocupe todo el espacio disponible
        
        contentEl.createEl('h1', {
            text: 'Insertar el link de un archivo.',
            attr: { style: 'text-align: center;' }  // Asegura que el texto del título esté centrado si es más largo que una línea
        });
        
        // Contenedor para el input y el botón
        const inputContainer = contentEl.createDiv();
        inputContainer.style.margin = '10px';
        
        // Input de archivo oculto
        const fileInput = inputContainer.createEl('input', { type: 'file' });
        fileInput.style.display = 'none';
        
        // Botón para seleccionar archivo
        const fileButton = inputContainer.createEl('button', {
            text: 'Seleccione su archivo',
            cls: 'mod-cta'
        });
        fileButton.style.padding = '5px 10px';
        fileButton.style.fontSize = '16px';
        fileButton.style.marginTop = '5px';
        fileButton.style.cursor = 'pointer';
        fileButton.onclick = () => fileInput.click();
        
        // Evento para cuando se selecciona un archivo
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.insertLinkAtCursor(file.path, file.name);
            }
            this.close();
        };
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }

    async insertLinkAtCursor(filePath, fileName) {
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf) {
            const editor = activeLeaf.view.sourceMode.cmEditor;
            const cursor = editor.getCursor();
            const linkText = `[${fileName}](<file://${filePath}>)`;
            editor.replaceRange(linkText, cursor);
        }
    }
}



// Función para abrir el modal personalizado
export async function insertFileLink(app) {
    new FileLinkModal(app).open();
}
