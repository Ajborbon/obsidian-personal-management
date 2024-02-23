
export async function crearCarpeta(rutaCarpeta: string): Promise<void> {
        try {
            // Verifica si la carpeta ya existe
            debugger
            const carpetaExistente = app.vault.getAbstractFileByPath(rutaCarpeta);
            if (carpetaExistente) {
                console.log(`La carpeta '${rutaCarpeta}' ya existe.`);
                return;
            }
            debugger
            // Crea la carpeta
            await app.vault.createFolder(rutaCarpeta);
            console.log(`Carpeta '${rutaCarpeta}' creada exitosamente.`);
        } catch (error) {
            console.error(`Error al crear la carpeta '${rutaCarpeta}':`, error);
        }
    }

