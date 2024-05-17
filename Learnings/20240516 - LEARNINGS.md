
# Learnings and Best Practices for Obsidian Plugin Development

## 1. Estructura del Módulo

### GPThora.ts (Ejemplo de módulo)
- Un módulo no debe extender `Plugin` si ya está siendo inicializado por un archivo principal.
- El módulo debe ser una clase independiente que se instancia en el archivo principal.

#### Ejemplo:
```typescript
import { App, Modal } from 'obsidian';

export default class GPThora {
    app: App;

    constructor(app: App) {
        this.app = app;
    }

    onload() {
        this.app.commands.addCommand({
            id: 'show-local-time',
            name: 'Hora Local',
            callback: () => this.showLocalTimeModal()
        });
    }

    showLocalTimeModal() {
        const modal = new LocalTimeModal(this.app);
        modal.open();
    }
}

class LocalTimeModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        const timeString = `${hours}:${minutes} ${ampm}`;

        contentEl.createEl('h1', { text: 'Hora Local' });
        contentEl.createEl('p', { text: timeString });

        // Estilo del modal
        contentEl.style.backgroundColor = '#2E3440';
        contentEl.style.color = '#D8DEE9';
        contentEl.style.padding = '20px';
        contentEl.style.textAlign = 'center';
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
```

## 2. Integración en el Archivo Principal

### main.ts (Ejemplo de inicialización del módulo)
- El archivo principal debe encargarse de instanciar y registrar los módulos adicionales.

#### Ejemplo:
```typescript
import { Plugin } from 'obsidian';
import GPThora from './modules/GPThora/GPThora';

export default class ManagementPlugin extends Plugin {
    async onload() {
        // Inicializar otros módulos
        this.registerGPThora();
    }

    registerGPThora() {
        const gptHora = new GPThora(this.app);  // Crear una instancia de GPThora
        gptHora.onload();
    }
}
```

## 3. Uso Correcto de `App`

- Asegurarse de que `App` se pase correctamente al constructor del módulo.
- Utilizar `this.app` para acceder a los comandos y otras funcionalidades de Obsidian.

## 4. Codificación Base64 y SHA en GitHub API

- Al actualizar archivos en GitHub a través de la API, es crucial codificar el contenido en Base64.
- Incluir el `sha` del archivo existente para actualizar correctamente.

#### Ejemplo:
```typescript
import { api_github_com__jit_plugin } from "api_github_com__jit_plugin";

async function updateFile() {
    const owner = "Ajborbon";
    const repo = "obsidian-personal-management";
    const path = "ruta/al/archivo.ts";
    const sha = "sha_del_archivo_existente";
    const content = "contenido_actualizado";

    const encodedContent = Buffer.from(content).toString('base64');

    await api_github_com__jit_plugin.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: "Mensaje del commit",
        content: encodedContent,
        sha,
    });
}

updateFile().then(() => {
    console.log("Archivo actualizado y subido al repositorio.");
}).catch(console.error);
```

---
