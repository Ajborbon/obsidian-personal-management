import {plantilla} from '../../../plantillas/Anotaciones/Plt - Anotaciones';
import { TFile } from 'obsidian';

export async function crearPlantilla(contenido: string): Promise<TFile> {
    // Define la ruta y el nombre del archivo temporal
    const folder = 'Plantillas';
    let filename = "Archivo De Plantilla"
    let pathTemporal = folder + "/" + filename + ".md";

    // Crea el archivo en la bóveda y guarda el archivo creado en una variable
    const archivoCreado: TFile = await app.vault.create(pathTemporal, contenido);

    // Aquí necesitarías procesar el archivo con Templater si es necesario
    // Esto depende de cómo Templater exponga su funcionalidad a otros plugins
    // Por ejemplo, si Templater tiene un método para procesar archivos, lo usarías aquí

    // (Opcional) Elimina el archivo después de procesarlo si no deseas conservarlo
    // await app.vault.delete(archivoCreado);

    // Retorna el archivo creado
    return archivoCreado;
}
