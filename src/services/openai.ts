import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AIResponse {
  response: string;
  drawings: string[];
  timeline?: Array<{
    time: number;
    drawing: string;
  }>;
}

const SYSTEM_PROMPT = `Eres Elsa, una asistente de salud digestiva especializada en el probiótico ProBioBalance Plus.

INFORMACIÓN DEL PRODUCTO:
- Nombre: ProBioBalance Plus
- Cepas: Lactobacillus acidophilus (5 billones UFC), Bifidobacterium lactis (3 billones UFC), Lactobacillus rhamnosus (2 billones UFC)
- Dosis: 1 cápsula al día con alimentos
- Tipo: OTC (Over The Counter) - Venta libre

INSTRUCCIONES:
1. Escucha los síntomas del usuario y responde de manera empática y profesional
2. Explica cómo ProBioBalance Plus puede ayudar con esos síntomas específicos
3. Incluye información científica pero en lenguaje simple
4. Estructura tu respuesta en 2-3 párrafos cortos
5. IMPORTANTE: Al final, incluye "TIMELINE:" con eventos en formato: [tiempo_en_segundos]:[dibujo]

ELEMENTOS DE DIBUJO DISPONIBLES:
- probiotico: Cápsula del probiótico
- intestino: Intestino normal
- intestino_lento: Intestino con tránsito lento
- bacterias: Bacterias beneficiosas
- equilibrio: Balanza equilibrada

Ejemplo de respuesta:
"Entiendo que tienes problemas digestivos. Déjame explicarte cómo funciona.

ProBioBalance Plus contiene bacterias beneficiosas que restauran el equilibrio. Cuando tomas la cápsula, estas bacterias viajan a tu intestino.

Allí, las bacterias buenas combaten a las malas y restauran tu flora intestinal.

TIMELINE: 0:probiotico, 2:intestino, 4:bacterias, 6:equilibrio"`;

export async function getAIResponse(userInput: string): Promise<AIResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userInput }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const fullResponse = completion.choices[0].message.content || '';
    
    // Extraer timeline de la respuesta
    const timelineMatch = fullResponse.match(/TIMELINE:\s*(.+)$/);
    let response = fullResponse;
    let timeline: Array<{time: number, drawing: string}> = [];
    let drawings: string[] = [];
    
    if (timelineMatch) {
      // Remover la línea de TIMELINE de la respuesta
      response = fullResponse.replace(/\nTIMELINE:\s*.+$/, '').trim();
      
      // Parsear los eventos del timeline
      const events = timelineMatch[1].split(',').map(e => e.trim());
      timeline = events.map(event => {
        const [time, drawing] = event.split(':');
        return {
          time: parseFloat(time),
          drawing: drawing.trim()
        };
      });
      
      // Extraer solo los dibujos únicos para compatibilidad
      drawings = [...new Set(timeline.map(t => t.drawing))];
    } else {
      // Fallback si no hay timeline
      drawings = ['probiotico'];
      timeline = [{ time: 0, drawing: 'probiotico' }];
    }

    return { response, drawings, timeline };
  } catch (error) {
    console.error('Error al obtener respuesta de OpenAI:', error);
    // Fallback a respuesta predefinida
    return {
      response: "Disculpa, hubo un problema al procesar tu consulta. ProBioBalance Plus es un excelente probiótico que puede ayudarte con diversos problemas digestivos. ¿Podrías decirme más específicamente qué molestias tienes?",
      drawings: ['probiotico']
    };
  }
}