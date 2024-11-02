// src/modules/dataviewQueries/QueryRenderer.ts
export class QueryRenderer {
    async renderTaskButtons(container: HTMLElement, options: any = {}) {
        const buttonContainer = container.createEl('div', {
            cls: 'task-buttons-container',
            attr: { style: 'display: grid; grid-gap: 8px; padding: 16px; background: var(--background-secondary); border-radius: 8px;' }
        });

        if (options.showTitle !== false) {
            buttonContainer.createEl('h4', {
                text: '📋 Gestión de Tareas',
                attr: { style: 'margin: 0 0 12px 0;' }
            });
        }

        const buttons = [
            { 
                id: 'today', 
                text: 'Tareas de Hoy', 
                icon: '📅', 
                color: '#4CAF50',
                action: () => app.plugins.plugins['obsidian-personal-management'].tareasAPI.mostrarTareasHoy()
            },
            { 
                id: 'overdue', 
                text: 'Tareas Vencidas', 
                icon: '⚠️', 
                color: '#f44336',
                action: () => app.plugins.plugins['obsidian-personal-management'].tareasAPI.mostrarTareasVencidas()
            },
            { 
                id: 'upcoming', 
                text: 'Tareas Próximas', 
                icon: '🎯', 
                color: '#2196F3',
                action: () => app.plugins.plugins['obsidian-personal-management'].tareasAPI.mostrarTareasProximas()
            },
            { 
                id: 'start', 
                text: 'Todas las Vencidas', 
                icon: '🌓', 
                color: '#FF9800',
                action: () => app.plugins.plugins['obsidian-personal-management'].tareasAPI.mostrarTodasTareasVencidas()
            }
        ];

        const buttonGrid = buttonContainer.createEl('div', {
            attr: { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;' }
        });

        buttons.forEach(btn => {
            const button = buttonGrid.createEl('button', {
                attr: {
                    style: `
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        padding: 8px 16px;
                        background-color: ${btn.color};
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    `
                }
            });

            button.createEl('span', { text: btn.icon });
            button.createEl('span', { text: btn.text });
            
            // Eventos de hover
            button.addEventListener('mouseenter', () => {
                button.style.filter = 'brightness(1.1)';
                button.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.filter = 'brightness(1)';
                button.style.transform = 'translateY(0)';
            });

            // Evento de click con feedback visual
            button.addEventListener('click', async () => {
                try {
                    button.style.opacity = '0.7';
                    new Notice('Actualizando vista...');
                    await btn.action();
                } catch (error) {
                    console.error(`Error en acción ${btn.id}:`, error);
                    new Notice(`Error: ${error.message}`);
                } finally {
                    button.style.opacity = '1';
                }
            });
        });

        // Agregar timestamp si está habilitado
        if (options.showTimestamp) {
            buttonContainer.createEl('div', {
                text: `Última actualización: ${new Date().toLocaleTimeString()}`,
                attr: { 
                    style: 'margin-top: 8px; text-align: right; font-size: 0.8em; color: var(--text-muted);'
                }
            });
        }
    }

    async renderProjectHierarchy(container: HTMLElement, options: any = {}) {
        // Implementar cuando sea necesario
    }
}