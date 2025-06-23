# Instrucciones de Despliegue en Vercel

## Configuración de Variables de Entorno

Para que la aplicación funcione correctamente en Vercel, debes configurar la variable de entorno de OpenAI:

1. **En Vercel Dashboard:**
   - Ve a tu proyecto en Vercel
   - Click en "Settings" (Configuración)
   - En el menú lateral, click en "Environment Variables"
   - Agrega la siguiente variable:
     - **Name:** `VITE_OPENAI_API_KEY`
     - **Value:** Tu API key de OpenAI (empieza con `sk-`)
     - **Environment:** Selecciona todos (Production, Preview, Development)
   - Click en "Save"

2. **Redeploy:**
   - Después de agregar la variable de entorno, debes hacer un nuevo deploy
   - Ve a "Deployments" y click en "Redeploy" en el último deployment

## Verificación

Si la aplicación no se ve en Vercel, verifica:

1. **Consola del navegador (F12):**
   - Busca errores relacionados con la API key
   - Si ves "VITE_OPENAI_API_KEY no está configurada", significa que la variable no está configurada correctamente

2. **Logs de Vercel:**
   - En Vercel Dashboard, ve a "Functions" → "Logs"
   - Revisa si hay errores durante el build

## Permisos del Navegador

La aplicación requiere permisos de:
- **Micrófono:** Para el reconocimiento de voz
- **Audio:** Para reproducir las respuestas

Asegúrate de permitir estos permisos cuando el navegador los solicite.

## Solución de Problemas

Si aún no funciona:

1. **Limpia la caché del navegador**
2. **Verifica que el dominio de Vercel tenga HTTPS** (requerido para APIs de voz)
3. **Revisa la consola de errores** en las herramientas de desarrollador (F12)