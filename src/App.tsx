import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IconMicrophone,
  IconTrash,
  IconPlayerStop,
  IconBrain,
  IconVirus,
  IconPill,
  IconStethoscope,
  IconMessages
} from '@tabler/icons-react';
import './App.css';

type VoiceStatus = 'inactive' | 'listening' | 'processing';

interface Consultation {
  id: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  symptoms: string[];
  recommendation: string;
}

// Simulación de base de conocimiento del probiótico OTC
const PROBIOTIC_INFO = {
  name: "ProBioBalance Plus",
  strains: [
    "Lactobacillus acidophilus (5 billones UFC)",
    "Bifidobacterium lactis (3 billones UFC)",
    "Lactobacillus rhamnosus (2 billones UFC)"
  ],
  benefits: {
    diarrea: {
      effectiveness: "Alta",
      explanation: "Las cepas de Lactobacillus ayudan a restaurar el equilibrio de la flora intestinal, reduciendo la frecuencia de deposiciones líquidas.",
      drawingSequence: ["intestino", "bacterias_buenas", "equilibrio"]
    },
    estreñimiento: {
      effectiveness: "Moderada",
      explanation: "Bifidobacterium lactis mejora el tránsito intestinal y la consistencia de las heces.",
      drawingSequence: ["intestino", "movimiento", "regularidad"]
    },
    gases: {
      effectiveness: "Alta",
      explanation: "Reduce la producción de gases al mejorar la digestión de carbohidratos complejos.",
      drawingSequence: ["fermentación", "reducción_gases", "confort"]
    },
    defensas: {
      effectiveness: "Moderada",
      explanation: "Fortalece la barrera intestinal y estimula el sistema inmune local.",
      drawingSequence: ["barrera_intestinal", "sistema_inmune", "protección"]
    }
  },
  dosage: "1 cápsula al día con alimentos",
  warnings: "No sustituye tratamiento médico. Consulte a su médico si los síntomas persisten."
};

