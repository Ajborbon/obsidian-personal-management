import { calendar_v3 } from '@googleapis/calendar';
import { App, TFile } from 'obsidian';

export class GoogleCalendarPlugin {
    private calendarClient: Calendar;
    private obsidianApp: App;
    private calendarId: string = 'primary';  // Usamos el calendario principal

    constructor(apiKey: string, obsidianApp: App) {
        this.calendarClient = new calendar_v3.Calendar({apiKey: apiKey});
        this.obsidianApp = obsidianApp;
    }

    async fetchEvents() {
        try {
            const response = await this.calendarClient.events.list({
                calendarId: this.calendarId,
                timeMin: (new Date()).toISOString(),  // Eventos desde hoy
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime',
            });
            const events = response.data.items;
            if (events.length) {
                console.log('Próximos eventos:');
                this.writeEventsToObsidian(events);
            } else {
                console.log('No hay próximos eventos encontrados.');
            }
        } catch (error) {
            console.error('Error al obtener los eventos del calendario:', error);
        }
    }

    async writeEventsToObsidian(events: any[]) {
        const fileName = 'Inbox/calendarioGoogle.md';
        let fileContent = '# Eventos del Calendario Google\n\n';
        events.forEach(event => {
            const start = event.start.dateTime || event.start.date;  // Fecha de inicio
            fileContent += `## ${event.summary}\n- Fecha: ${start}\n\n`;
        });

        const file = this.obsidianApp.vault.getAbstractFileByPath(fileName) as TFile;
        if (file) {
            await this.obsidianApp.vault.modify(file, fileContent);
        } else {
            await this.obsidianApp.vault.create(fileName, fileContent);
        }
    }
}
