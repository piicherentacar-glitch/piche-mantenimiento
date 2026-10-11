PICHE RENT A CAR — SISTEMA DE MANTENIMIENTO CON ALMACENAMIENTO CENTRALIZADO EN NETLIFY

IMPORTANTE
Esta versión ya no utiliza Supabase. Guarda el estado en Netlify Blobs mediante una Netlify Function. Para que funcione, Netlify debe ejecutar el build y desplegar la función; arrastrar solo los archivos a un deploy manual NO instala ni ejecuta funciones. Publica conectando un repositorio Git (recomendado) o usando Netlify CLI.

ARCHIVOS
- index.html, app.js, style.css: interfaz
- netlify/functions/api.mjs: API y almacenamiento persistente
- netlify.toml: rutas de API y directorio de funciones
- package.json: dependencia de Netlify Blobs

PUBLICAR CON GITHUB + NETLIFY
1. Extrae todo el ZIP.
2. Crea un repositorio privado en GitHub y sube el CONTENIDO de esta carpeta (index.html debe quedar en la raíz del repositorio, junto a netlify.toml, package.json y la carpeta netlify).
3. En Netlify: Add new site > Import an existing project > GitHub; selecciona el repositorio.
4. Configuración de build: Build command: npm install (o dejar que Netlify detecte package.json); Publish directory: . ; Functions directory: netlify/functions.
5. Antes de desplegar, en Site configuration > Environment variables, agrega: 
   PICHE_ADMIN_EMAIL = correo de acceso del administrador
   PICHE_ADMIN_PASSWORD = contraseña larga y única
   PICHE_TOKEN_SECRET = cadena aleatoria larga (mínimo 32 caracteres)
6. Despliega el sitio. Si agregas variables después de desplegar, inicia un nuevo deploy.
7. Abre la URL. Usa el correo y contraseña definidos en las variables anteriores.

ALMACENAMIENTO Y SEGURIDAD
Los datos se guardan en Netlify Blobs y se comparten entre navegadores del mismo sitio. El token de sesión dura 12 horas. Cambia las variables desde Netlify, nunca las pongas en app.js. El acceso de administrador es una sola cuenta compartida. Para varios usuarios/roles se requiere ampliar la autenticación.

DATOS EXISTENTES
Los datos locales de la versión anterior no se migran automáticamente. Antes de cambiar, abre la versión antigua y exporta su copia JSON desde Informes/Copia de seguridad (si esa opción está disponible). La importación de datos debe verificarse después de iniciar sesión. Si necesitas conservar datos, guarda el archivo JSON y no borres el navegador anterior.

PRUEBA
1. Inicia sesión.
2. Registra un mantenimiento de prueba.
3. Espera el mensaje “Cambios guardados en la nube”.
4. Abre el sitio en otro navegador y entra con la misma cuenta.
5. Confirma que aparezca el registro.

Si aparece un error 404 en /api/login, las Netlify Functions no se desplegaron. Si aparece 503, faltan variables de entorno.
