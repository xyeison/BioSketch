import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import { getAIResponse } from './services/openai';
import './App.css';

type VoiceStatus = 'inactive' | 'listening' | 'processing' | 'responding';

// Base de conocimiento del probiótico
const PROBIOTIC_INFO = {
  name: "ProBioBalance Plus",
  botName: "Elsa",
  botAvatar: "https://example.com/elsa-avatar.png",
  benefits: {
    diarrea: {
      response: "Veo que tienes problemas para ir al baño muy seguido. Nuestro probiótico tiene bacterias buenas que ayudan a equilibrar tu intestino. Mira cómo funciona...",
      drawings: ["intestino", "bacterias", "equilibrio"]
    },
    estreñimiento: {
      response: "Entiendo que te cuesta ir al baño. Las bacterias de nuestro probiótico mejoran el movimiento intestinal. Te muestro el proceso...",
      drawings: ["intestino_lento", "bacterias", "movimiento"]
    },
    gases: {
      response: "Los gases son molestos. Nuestro probiótico reduce la fermentación excesiva. Observa cómo actúa...",
      drawings: ["gases", "bacterias", "alivio"]
    },
    general: {
      response: "¡Hola! Soy Elsa, tu asistente de salud digestiva. Cuéntame qué molestias tienes y te explicaré cómo nuestro probiótico puede ayudarte.",
      drawings: ["probiotico"]
    }
  }
};