// Palabras clave de síntomas
const SYMPTOM_KEYWORDS = {
  diarrea: ['diarrea', 'baño', 'líquido', 'suelto', 'frecuente', 'muchas veces'],
  estreñimiento: ['estreñimiento', 'estreñido', 'no puedo', 'duro', 'tapado'],
  gases: ['gases', 'hinchado', 'inflamado', 'globo', 'aire'],
  defensas: ['defensas', 'enfermo', 'gripe', 'resfriado', 'inmunidad']
};

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('inactive');
  const [transcript, setTranscript] = useState('');
  const [drawingCount, setDrawingCount] = useState(0);
  const [lastAction, setLastAction] = useState('Ninguna');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Mapa de funciones de dibujo ampliado
  const drawingFunctions: Record<string, () => void> = {
    intestino: () => drawIntestine(),
    bacterias_buenas: () => drawGoodBacteria(),
    equilibrio: () => drawBalance(),
    movimiento: () => drawIntestinalMovement(),
    regularidad: () => drawRegularity(),
    fermentación: () => drawFermentation(),
    reducción_gases: () => drawGasReduction(),
    confort: () => drawComfort(),
    barrera_intestinal: () => drawIntestinalBarrier(),
    sistema_inmune: () => drawImmuneSystem(),
    protección: () => drawProtection(),
    probiotico: () => drawProbioticCapsule()
  };

  useEffect(() => {
    initializeCanvas();
    setupVoiceRecognition();
    setupSpeechSynthesis();
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    
    ctxRef.current = ctx;
    clearCanvas();
  };

  const setupVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      
      recognition.onstart = () => {
        setVoiceStatus('listening');
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
        
        if (finalTranscript) {
          processUserQuery(finalTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento:', event.error);
        setVoiceStatus('inactive');
      };
      
      recognition.onend = () => {
        setVoiceStatus('inactive');
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  };

  const setupSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = new SpeechSynthesisUtterance();
      synthRef.current.lang = 'es-ES';
      synthRef.current.rate = 1.0;
      synthRef.current.pitch = 1.0;
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processUserQuery = async (text: string) => {
    setVoiceStatus('processing');
    setIsResponding(true);
    
    // Detectar síntomas mencionados
    const detectedSymptoms = detectSymptoms(text);
    
    // Generar respuesta personalizada
    const response = generateAIResponse(text, detectedSymptoms);
    
    // Crear nueva consulta
    const newConsultation: Consultation = {
      id: Date.now().toString(),
      userMessage: text,
      aiResponse: response.message,
      timestamp: new Date(),
      symptoms: detectedSymptoms,
      recommendation: response.recommendation
    };
    
    setConsultations(prev => [newConsultation, ...prev]);
    
    // Limpiar canvas para nueva explicación
    clearCanvas();
    
    // Iniciar respuesta con voz y dibujos
    await respondWithVoiceAndDrawings(response);
    
    setIsResponding(false);
  };

  const detectSymptoms = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    const detected: string[] = [];
    
    for (const [symptom, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detected.push(symptom);
      }
    }
    
    return detected;
  };

  const generateAIResponse = (userText: string, symptoms: string[]) => {
    let message = '';
    let recommendation = '';
    let drawingSequence: string[] = ['probiotico'];
    
    if (symptoms.length === 0) {
      message = `Hola! Soy tu asistente especializado en ${PROBIOTIC_INFO.name}. 
                 No he detectado síntomas específicos en tu consulta. 
                 Nuestro probiótico contiene ${PROBIOTIC_INFO.strains.join(', ')} 
                 y puede ayudar con problemas digestivos, regularidad intestinal y fortalecer las defensas. 
                 ¿Podrías contarme más específicamente qué molestias tienes?`;
      recommendation = "Consulta general - Se requiere más información";
    } else {
      const mainSymptom = symptoms[0];
      const benefitInfo = PROBIOTIC_INFO.benefits[mainSymptom as keyof typeof PROBIOTIC_INFO.benefits];
      
      if (benefitInfo) {
        message = `Entiendo que tienes problemas de ${mainSymptom}. 
                   Te tengo buenas noticias: ${PROBIOTIC_INFO.name} tiene una efectividad ${benefitInfo.effectiveness.toLowerCase()} para este problema. 
                   ${benefitInfo.explanation}
                   La dosis recomendada es ${PROBIOTIC_INFO.dosage}.
                   Recuerda: ${PROBIOTIC_INFO.warnings}`;
        
        recommendation = `Tomar ${PROBIOTIC_INFO.dosage} para aliviar ${mainSymptom}`;
        drawingSequence = [...drawingSequence, ...benefitInfo.drawingSequence];
      }
    }
    
    return { message, recommendation, drawingSequence };
  };

  const respondWithVoiceAndDrawings = async (response: {
    message: string;
    recommendation: string;
    drawingSequence: string[];
  }) => {
    setCurrentResponse(response.message);
    
    // Iniciar síntesis de voz
    if (synthRef.current && 'speechSynthesis' in window) {
      synthRef.current.text = response.message;
      window.speechSynthesis.speak(synthRef.current);
    }
    
    // Ejecutar secuencia de dibujos
    for (let i = 0; i < response.drawingSequence.length; i++) {
      const drawingKey = response.drawingSequence[i];
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos entre dibujos
      
      if (drawingFunctions[drawingKey]) {
        drawingFunctions[drawingKey]();
        setLastAction(`Dibujando: ${drawingKey}`);
      }
    }
  };

  // Funciones de dibujo específicas para el probiótico
  const drawProbioticCapsule = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Cápsula
    const capsuleX = 400;
    const capsuleY = 100;
    
    // Parte superior (tapa)
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(capsuleX, capsuleY, 30, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    
    // Parte inferior
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.arc(capsuleX, capsuleY, 30, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    
    // Línea central
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(capsuleX - 30, capsuleY);
    ctx.lineTo(capsuleX + 30, capsuleY);
    ctx.stroke();
    
    // Bacterias dentro
    for (let i = 0; i < 5; i++) {
      const bx = capsuleX + (Math.random() - 0.5) * 40;
      const by = capsuleY + (Math.random() - 0.5) * 40;
      
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.ellipse(bx, by, 5, 3, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Etiqueta
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(PROBIOTIC_INFO.name, capsuleX, capsuleY - 50);
    
    // Cepas
    ctx.font = '12px Inter';
    PROBIOTIC_INFO.strains.forEach((strain, index) => {
      ctx.fillText(strain, capsuleX, capsuleY + 60 + (index * 15));
    });
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawGoodBacteria = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const positions = [
      { x: 150, y: 250, color: '#4CAF50' },
      { x: 250, y: 280, color: '#8BC34A' },
      { x: 350, y: 260, color: '#66BB6A' }
    ];

    ctx.save();
    
    positions.forEach((pos, index) => {
      // Bacteria feliz
      ctx.fillStyle = pos.color;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 25, 15, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Cara sonriente
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      
      // Ojos
      ctx.beginPath();
      ctx.arc(pos.x - 8, pos.y - 5, 2, 0, 2 * Math.PI);
      ctx.arc(pos.x + 8, pos.y - 5, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Sonrisa
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      
      // Etiqueta
      ctx.fillStyle = '#333';
      ctx.font = '11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`Cepa ${index + 1}`, pos.x, pos.y + 35);
    });
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawBalance = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Balanza
    const centerX = 400;
    const centerY = 350;
    
    // Base
    ctx.fillStyle = '#795548';
    ctx.fillRect(centerX - 5, centerY, 10, 50);
    
    // Brazo de la balanza
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 100, centerY);
    ctx.lineTo(centerX + 100, centerY);
    ctx.stroke();
    
    // Platos
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Plato izquierdo - bacterias malas
    ctx.beginPath();
    ctx.moveTo(centerX - 80, centerY);
    ctx.lineTo(centerX - 80, centerY + 20);
    ctx.moveTo(centerX - 100, centerY + 20);
    ctx.lineTo(centerX - 60, centerY + 20);
    ctx.stroke();
    
    // Bacterias malas (pocas)
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.ellipse(centerX - 80, centerY + 10, 10, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Plato derecho - bacterias buenas
    ctx.beginPath();
    ctx.moveTo(centerX + 80, centerY);
    ctx.lineTo(centerX + 80, centerY + 20);
    ctx.moveTo(centerX + 60, centerY + 20);
    ctx.lineTo(centerX + 100, centerY + 20);
    ctx.stroke();
    
    // Bacterias buenas (muchas)
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX + 70 + i * 10, centerY + 5 + i * 5, 8, 5, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Equilibrio Restaurado', centerX, centerY - 30);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawIntestinalMovement = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Intestino con ondas de movimiento
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 15;
    
    // Dibujar intestino con ondas
    ctx.beginPath();
    let x = 100;
    let y = 300;
    ctx.moveTo(x, y);
    
    for (let i = 0; i < 6; i++) {
      const amplitude = 30 + Math.sin(i) * 10;
      ctx.quadraticCurveTo(
        x + 50, y - amplitude,
        x + 100, y
      );
      x += 100;
    }
    ctx.stroke();
    
    // Flechas de movimiento
    ctx.strokeStyle = '#4CAF50';
    ctx.fillStyle = '#4CAF50';
    ctx.lineWidth = 3;
    
    for (let i = 1; i < 6; i++) {
      const arrowX = 100 + i * 100;
      const arrowY = 300;
      
      ctx.beginPath();
      ctx.moveTo(arrowX - 30, arrowY);
      ctx.lineTo(arrowX, arrowY);
      ctx.stroke();
      
      // Punta de flecha
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 10, arrowY - 5);
      ctx.lineTo(arrowX - 10, arrowY + 5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Movimiento Intestinal Mejorado', 400, 250);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawGasReduction = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Antes (con gases)
    ctx.fillStyle = '#FFE0B2';
    ctx.beginPath();
    ctx.ellipse(200, 300, 60, 80, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Burbujas de gas
    ctx.fillStyle = 'rgba(255, 152, 0, 0.5)';
    for (let i = 0; i < 8; i++) {
      const bx = 200 + (Math.random() - 0.5) * 80;
      const by = 300 + (Math.random() - 0.5) * 100;
      const size = 5 + Math.random() * 15;
      
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Flecha
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(280, 300);
    ctx.lineTo(320, 300);
    ctx.stroke();
    
    // Después (sin gases)
    ctx.fillStyle = '#C8E6C9';
    ctx.beginPath();
    ctx.ellipse(400, 300, 50, 70, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Cara feliz
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.arc(400, 280, 20, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Reducción de Gases', 300, 400);
    ctx.font = '12px Inter';
    ctx.fillText('Antes', 200, 390);
    ctx.fillText('Después', 400, 390);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawIntestinalBarrier = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Pared intestinal
    const startX = 150;
    const startY = 200;
    const cellWidth = 60;
    const cellHeight = 80;
    
    // Células intestinales
    for (let i = 0; i < 6; i++) {
      // Célula
      ctx.fillStyle = '#B3E5FC';
      ctx.strokeStyle = '#0288D1';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.rect(startX + i * cellWidth, startY, cellWidth, cellHeight);
      ctx.fill();
      ctx.stroke();
      
      // Núcleo
      ctx.fillStyle = '#01579B';
      ctx.beginPath();
      ctx.arc(startX + i * cellWidth + cellWidth/2, startY + cellHeight/2, 8, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Uniones estrechas (tight junctions)
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 4;
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + (i + 1) * cellWidth - 5, startY);
      ctx.lineTo(startX + (i + 1) * cellWidth + 5, startY);
      ctx.moveTo(startX + (i + 1) * cellWidth - 5, startY + cellHeight);
      ctx.lineTo(startX + (i + 1) * cellWidth + 5, startY + cellHeight);
      ctx.stroke();
    }
    
    // Bacterias buenas protegiendo
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < 4; i++) {
      const bx = startX + 50 + i * 80;
      const by = startY - 30;
      
      ctx.beginPath();
      ctx.ellipse(bx, by, 15, 8, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Escudo
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by - 20, 10, Math.PI, 0);
      ctx.stroke();
    }
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Barrera Intestinal Fortalecida', 300, 320);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawImmuneSystem = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Célula inmune
    const immuneX = 300;
    const immuneY = 250;
    
    ctx.fillStyle = '#9C27B0';
    ctx.beginPath();
    ctx.arc(immuneX, immuneY, 40, 0, 2 * Math.PI);
    ctx.fill();
    
    // Anticuerpos
    const antibodies = [
      { x: immuneX - 60, y: immuneY - 30 },
      { x: immuneX + 60, y: immuneY - 30 },
      { x: immuneX - 60, y: immuneY + 30 },
      { x: immuneX + 60, y: immuneY + 30 }
    ];
    
    ctx.strokeStyle = '#E91E63';
    ctx.lineWidth = 3;
    
    antibodies.forEach(ab => {
      // Forma de Y
      ctx.beginPath();
      ctx.moveTo(ab.x, ab.y);
      ctx.lineTo(ab.x, ab.y - 20);
      ctx.moveTo(ab.x - 10, ab.y - 20);
      ctx.lineTo(ab.x, ab.y - 10);
      ctx.lineTo(ab.x + 10, ab.y - 20);
      ctx.stroke();
    });
    
    // Bacterias patógenas siendo neutralizadas
    ctx.fillStyle = 'rgba(233, 30, 99, 0.5)';
    ctx.strokeStyle = '#E91E63';
    
    const pathogens = [
      { x: immuneX - 80, y: immuneY },
      { x: immuneX + 80, y: immuneY },
      { x: immuneX, y: immuneY - 80 }
    ];
    
    pathogens.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // X de neutralizado
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y - 10);
      ctx.lineTo(p.x + 10, p.y + 10);
      ctx.moveTo(p.x + 10, p.y - 10);
      ctx.lineTo(p.x - 10, p.y + 10);
      ctx.stroke();
    });
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Sistema Inmune Activado', immuneX, immuneY + 100);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawRegularity = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Calendario
    const calX = 200;
    const calY = 200;
    const daySize = 30;
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Días de la semana
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 4; j++) {
        const x = calX + i * daySize;
        const y = calY + j * daySize;
        
        ctx.strokeRect(x, y, daySize, daySize);
        
        // Marcar días con regularidad
        if ((i + j * 7) % 2 === 0 && j < 3) {
          ctx.fillStyle = '#4CAF50';
          ctx.beginPath();
          ctx.arc(x + daySize/2, y + daySize/2, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Check mark
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + daySize/2 - 4, y + daySize/2);
          ctx.lineTo(x + daySize/2 - 1, y + daySize/2 + 3);
          ctx.lineTo(x + daySize/2 + 4, y + daySize/2 - 3);
          ctx.stroke();
          ctx.strokeStyle = '#333';
        }
      }
    }
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Regularidad Intestinal Diaria', calX + 100, calY - 20);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawComfort = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Persona feliz (simplificada)
    const personX = 400;
    const personY = 250;
    
    // Cabeza
    ctx.fillStyle = '#FFEBCD';
    ctx.beginPath();
    ctx.arc(personX, personY, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sonrisa grande
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(personX, personY + 5, 15, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    
    // Ojos felices
    ctx.beginPath();
    ctx.arc(personX - 10, personY - 5, 3, Math.PI, 0);
    ctx.arc(personX + 10, personY - 5, 3, Math.PI, 0);
    ctx.stroke();
    
    // Cuerpo
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(personX - 20, personY + 30, 40, 60);
    
    // Estómago feliz
    ctx.fillStyle = '#C8E6C9';
    ctx.beginPath();
    ctx.ellipse(personX, personY + 60, 15, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Corazón de bienestar
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.moveTo(personX + 40, personY);
    ctx.bezierCurveTo(personX + 40, personY - 10, personX + 30, personY - 10, personX + 30, personY);
    ctx.bezierCurveTo(personX + 30, personY - 10, personX + 20, personY - 10, personX + 20, personY);
    ctx.bezierCurveTo(personX + 20, personY + 10, personX + 30, personY + 20, personX + 30, personY + 20);
    ctx.bezierCurveTo(personX + 30, personY + 20, personX + 40, personY + 10, personX + 40, personY);
    ctx.fill();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Bienestar Digestivo', personX, personY + 120);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawProtection = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    // Escudo grande
    const shieldX = 400;
    const shieldY = 250;
    
    ctx.fillStyle = '#2196F3';
    ctx.beginPath();
    ctx.moveTo(shieldX, shieldY - 60);
    ctx.quadraticCurveTo(shieldX - 60, shieldY - 40, shieldX - 60, shieldY);
    ctx.quadraticCurveTo(shieldX - 60, shieldY + 40, shieldX, shieldY + 80);
    ctx.quadraticCurveTo(shieldX + 60, shieldY + 40, shieldX + 60, shieldY);
    ctx.quadraticCurveTo(shieldX + 60, shieldY - 40, shieldX, shieldY - 60);
    ctx.fill();
    
    // Cruz de salud
    ctx.fillStyle = 'white';
    ctx.fillRect(shieldX - 8, shieldY - 30, 16, 60);
    ctx.fillRect(shieldX - 30, shieldY - 8, 60, 16);
    
    // Bacterias buenas alrededor
    ctx.fillStyle = '#4CAF50';
    const positions = [
      { x: shieldX - 80, y: shieldY },
      { x: shieldX + 80, y: shieldY },
      { x: shieldX, y: shieldY - 80 },
      { x: shieldX, y: shieldY + 100 }
    ];
    
    positions.forEach(pos => {
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 15, 8, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Protección Completa', shieldX, shieldY + 140);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawFermentation = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    
    const centerX = 400;
    const centerY = 250;
    
    // Contenedor de fermentación
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 50, centerY - 50);
    ctx.lineTo(centerX - 50, centerY + 50);
    ctx.quadraticCurveTo(centerX, centerY + 80, centerX + 50, centerY + 50);
    ctx.lineTo(centerX + 50, centerY - 50);
    ctx.stroke();
    
    // Líquido fermentando
    ctx.fillStyle = 'rgba(255, 193, 7, 0.3)';
    ctx.beginPath();
    ctx.moveTo(centerX - 45, centerY + 20);
    ctx.quadraticCurveTo(centerX, centerY + 50, centerX + 45, centerY + 20);
    ctx.lineTo(centerX + 45, centerY + 45);
    ctx.quadraticCurveTo(centerX, centerY + 75, centerX - 45, centerY + 45);
    ctx.closePath();
    ctx.fill();
    
    // Burbujas de fermentación
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 8; i++) {
      const bx = centerX + (Math.random() - 0.5) * 60;
      const by = centerY + Math.random() * 40;
      const size = 3 + Math.random() * 5;
      
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Bacterias trabajando
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < 3; i++) {
      const bx = centerX + (i - 1) * 25;
      const by = centerY + 10;
      
      ctx.beginPath();
      ctx.ellipse(bx, by, 12, 6, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Flecha de transformación
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 80, centerY);
    ctx.lineTo(centerX - 60, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 60, centerY);
    ctx.lineTo(centerX + 80, centerY);
    ctx.stroke();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Fermentación Beneficiosa', centerX, centerY - 70);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawIntestine = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 12;
    
    // Intestino ondulado más detallado
    ctx.beginPath();
    ctx.moveTo(100, 200);
    
    // Crear un intestino más realista
    const segments = [
      { cp1x: 150, cp1y: 150, cp2x: 200, cp2y: 250, x: 250, y: 200 },
      { cp1x: 300, cp1y: 150, cp2x: 350, cp2y: 250, x: 400, y: 200 },
      { cp1x: 450, cp1y: 150, cp2x: 500, cp2y: 250, x: 550, y: 200 },
      { cp1x: 600, cp1y: 150, cp2x: 650, cp2y: 250, x: 700, y: 200 }
    ];
    
    segments.forEach(seg => {
      ctx.bezierCurveTo(seg.cp1x, seg.cp1y, seg.cp2x, seg.cp2y, seg.x, seg.y);
    });
    
    ctx.stroke();
    
    // Vellosidades más detalladas
    ctx.strokeStyle = '#1976D2';
    ctx.lineWidth = 2;
    
    for (let i = 100; i <= 700; i += 30) {
      for (let j = 0; j < 3; j++) {
        const height = 15 + Math.random() * 10;
        const yBase = 190 + j * 5;
        
        ctx.beginPath();
        ctx.moveTo(i + j * 10, yBase);
        ctx.lineTo(i + j * 10, yBase - height);
        ctx.stroke();
      }
    }
    
    // Texto descriptivo
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Tu Sistema Digestivo', 400, 300);
    
    ctx.font = '12px Inter';
    ctx.fillText('Donde actúan los probióticos', 400, 320);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setDrawingCount(0);
    setLastAction('Canvas limpiado');
  };

  const incrementDrawingCount = () => {
    setDrawingCount(prev => prev + 1);
  };

  // Función para simular consultas de ejemplo
  const simulateConsultation = (text: string) => {
    setTranscript(text);
    processUserQuery(text);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>
          <IconPill size={32} className="icon-bacteria" />
          {PROBIOTIC_INFO.name} - Asistente Inteligente
        </h1>
        <p>Consulta sobre tu salud digestiva y recibe recomendaciones personalizadas</p>
        
        <div className="controls">
          <button 
            className="btn btn-primary" 
            onClick={startListening}
            disabled={isListening || isResponding}
          >
            <IconMicrophone size={20} />
            {isListening ? 'Escuchando...' : 'Iniciar Consulta'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={clearCanvas}
            disabled={isResponding}
          >
            <IconTrash size={20} />
            Limpiar Pantalla
          </button>
          
          <button 
            className="btn btn-danger" 
            onClick={stopListening}
            disabled={!isListening}
          >
            <IconPlayerStop size={20} />
            Detener
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            id="drawingCanvas" 
            width={800} 
            height={600}
          />
          
          {currentResponse && (
            <div className="ai-response-overlay">
              <h3>Respuesta del Asistente:</h3>
              <p>{currentResponse}</p>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="panel">
            <h3>
              <IconStethoscope size={20} />
              Tu Consulta
            </h3>
            <div className="voice-status">
              <motion.div 
                className={`voice-indicator voice-${voiceStatus}`}
                animate={voiceStatus === 'listening' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {voiceStatus === 'listening' ? '🎤' : 
                 voiceStatus === 'processing' ? '🤖' : 
                 isResponding ? '💊' : '🏥'}
              </motion.div>
              <div className="voice-status-text">
                {voiceStatus === 'listening' ? 'Escuchando tu consulta...' : 
                 voiceStatus === 'processing' ? 'Analizando síntomas...' : 
                 isResponding ? 'Generando recomendación...' :
                 'Presiona para consultar'}
              </div>
            </div>
            <div className="transcript">
              {transcript || 'Describe tus síntomas digestivos...'}
            </div>
          </div>

          <div className="panel">
            <h3>
              <IconMessages size={20} />
              Historial de Consultas
            </h3>
            <div className="consultations-history">
              {consultations.length === 0 ? (
                <div className="consultation-item">
                  No hay consultas aún. ¡Presiona el micrófono para comenzar!
                </div>
              ) : (
                consultations.map((consultation) => (
                  <motion.div 
                    key={consultation.id} 
                    className="consultation-item"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="consultation-user">
                      <strong>Tú:</strong> {consultation.userMessage}
                    </div>
                    <div className="consultation-symptoms">
                      Síntomas detectados: {consultation.symptoms.join(', ') || 'Ninguno'}
                    </div>
                    <div className="consultation-recommendation">
                      <strong>Recomendación:</strong> {consultation.recommendation}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <h3>💡 Consultas de Ejemplo</h3>
            <div className="suggested-phrases">
              <button 
                className="phrase-btn" 
                onClick={() => simulateConsultation('Hola, voy mucho al baño, como 5 veces al día')}
              >
                "Voy mucho al baño"
              </button>
              <button 
                className="phrase-btn" 
                onClick={() => simulateConsultation('Tengo muchos gases y me siento hinchado')}
              >
                "Tengo gases e hinchazón"
              </button>
              <button 
                className="phrase-btn" 
                onClick={() => simulateConsultation('Llevo 3 días sin ir al baño')}
              >
                "Tengo estreñimiento"
              </button>
              <button 
                className="phrase-btn" 
                onClick={() => simulateConsultation('Me enfermo seguido, necesito mejorar mis defensas')}
              >
                "Quiero mejorar mis defensas"
              </button>
            </div>
          </div>

          <div className="panel product-info">
            <h3>
              <IconVirus size={20} />
              {PROBIOTIC_INFO.name}
            </h3>
            <div className="product-details">
              <p><strong>Cepas activas:</strong></p>
              <ul>
                {PROBIOTIC_INFO.strains.map((strain, index) => (
                  <li key={index}>{strain}</li>
                ))}
              </ul>
              <p><strong>Dosis:</strong> {PROBIOTIC_INFO.dosage}</p>
              <p className="warning">⚠️ {PROBIOTIC_INFO.warnings}</p>
            </div>
          </div>
        </aside>
      </main>

      <footer className="status-bar">
        <span>💊 Producto OTC - Venta libre</span>
        <span>Elementos explicativos: {drawingCount}</span>
        <span>Última acción: {lastAction}</span>
      </footer>
    </div>
  );
}