# Lista de Contactos

Aplicacion de lista de contactos con dos versiones: una original con localStorage y una nueva con API local usando Express + SQLite.

## Descripcion
Este proyecto implementa un CRUD completo para contactos con validaciones, edicion, eliminacion individual o total, indicador visual por genero, spinner de carga, mensajes tipo toast y una interfaz responsive pensada para presentacion academica.

## Versiones
- Original: usa `app.js` con `localStorage` en el navegador.
- API: usa `main-api.js` con un backend Express y almacenamiento persistente en SQLite.

## Requisitos cumplidos
- Crear contactos desde formulario.
- Leer contactos renderizados en pantalla.
- Actualizar contactos existentes.
- Eliminar contactos individuales o todos.
- Validar campos vacios antes de guardar.
- Identificar genero con icono claro.
- Mostrar spinner y mensajes de estado.
- Guardar y recuperar datos con `localStorage`.
- Guardar y recuperar datos desde una API local con SQLite.
- Cargar datos de ejemplo automaticamente al iniciar si la base esta vacia.

## Tecnologias
- HTML
- CSS
- JavaScript Vanilla
- localStorage
- Express
- SQLite

## Estructura
- `index.html`: estructura principal de la aplicacion.
- `styles.css`: estilos visuales y responsive.
- `app.js`: logica de CRUD, eventos y persistencia con localStorage.
- `main-api.js`: logica de CRUD consumiendo la API.
- `server.js`: API local con Express y SQLite.
- `contacts.db`: base de datos SQLite generada automaticamente.
- `package.json`: configuracion de Node.js.

## API
Base URL: `http://localhost:3000`

Endpoints disponibles:
- `GET /api/contacts`: lista todos los contactos.
- `POST /api/contacts`: crea un contacto.
- `PUT /api/contacts/:id`: actualiza un contacto.
- `DELETE /api/contacts/:id`: elimina un contacto.
- `DELETE /api/contacts`: elimina todos los contactos.

Ejemplo de payload:

```json
{
	"firstName": "Juan",
	"lastName": "Perez",
	"phone": "3001234567",
	"city": "Bogota",
	"address": "Calle 10 # 20-30",
	"gender": "masculino"
}
```

## Instalacion

```bash
npm install
```

## Uso de la version API
1. Ejecuta `node server.js` o `npm start`.
2. Abre `http://localhost:3000` en el navegador.
3. La primera vez, SQLite se crea automaticamente y se cargan datos de prueba si la tabla esta vacia.
4. Completa el formulario con los datos del contacto.
5. Usa los botones de editar o eliminar en cada tarjeta.
6. Los datos permanecen guardados en `contacts.db` aunque reinicies la aplicacion.

## Version localStorage
Si quieres usar la version original del ejercicio, abre `index.html` junto con `app.js` sin arrancar el servidor API.

## Datos de prueba
Al iniciar por primera vez, el backend inserta contactos de ejemplo para que puedas mostrar la lista sin cargar datos manualmente. Si la base ya tiene registros, no los sobreescribe.

## Solucion de problemas
- Si aparece `EADDRINUSE`, otro proceso esta usando el puerto 3000.
- Si no se ven contactos, revisa que el servidor este corriendo.
- Si quieres reiniciar los datos, elimina `contacts.db` y vuelve a ejecutar `node server.js`.

## Demo en GitHub Pages
https://victorzapata0612.github.io/Taller-DOM/

## Autor
- VictorZapata0612
- GitHub: https://github.com/Victorzapata0612/Taller-DOM.git
