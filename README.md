# BioSketch 💊 - Asistente Inteligente de Probióticos

**BioSketch** es una aplicación inteligente que combina reconocimiento de voz, inteligencia artificial y visualización automática para ayudar a los usuarios a entender cómo los probióticos OTC pueden mejorar su salud digestiva. Presentando a **Elsa**, tu asistente personal de salud digestiva.

## 🎯 Concepto

**Elsa** es un asistente virtual especializado en **ProBioBalance Plus**, un probiótico de venta libre (OTC) que responde a consultas de salud digestiva mediante:
- 🎤 **Reconocimiento de voz** para consultas naturales
- 🤖 **IA especializada** que analiza síntomas y recomienda
- 🎨 **Visualizaciones automáticas** que explican cómo funcionan los probióticos
- 🗣️ **Respuestas por voz** para una experiencia conversacional completa

## 🚀 Características Principales

### Para el Usuario
- **Consulta por voz**: "Hola, voy mucho al baño"
- **Análisis inteligente**: Detecta síntomas como diarrea, estreñimiento, gases
- **Respuesta personalizada**: Explica cómo el probiótico puede ayudar
- **Visualización educativa**: Dibuja en tiempo real el proceso digestivo

### Síntomas que Detecta
- 💩 **Diarrea**: "voy mucho al baño", "líquido", "suelto"
- 🚫 **Estreñimiento**: "no puedo ir", "estreñido", "duro"
- 💨 **Gases**: "hinchado", "inflamado", "gases"
- 🛡️ **Defensas bajas**: "me enfermo seguido", "gripe", "defensas"

### Información del Producto
- **Nombre**: ProBioBalance Plus
- **Cepas**: 
  - Lactobacillus acidophilus (5 billones UFC)
  - Bifidobacterium lactis (3 billones UFC)  
  - Lactobacillus rhamnosus (2 billones UFC)
- **Dosis**: 1 cápsula al día con alimentos
- **Tipo**: OTC (Over The Counter) - Venta libre

## 🛠️ Tecnologías

- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **OpenAI GPT-3.5** para respuestas inteligentes
- **Framer Motion** para animaciones fluidas
- **Web Speech API** para voz bidireccional
- **Canvas API** para visualizaciones dinámicas
- **Tabler Icons** para iconografía médica

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/xyeison/BioSketch.git

# Navegar al directorio
cd BioSketch

# Instalar dependencias
npm install

# Configurar OpenAI API Key
cp .env.example .env
# Edita .env y añade tu API key de OpenAI

# Iniciar en modo desarrollo
npm run dev
```

### 🔑 Configuración de OpenAI

1. Obtén tu API key en [OpenAI Platform](https://platform.openai.com/api-keys)
2. Copia `.env.example` a `.env`
3. Reemplaza `VITE_OPENAI_API_KEY` con tu clave API real

## 🎨 Cómo Funciona

1. **Consulta**: El usuario describe sus síntomas por voz
2. **Procesamiento con ChatGPT**: La IA de OpenAI analiza la consulta y genera una respuesta personalizada
3. **Respuesta Inteligente**: 
   - ChatGPT explica cómo ProBioBalance Plus puede ayudar
   - Selecciona automáticamente los dibujos relevantes
   - Proporciona información científica en lenguaje simple
4. **Visualización Sincronizada**: Los dibujos se muestran mientras Elsa habla

## 📱 Casos de Uso

### Ejemplo 1: Diarrea
```
Usuario: "Hola, voy mucho al baño, como 5 veces al día"
Elsa: "Entiendo que tienes problemas de diarrea. ProBioBalance Plus tiene 
      efectividad alta para este problema. Las cepas de Lactobacillus 
      ayudan a restaurar el equilibrio..."
Visualiza: [Intestino] → [Bacterias buenas] → [Equilibrio restaurado]
```

### Ejemplo 2: Gases
```
Usuario: "Me siento muy hinchado y con gases"
Elsa: "Los gases pueden ser muy molestos. Nuestro probiótico reduce la 
      producción de gases al mejorar la digestión..."
Visualiza: [Fermentación] → [Reducción de gases] → [Confort digestivo]
```

## 🌐 Compatibilidad

- ✅ Chrome/Edge (óptimo - voz completa)
- ✅ Firefox (funciona con botones de ejemplo)
- ✅ Safari (funciona con botones de ejemplo)
- ✅ Móviles y tablets (responsive)

## ⚠️ Disclaimer

- Producto OTC de venta libre
- No sustituye consulta médica profesional
- Consulte a su médico si los síntomas persisten
- Solo para fines educativos e informativos

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Add: Nueva característica'`)
4. Push a la branch (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Úsalo libremente para proyectos educativos y comerciales

---

Desarrollado con ❤️ para mejorar la salud digestiva mediante tecnología