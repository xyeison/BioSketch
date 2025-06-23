import { createParser } from 'eventsource-parser';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('VITE_OPENAI_API_KEY no está configurada');
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  onVisualization?: (visualization: string) => void;
}

const SYSTEM_PROMPT = `Eres Elsa, una asistente de salud digestiva amigable y empática especializada en el probiótico ProBioBalance Plus.

INFORMACIÓN DEL PRODUCTO:
- Nombre: ProBioBalance Plus
- Cepas: Lactobacillus acidophilus, Bifidobacterium lactis, Lactobacillus rhamnosus
- Dosis: 1 cápsula al día con alimentos

INSTRUCCIONES:
1. Responde de forma conversacional y natural, como ChatGPT
2. Sé breve y concisa (máximo 2-3 frases por respuesta)
3. Usa un tono cálido y empático
4. Si mencionas algo visual, incluye al FINAL: [VIZ:tipo] donde tipo puede ser:
   - probiotico, intestino, bacterias, batalla, defensas, digestion, alivio, etc.

Ejemplo: "Entiendo tu molestia. El probiótico ayuda a equilibrar tu flora intestinal. [VIZ:bacterias]"`;

export async function streamChatResponse(
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const { onToken, onComplete, onError, onVisualization } = callbacks;
  let fullText = '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 150,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    const parser = createParser({
      onEvent: (event: any) => {
        const data = event.data;
        if (data === '[DONE]') {
          // Buscar visualizaciones en el texto completo
          const vizMatch = fullText.match(/\[VIZ:(\w+)\]/g);
          if (vizMatch) {
            vizMatch.forEach(viz => {
              const type = viz.match(/\[VIZ:(\w+)\]/)?.[1];
              if (type && onVisualization) {
                onVisualization(type);
              }
            });
            // Limpiar las etiquetas del texto
            fullText = fullText.replace(/\[VIZ:\w+\]/g, '').trim();
          }
          onComplete?.(fullText);
          return;
        }
        
        try {
          const json = JSON.parse(data);
          const text = json.choices[0]?.delta?.content || '';
          if (text) {
            fullText += text;
            onToken?.(text);
          }
        } catch (e) {
          console.error('Error parsing stream:', e);
        }
      }
    });

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      parser.feed(decoder.decode(value));
    }
  } catch (error) {
    onError?.(error as Error);
    throw error;
  }
}

// Generar audio con streaming
export async function* streamAudio(text: string, voice: string = 'nova') {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: voice,
      input: text,
      response_format: 'mp3',
      speed: 1.0
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body!.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield value;
  }
}