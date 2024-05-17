
```dataviewjs
// dataviewjs block for Obsidian
dv.paragraph("### Notas de Plantillas");

(async () => {
  // Obtenemos todas las notas dentro de la carpeta "Plantillas"
  const notes = dv.pages('"Plantillas"');

  // Preparamos un array para contener nuestras filas de tabla procesadas
  const tableRows = await Promise.all(
    notes
      .filter(note => note.file.name !== "Indice Plantillas") // Excluimos el archivo específico
      .map(async note => {
        // Cargamos el contenido de la nota de manera explícita
        const content = await dv.io.load(note.file.path);
        let idPlantilla = "No encontrado";
        let tipoPlantilla = "No encontrado";

        // Extraemos el ID de plantilla usando regex, buscando específicamente 'idq'
        const idRegex = /idq:\s*(\d+)/;
        const idMatch = content.match(idRegex);
        if (idMatch) idPlantilla = idMatch[1].trim();

        // Extraemos el tipo de plantilla usando regex
        const tipoRegex = /tipo:\s*(.+)/;
        const tipoMatch = content.match(tipoRegex);
        if (tipoMatch) tipoPlantilla = tipoMatch[1].trim();

        // Devolvemos la fila de la tabla para esta nota
        return [
          note.file.link,
          idPlantilla,
          note.file.path.split('/').slice(0, -1).join('/'),
          tipoPlantilla
        ];
      })
  );

  // Creamos la cabecera de nuestra tabla y mostramos los resultados
  dv.table(["Nombre Plantilla", "ID de Plantilla", "Folder", "Tipo de Plantilla"], tableRows);
})();

```