import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
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
      synthRef.current.rate = 0.9;
      synthRef.current.pitch = 1.0;
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

  const processUserInput = (text: string) => {
    setMessages(prev => [...prev, { type: 'user', text }]);
    setVoiceStatus('processing');
    
    // Detectar síntoma
    const symptom = detectSymptom(text);
    
    setTimeout(() => {
      processResponse(symptom);
    }, 500);
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

  const drawElement = (element: string) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const centerX = 400;
    const centerY = 200;

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
  };

  const drawPill = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Cápsula
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(x, y, 40, Math.PI, 0);
    ctx.fill();
    
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI);
    ctx.fill();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('ProBioBalance Plus', x, y - 80);
    
    ctx.font = '16px Inter';
    ctx.fillText('1 cápsula al día', x, y + 80);
    
    ctx.restore();
  };

  const drawIntestine = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 20;
    
    // Forma de intestino
    ctx.beginPath();
    ctx.moveTo(x - 200, y);
    ctx.quadraticCurveTo(x - 100, y - 50, x, y);
    ctx.quadraticCurveTo(x + 100, y + 50, x + 200, y);
    ctx.stroke();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Tu intestino', x, y - 80);
    
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
      { x: x - 100, y: y },
      { x: x, y: y - 50 },
      { x: x + 100, y: y },
      { x: x - 50, y: y + 50 },
      { x: x + 50, y: y + 50 }
    ];
    
    ctx.fillStyle = '#4CAF50';
    
    positions.forEach(pos => {
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, 25, 15, Math.random() * Math.PI, 0, 2 * Math.PI);
      ctx.fill();
      
      // Carita feliz
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    });
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Bacterias buenas', x, y - 100);
    
    ctx.restore();
  };

  const drawBalance = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    
    // Balanza equilibrada
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 6;
    
    // Base
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x, y + 60);
    ctx.stroke();
    
    // Brazo
    ctx.beginPath();
    ctx.moveTo(x - 100, y + 20);
    ctx.lineTo(x + 100, y + 20);
    ctx.stroke();
    
    // Platos al mismo nivel
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    
    // Izquierdo
    ctx.beginPath();
    ctx.moveTo(x - 100, y + 20);
    ctx.lineTo(x - 100, y + 40);
    ctx.stroke();
    ctx.strokeRect(x - 120, y + 40, 40, 5);
    
    // Derecho
    ctx.beginPath();
    ctx.moveTo(x + 100, y + 20);
    ctx.lineTo(x + 100, y + 40);
    ctx.stroke();
    ctx.strokeRect(x + 80, y + 40, 40, 5);
    
    // Bacterias en equilibrio
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(x - 100, y + 35, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(x + 100, y + 35, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Texto
    ctx.fillStyle = '#333';
    ctx.font = '20px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('¡Equilibrio restaurado!', x, y - 60);
    
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