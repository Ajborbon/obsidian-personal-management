
# Guía para la Creación de Nuevos Subsistemas en el Plugin de Obsidian

## Introducción

Esta guía detalla los elementos y procesos necesarios para crear nuevos subsistemas en el plugin de Obsidian, integrando funcionalidades clave y utilizando las metodologías revisadas en esta sesión.

## Estructura de los Subsistemas

### Configuración de Rutas

Las rutas de almacenamiento de las notas para cada subsistema se especifican en el archivo `src/defaults/defaultSettings.ts`. Ejemplo:
```typescript
folder_RegistroTiempo: "Subsistemas/Registro Tiempo/Registros",
folder_Anotaciones: "Anotaciones/Notas",
folder_ABlog: "Subsistemas/Artículos Blog/Artículos",
folder_Desarrollos: "Subsistemas/Desarrollos/Códigos"
```
Las interfaces de estas rutas están definidas en el archivo `src/interfaces/pluginMainSettings.ts`. Ejemplo

```typescript
folder_RegistroTiempo: string,
folder_Anotaciones: string,
folder_ABlog: string,
folder_Desarrollos: string
```

### Plantillas

Las plantillas para cada subsistema se ubican en `src/Plantillas/${subsistema}` y siguen la estructura de nombres `Plt - ${nombreSubsistema}.md`. Ejemplo para Anotaciones:
```plaintext
src/Plantillas/Anotaciones/Plt - Anotaciones.md
```

## Funcionalidad del API del Plugin

### Método `fillNote`

El método `fillNote` en `starterAPI.ts` es clave para llenar los campos YAML de las plantillas. Los pasos incluyen:
1. **Inicialización**: Se inicializan `nota` e `infoSubsistema`.
2. **Asignación de Rutas**: Se asignan las carpetas e índices desde la configuración.
3. **Llenado de Campos**: Se llaman a funciones específicas para obtener valores (e.g., `getId`, `getFecha`).

Ejemplo:
```typescript
const infoSubsistema = { folder: 'Anotaciones', indice: 'indice_Anotaciones' };
const campos = ['id', 'fecha', 'titulo', 'descripcion'];
const notaCompleta = await this.fillNote(infoSubsistema, campos);
```

### Funciones Auxiliares

- **getId**: Genera un nuevo ID basado en los IDs existentes.
- **getFecha**: Obtiene la fecha actual formateada.
- **getTitulo**: Solicita el título del proyecto.
- **getAsunto**: Determina si hay un asunto relacionado.
- **getProyectoGTD**: Obtiene detalles del proyecto GTD.
- **getAreaInteres**: Obtiene áreas de interés.
- **getAreaVida**: Obtiene áreas de vida.
- **getDescripcion**: Solicita una descripción.
- **getEstado**: Solicita el estado del proyecto.
- **getAliases**: Genera aliases.
- **getRename**: Genera el nombre del archivo.

## Subsistema de Proyectos GTD

### Plantilla

La plantilla para Proyectos GTD se encuentra en `src/Plantillas/Estructura/GTD/Proyectos GTD/Proyectos/Plt - ProyectosGTD.md`.

### Proceso de Creación y Llenado

1. **Crear la Nota**:
   ```typescript
   await this.createNote('ProyectosGTD');
   ```
2. **Llenar la Nota**:
   ```typescript
   const infoSubsistema = { folder: 'ProyectosGTD', indice: 'indice_ProyectosGTD' };
   const campos = ['id', 'fecha', 'titulo', 'asunto', 'proyectoGTD', 'ProyectoQ', 'areaInteres', 'areaVida', 'descripcion', 'estado', 'aliases', 'rename'];
   const notaCompleta = await this.fillNote(infoSubsistema, campos);
   ```

## Uso de Botones en Notas

### Ejemplo de Bloque `dataviewjs`

Los botones permiten llamar métodos del API del plugin:
```dataviewjs
if (!app.plugins.enabledPlugins.has('obsidian-personal-management')) {
    console.error('El plugin TPM no está habilitado.');
}
const gp = app.plugins.plugins['obsidian-personal-management'];
await gp.menuHoyAPI.mostrarMenu(dv);
```

### API de Menú Hoy

El archivo `menuDiarioAPI.ts` define el API para el menú de hoy, incluyendo:
- **mostrarMenu**: Crea un contenedor de botones.
- **mostrarSubMenu**: Crea un submenú.
- **mostrarRegistrosHoy**: Muestra la vista de registros de hoy.

Ejemplo de `mostrarRegistrosHoy`:
```typescript
async mostrarRegistrosHoy(dv: any) {
    const view = dv.app.workspace.getActiveViewOfType('vista-registro-diario');
    if (view) {
        // Lógica para mostrar la vista de registros de hoy
    } else {
        console.error('La vista "vista-registro-diario" no está disponible.');
    }
}
```

## Conclusión

Esta guía proporciona una visión detallada sobre la creación y gestión de subsistemas en el plugin de Obsidian. Siguiendo estos pasos y utilizando las funciones del API, se puede extender la funcionalidad del plugin de manera eficiente y organizada.
