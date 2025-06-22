import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AIResponse {
  response: string;
  drawings: string[];
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
4. IMPORTANTE: Al final de tu respuesta, incluye una línea que diga "DIBUJOS:" seguida de los elementos a dibujar separados por comas

ELEMENTOS DE DIBUJO DISPONIBLES:
- probiotico: Cápsula del probiótico
- intestino: Intestino normal
- intestino_lento: Intestino con tránsito lento
- bacterias: Bacterias beneficiosas
- equilibrio: Balanza equilibrada
- movimiento: Intestino con movimiento regular
- gases: Estómago con gases
- alivio: Estómago aliviado

Ejemplo de respuesta:
"Entiendo que tienes problemas digestivos. ProBioBalance Plus puede ayudarte porque... [explicación]. 
DIBUJOS: intestino, bacterias, equilibrio"`;

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
    
    // Extraer los dibujos de la respuesta
    const drawingsMatch = fullResponse.match(/DIBUJOS:\s*(.+)$/);
    let drawings: string[] = ['probiotico']; // Default
    let response = fullResponse;
    
    if (drawingsMatch) {
      // Remover la línea de DIBUJOS de la respuesta
      response = fullResponse.replace(/\nDIBUJOS:\s*.+$/, '').trim();
      // Parsear los dibujos
      drawings = drawingsMatch[1].split(',').map(d => d.trim()).filter(d => d);
    }

    return { response, drawings };
  } catch (error) {
    console.error('Error al obtener respuesta de OpenAI:', error);
    // Fallback a respuesta predefinida
    return {
      response: "Disculpa, hubo un problema al procesar tu consulta. ProBioBalance Plus es un excelente probiótico que puede ayudarte con diversos problemas digestivos. ¿Podrías decirme más específicamente qué molestias tienes?",
      drawings: ['probiotico']
    };
  }
}