// Detectar síntomas
const SYMPTOM_PATTERNS = {
  diarrea: ['baño', 'diarrea', 'líquido', 'suelto', 'mucho', 'veces'],
  estreñimiento: ['estreñimiento', 'no puedo', 'duro', 'tapado', 'días sin'],
  gases: ['gases', 'hinchado', 'inflamado', 'globo', 'aire']
};

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('inactive');
  const [currentText, setCurrentText] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    initializeCanvas();
    setupVoiceRecognition();
    setupSpeechSynthesis();
    
    // Mensaje inicial
    setTimeout(() => {
      processResponse('general');
    }, 1000);
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    
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
        setCurrentText('');
      };
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript = event.results[i][0].transcript;
        }
        
        setCurrentText(transcript);
        
        if (event.results[event.results.length - 1].isFinal) {
          processUserInput(transcript);
        }
      };
      
      recognition.onerror = () => {
        setVoiceStatus('inactive');
        setIsListening(false);
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
      synthRef.current.rate = 0.95;
      synthRef.current.pitch = 1.1;
      synthRef.current.volume = 0.9;
      
      // Intentar obtener una voz femenina más natural
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Buscar voces en español
        const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
        
        // Priorizar voces femeninas y naturales
        const preferredVoices = spanishVoices.filter(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('mujer') ||
          voice.name.toLowerCase().includes('paulina') ||
          voice.name.toLowerCase().includes('monica') ||
          voice.name.toLowerCase().includes('helena') ||
          voice.name.toLowerCase().includes('laura')
        );
        
        // Si encontramos una voz preferida, usarla
        if (preferredVoices.length > 0 && synthRef.current) {
          synthRef.current.voice = preferredVoices[0];
        } else if (spanishVoices.length > 0 && synthRef.current) {
          // Si no, usar cualquier voz en español
          synthRef.current.voice = spanishVoices[0];
        }
      };
      
      // Las voces pueden no estar disponibles inmediatamente
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', setVoice);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const processUserInput = async (text: string) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
    setVoiceStatus('processing');
    
    try {
      // Obtener respuesta de OpenAI
      const aiResponse = await getAIResponse(text);
      processAIResponse(aiResponse.response, aiResponse.drawings);
    } catch (error) {
      console.error('Error procesando entrada:', error);
      // Fallback al sistema anterior
      const symptom = detectSymptom(text);
      processResponse(symptom);
    }
  };

  const detectSymptom = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    for (const [symptom, keywords] of Object.entries(SYMPTOM_PATTERNS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return symptom;
      }
    }
    
    return 'general';
  };

  const processResponse = async (symptom: string) => {
    const response = PROBIOTIC_INFO.benefits[symptom as keyof typeof PROBIOTIC_INFO.benefits] || PROBIOTIC_INFO.benefits.general;
    
    setMessages(prev => [...prev, { type: 'ai', text: response.response }]);
    setVoiceStatus('responding');
    
    // Limpiar canvas
    clearCanvas();
    
    // Hablar
    if (synthRef.current && 'speechSynthesis' in window) {
      synthRef.current.text = response.response;
      window.speechSynthesis.speak(synthRef.current);
    }
    
    // Dibujar secuencia
    for (let i = 0; i < response.drawings.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      drawElement(response.drawings[i]);
    }
    
    setTimeout(() => {
      setVoiceStatus('inactive');
    }, 2000);
  };

  const processAIResponse = async (responseText: string, drawings: string[]) => {
    setMessages(prev => [...prev, { type: 'ai', text: responseText }]);
    setVoiceStatus('responding');
    
    // Limpiar canvas
    clearCanvas();
    
    // Hablar
    if (synthRef.current && 'speechSynthesis' in window) {
      synthRef.current.text = responseText;
      window.speechSynthesis.speak(synthRef.current);
    }
    
    // Dibujar secuencia
    for (let i = 0; i < drawings.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      drawElement(drawings[i]);
    }
    
    setTimeout(() => {
      setVoiceStatus('inactive');
    }, 2000);
  };

  const drawElement = (element: string) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const centerX = 400;
    const centerY = 200;
    
    // Animación de entrada con fade
    let alpha = 0;
    const fadeIn = () => {
      if (alpha < 1) {
        alpha += 0.05;
        ctx.globalAlpha = alpha;
        
        // Limpiar y redibujar con nueva opacidad
        clearCanvas();
        
        // Redibujar elementos previos con opacidad completa
        ctx.globalAlpha = 1;
        // TODO: Mantener track de elementos previos
        
        // Dibujar elemento actual con fade
        ctx.globalAlpha = alpha;
        
        switch(element) {
          case 'probiotico':
            drawPill(ctx, centerX, centerY);
            break;
          case 'intestino':
            drawIntestine(ctx, centerX, centerY);
            break;
          case 'intestino_lento':
            drawSlowIntestine(ctx, centerX, centerY);
            break;
          case 'bacterias':
            drawBacteria(ctx, centerX, centerY);
            break;
          case 'equilibrio':
            drawBalance(ctx, centerX, centerY);
            break;
          case 'movimiento':
            drawMovement(ctx, centerX, centerY);
            break;
          case 'gases':
            drawGas(ctx, centerX, centerY);
            break;
          case 'alivio':
            drawRelief(ctx, centerX, centerY);
            break;
        }
        
        ctx.globalAlpha = 1;
        requestAnimationFrame(fadeIn);
      }
    };
    
    fadeIn();
  };

  const drawPill = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    
    // Cápsula con gradientes
    const topGradient = ctx.createLinearGradient(x - 40, y - 40, x + 40, y);
    topGradient.addColorStop(0, '#FF8A80');
    topGradient.addColorStop(0.5, '#FF6B6B');
    topGradient.addColorStop(1, '#FF5252');
    
    const bottomGradient = ctx.createLinearGradient(x - 40, y, x + 40, y + 40);
    bottomGradient.addColorStop(0, '#64E9E4');
    bottomGradient.addColorStop(0.5, '#4ECDC4');
    bottomGradient.addColorStop(1, '#26A69A');
    
    // Parte superior
    ctx.fillStyle = topGradient;
    ctx.beginPath();
    ctx.arc(x, y, 45, Math.PI, 0);
    ctx.fill();
    
    // Parte inferior
    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.arc(x, y, 45, 0, Math.PI);
    ctx.fill();
    
    // Línea divisoria con brillo
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x - 45, y);
    ctx.lineTo(x + 45, y);
    ctx.stroke();
    
    // Brillos
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x - 15, y - 20, 15, 8, -Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Texto mejorado
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 28px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('ProBioBalance Plus', x, y - 90);
    
    ctx.font = '18px Inter';
    ctx.fillStyle = '#666';
    ctx.fillText('1 cápsula al día con alimentos', x, y + 90);
    
    // Ícono de escudo de salud
    ctx.font = '40px Inter';
    ctx.fillText('🛡️', x, y - 130);
    
    ctx.restore();
  };

  const drawIntestine = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Sombra suave
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    
    // Gradiente para el intestino
    const gradient = ctx.createLinearGradient(x - 200, y, x + 200, y);
    gradient.addColorStop(0, '#64B5F6');
    gradient.addColorStop(0.5, '#2196F3');
    gradient.addColorStop(1, '#1976D2');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    
    // Forma ondulada del intestino
    ctx.beginPath();
    ctx.moveTo(x - 200, y);
    ctx.bezierCurveTo(x - 150, y - 40, x - 100, y - 40, x - 50, y);
    ctx.bezierCurveTo(x, y + 40, x + 50, y + 40, x + 100, y);
    ctx.bezierCurveTo(x + 150, y - 40, x + 200, y - 40, x + 200, y);
    ctx.stroke();
    
    // Líneas internas para dar textura
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(x - 190, y);
    ctx.bezierCurveTo(x - 140, y - 35, x - 90, y - 35, x - 40, y);
    ctx.bezierCurveTo(x + 10, y + 35, x + 60, y + 35, x + 110, y);
    ctx.bezierCurveTo(x + 160, y - 35, x + 190, y - 35, x + 190, y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Texto mejorado
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#1565C0';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Tu sistema digestivo', x, y - 80);
    
    ctx.restore();
  };

  const drawSlowIntestine = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 20;
    
    // Intestino lento
    ctx.beginPath();
    ctx.moveTo(x - 200, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 200, y);
    ctx.stroke();
    
    // Bloqueos
    ctx.fillStyle = '#795548';
    for (let i = -150; i <= 150; i += 100) {
      ctx.beginPath();
      ctx.arc(x + i, y, 15, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Tránsito lento', x, y - 80);
    
    ctx.restore();
  };

  const drawBacteria = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    const positions = [
      { x: x - 100, y: y, color: '#4CAF50', scale: 1.2 },
      { x: x, y: y - 50, color: '#66BB6A', scale: 1 },
      { x: x + 100, y: y, color: '#81C784', scale: 0.8 },
      { x: x - 50, y: y + 50, color: '#4CAF50', scale: 0.9 },
      { x: x + 50, y: y + 50, color: '#66BB6A', scale: 1.1 }
    ];
    
    // Sombras suaves
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    positions.forEach((pos, i) => {
      // Cuerpo de la bacteria
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25 * pos.scale);
      gradient.addColorStop(0, pos.color);
      gradient.addColorStop(1, pos.color + '99');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 25 * pos.scale, 15 * pos.scale, Math.PI / 4 + i * 0.5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Ojos
      ctx.fillStyle = 'white';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(pos.x - 8 * pos.scale, pos.y - 3 * pos.scale, 4 * pos.scale, 0, 2 * Math.PI);
      ctx.arc(pos.x + 8 * pos.scale, pos.y - 3 * pos.scale, 4 * pos.scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // Pupilas
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(pos.x - 8 * pos.scale, pos.y - 3 * pos.scale, 2 * pos.scale, 0, 2 * Math.PI);
      ctx.arc(pos.x + 8 * pos.scale, pos.y - 3 * pos.scale, 2 * pos.scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // Sonrisa
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2 * pos.scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y + 2 * pos.scale, 8 * pos.scale, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    });
    
    // Texto con mejor estilo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Bacterias buenas', x, y - 100);
    
    ctx.font = '16px Inter';
    ctx.fillStyle = '#666';
    ctx.fillText('Tu intestino', x, y - 75);
    
    ctx.restore();
  };

  const drawBalance = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Sombras
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    // Base con gradiente
    const baseGradient = ctx.createLinearGradient(x, y + 20, x, y + 80);
    baseGradient.addColorStop(0, '#8D6E63');
    baseGradient.addColorStop(1, '#5D4037');
    
    ctx.strokeStyle = baseGradient;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    // Poste central
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x, y + 80);
    ctx.stroke();
    
    // Base circular
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(x, y + 85, 30, 8, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Brazo de la balanza
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - 120, y + 20);
    ctx.lineTo(x + 120, y + 20);
    ctx.stroke();
    
    // Punto de pivote
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(x, y + 20, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Platos
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 3;
    
    // Plato izquierdo
    ctx.beginPath();
    ctx.moveTo(x - 120, y + 20);
    ctx.lineTo(x - 120, y + 40);
    ctx.stroke();
    
    // Bandeja izquierda
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.ellipse(x - 120, y + 45, 35, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Plato derecho
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 120, y + 20);
    ctx.lineTo(x + 120, y + 40);
    ctx.stroke();
    
    // Bandeja derecha
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.ellipse(x + 120, y + 45, 35, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Bacterias con mejor diseño
    // Bacteria mala (izquierda)
    const badGradient = ctx.createRadialGradient(x - 120, y + 35, 0, x - 120, y + 35, 15);
    badGradient.addColorStop(0, '#E91E63');
    badGradient.addColorStop(1, '#AD1457');
    ctx.fillStyle = badGradient;
    ctx.beginPath();
    ctx.ellipse(x - 120, y + 35, 15, 10, Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Bacteria buena (derecha)
    const goodGradient = ctx.createRadialGradient(x + 120, y + 35, 0, x + 120, y + 35, 15);
    goodGradient.addColorStop(0, '#66BB6A');
    goodGradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = goodGradient;
    ctx.beginPath();
    ctx.ellipse(x + 120, y + 35, 15, 10, -Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Texto mejorado
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 26px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('¡Equilibrio restaurado!', x, y - 60);
    
    // Subtítulo
    ctx.font = '16px Inter';
    ctx.fillStyle = '#666';
    ctx.fillText('Flora intestinal balanceada', x, y - 35);
    
    ctx.restore();
  };

  const drawMovement = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Intestino con movimiento
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 20;
    
    ctx.beginPath();
    ctx.moveTo(x - 200, y);
    ctx.quadraticCurveTo(x - 100, y - 30, x, y);
    ctx.quadraticCurveTo(x + 100, y + 30, x + 200, y);
    ctx.stroke();
    
    // Flechas de movimiento
    ctx.fillStyle = '#4CAF50';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    
    for (let i = -150; i <= 150; i += 75) {
      // Flecha
      ctx.beginPath();
      ctx.moveTo(x + i - 20, y);
      ctx.lineTo(x + i + 10, y);
      ctx.stroke();
      
      // Punta
      ctx.beginPath();
      ctx.moveTo(x + i + 10, y);
      ctx.lineTo(x + i + 5, y - 5);
      ctx.lineTo(x + i + 5, y + 5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Movimiento regular', x, y - 80);
    
    ctx.restore();
  };

  const drawGas = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Estómago hinchado
    ctx.fillStyle = '#FFE0B2';
    ctx.beginPath();
    ctx.ellipse(x, y, 80, 100, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Burbujas de gas
    ctx.fillStyle = 'rgba(255, 152, 0, 0.6)';
    
    const bubbles = [
      { x: x - 30, y: y - 20, r: 15 },
      { x: x + 20, y: y - 40, r: 20 },
      { x: x, y: y + 20, r: 25 },
      { x: x + 40, y: y + 10, r: 18 },
      { x: x - 40, y: y + 30, r: 22 }
    ];
    
    bubbles.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Exceso de gases', x, y - 120);
    
    ctx.restore();
  };

  const drawRelief = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Estómago normal
    ctx.fillStyle = '#C8E6C9';
    ctx.beginPath();
    ctx.ellipse(x, y, 60, 80, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Cara feliz
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 4;
    
    // Sonrisa
    ctx.beginPath();
    ctx.arc(x, y, 30, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    
    // Estrellitas de alivio
    ctx.fillStyle = '#FFD700';
    const stars = [
      { x: x - 80, y: y - 40 },
      { x: x + 80, y: y - 40 },
      { x: x - 60, y: y + 40 },
      { x: x + 60, y: y + 40 }
    ];
    
    stars.forEach(star => {
      drawStar(ctx, star.x, star.y, 15);
    });
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('¡Alivio y bienestar!', x, y - 120);
    
    ctx.restore();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="app-minimal">
      <div className="conversation-area">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              className={`message ${msg.type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {msg.type === 'ai' && (
                <div className="message-header">
                  <img src={PROBIOTIC_INFO.botAvatar} alt="Elsa" className="bot-avatar" />
                  <span className="bot-name">{PROBIOTIC_INFO.botName}</span>
                </div>
              )}
              <div className="message-content">{msg.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {currentText && (
          <div className="message user typing">
            {currentText}
          </div>
        )}
      </div>

      <canvas 
        ref={canvasRef}
        className="drawing-canvas"
        width={800}
        height={400}
      />

      <button
        className={`mic-button ${voiceStatus}`}
        onClick={toggleListening}
        disabled={voiceStatus === 'processing' || voiceStatus === 'responding'}
      >
        {isListening ? <IconMicrophoneOff size={32} /> : <IconMicrophone size={32} />}
        <span className="status-text">
          {voiceStatus === 'listening' ? 'Escuchando...' :
           voiceStatus === 'processing' ? 'Analizando...' :
           voiceStatus === 'responding' ? 'Respondiendo...' :
           'Presiona para hablar'}
        </span>
      </button>
    </div>
  );
}