import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconTrash,
  IconPlayerStop,
  IconBacteria,
  IconBrain,
  IconHeart,
  IconShieldCheck
} from '@tabler/icons-react';
import './App.css';

type VoiceStatus = 'inactive' | 'listening' | 'processing';

interface DrawingElement {
  id: string;
  type: string;
  timestamp: Date;
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('inactive');
  const [transcript, setTranscript] = useState('');
  const [drawingCount, setDrawingCount] = useState(0);
  const [lastAction, setLastAction] = useState('Ninguna');
  const [aiActions, setAiActions] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('🔴 Sin conexión');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Palabras clave y sus acciones
  const keywordActions: Record<string, () => void> = {
    'lactobacilo': () => drawBacteria('lactobacillus', 150, 200, '#4CAF50'),
    'bifidobacteria': () => drawBacteria('bifidobacterium', 300, 180, '#8BC34A'),
    'intestino': () => drawIntestine(),
    'fermentación': () => drawFermentationProcess(),
    'beneficios': () => drawHealthBenefits(),
    'digestión': () => drawDigestionProcess(),
    'microbiota': () => drawMicrobiome(),
    'probióticos': () => drawProbioticsBenefits()
  };

  useEffect(() => {
    initializeCanvas();
    setupVoiceRecognition();
    setConnectionStatus('🟢 IA Lista');
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
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
      
      recognition.continuous = true;
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
        
        if (finalTranscript) {
          processVoiceInput(finalTranscript);
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento:', event.error);
        setVoiceStatus('inactive');
      };
      
      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        } else {
          setVoiceStatus('inactive');
        }
      };
      
      recognitionRef.current = recognition;
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceInput = (text: string) => {
    setVoiceStatus('processing');
    
    setTimeout(() => {
      const keywords = detectKeywords(text.toLowerCase());
      
      if (keywords.length > 0) {
        addAIAction(`Detectado: ${keywords.join(', ')}`);
        
        keywords.forEach((keyword, index) => {
          setTimeout(() => {
            if (keywordActions[keyword]) {
              keywordActions[keyword]();
              setLastAction(`Dibujando: ${keyword}`);
            }
          }, index * 1000);
        });
      } else {
        addAIAction('No se detectaron keywords de probióticos');
      }
      
      setVoiceStatus('listening');
    }, 500);
  };

  const detectKeywords = (text: string): string[] => {
    return Object.keys(keywordActions).filter(keyword => text.includes(keyword));
  };

  const addAIAction = (action: string) => {
    const newAction = `${new Date().toLocaleTimeString()}: ${action}`;
    setAiActions(prev => [newAction, ...prev].slice(0, 5));
  };

  const simulatePhrase = (phrase: string) => {
    setTranscript(phrase);
    processVoiceInput(phrase);
  };

  // Drawing functions
  const drawBacteria = (type: string, x: number, y: number, color: string) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    
    // Bacteria body
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 15, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Flagella
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 30, y + i * 10 - 10);
      ctx.quadraticCurveTo(x + 50 + i * 5, y + i * 15 - 15, x + 70, y + i * 10 - 5);
      ctx.stroke();
    }
    
    // Label
    ctx.fillStyle = '#333';
    ctx.font = '12px Inter';
    ctx.fillText(type, x - 20, y - 30);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawIntestine = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 8;
    
    // Intestine shape
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.quadraticCurveTo(200, 100, 300, 150);
    ctx.quadraticCurveTo(400, 200, 500, 150);
    ctx.quadraticCurveTo(600, 100, 700, 150);
    ctx.stroke();
    
    // Villi
    for (let i = 150; i < 650; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 140);
      ctx.lineTo(i, 120);
      ctx.moveTo(i + 15, 145);
      ctx.lineTo(i + 15, 125);
      ctx.moveTo(i + 30, 142);
      ctx.lineTo(i + 30, 122);
      ctx.stroke();
    }
    
    // Label
    ctx.fillStyle = '#333';
    ctx.font = '16px Inter';
    ctx.fillText('Intestino Delgado', 300, 100);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawFermentationProcess = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const centerX = 400;
    const centerY = 300;
    
    ctx.save();
    
    ctx.strokeStyle = '#FF9800';
    ctx.fillStyle = '#FF9800';
    ctx.lineWidth = 3;
    
    // Initial molecule
    ctx.beginPath();
    ctx.arc(centerX - 100, centerY, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = '12px Inter';
    ctx.fillText('Lactosa', centerX - 120, centerY - 30);
    
    // Arrow
    drawArrow(centerX - 70, centerY, centerX - 30, centerY);
    
    // Processing bacteria
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 25, 15, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Arrow
    drawArrow(centerX + 30, centerY, centerX + 70, centerY);
    
    // Final product
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.arc(centerX + 100, centerY, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText('Ác. Láctico', centerX + 80, centerY - 30);
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawHealthBenefits = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const benefits = [
      { icon: '💊', text: 'Digestión', x: 150, y: 400 },
      { icon: '🛡️', text: 'Inmunidad', x: 300, y: 420 },
      { icon: '❤️', text: 'Cardiovascular', x: 450, y: 400 },
      { icon: '🧠', text: 'Mental', x: 600, y: 420 }
    ];
    
    ctx.save();
    ctx.font = '14px Inter';
    
    benefits.forEach(benefit => {
      ctx.fillStyle = '#E91E63';
      ctx.beginPath();
      ctx.arc(benefit.x, benefit.y, 25, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '20px Inter';
      ctx.fillText(benefit.icon, benefit.x, benefit.y + 5);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Inter';
      ctx.fillText(benefit.text, benefit.x, benefit.y + 45);
    });
    
    ctx.restore();
    incrementDrawingCount();
  };

  const drawMicrobiome = () => {
    const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'];
    
    for (let i = 0; i < 8; i++) {
      const x = 200 + (i % 4) * 80;
      const y = 200 + Math.floor(i / 4) * 60;
      const color = colors[i % colors.length];
      
      setTimeout(() => {
        drawBacteria(`Micro ${i + 1}`, x, y, color);
      }, i * 200);
    }
  };

  const drawDigestionProcess = () => {
    drawIntestine();
    setTimeout(() => drawFermentationProcess(), 1000);
    setTimeout(() => drawHealthBenefits(), 2000);
  };

  const drawProbioticsBenefits = () => {
    drawBacteria('Probióticos', 200, 250, '#4CAF50');
    setTimeout(() => drawIntestine(), 500);
    setTimeout(() => drawHealthBenefits(), 1000);
  };

  const drawArrow = (fromX: number, fromY: number, toX: number, toY: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 10 * Math.cos(angle - Math.PI / 6), toY - 10 * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 10 * Math.cos(angle + Math.PI / 6), toY - 10 * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
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

  return (
    <div className="app">
      <header className="header">
        <h1>
          <IconBacteria size={32} className="icon-bacteria" />
          BioSketch - IA + Voz + Dibujo Automático
        </h1>
        <p>Habla sobre probióticos y mira cómo la IA dibuja automáticamente</p>
        
        <div className="controls">
          <button 
            className="btn btn-primary" 
            onClick={startListening}
            disabled={isListening}
          >
            <IconMicrophone size={20} />
            Comenzar Conversación
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={clearCanvas}
          >
            <IconTrash size={20} />
            Limpiar Canvas
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
          
          <div className="drawing-legend">
            <h4>Leyenda</h4>
            <div className="legend-item">
              <div className="color-dot" style={{ background: '#4CAF50' }} />
              <span>Bacterias Beneficiosas</span>
            </div>
            <div className="legend-item">
              <div className="color-dot" style={{ background: '#2196F3' }} />
              <span>Intestino</span>
            </div>
            <div className="legend-item">
              <div className="color-dot" style={{ background: '#FF9800' }} />
              <span>Procesos</span>
            </div>
            <div className="legend-item">
              <div className="color-dot" style={{ background: '#E91E63' }} />
              <span>Beneficios</span>
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="panel">
            <h3>
              <IconMicrophone size={20} />
              Estado de Voz
            </h3>
            <div className="voice-status">
              <motion.div 
                className={`voice-indicator voice-${voiceStatus}`}
                animate={voiceStatus === 'listening' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {voiceStatus === 'listening' ? '🎤' : voiceStatus === 'processing' ? '⚙️' : '🎤'}
              </motion.div>
              <div className="voice-status-text">
                {voiceStatus === 'listening' ? 'Escuchando...' : 
                 voiceStatus === 'processing' ? 'Procesando...' : 
                 'Presiona para comenzar'}
              </div>
            </div>
            <div className="transcript">
              {transcript || 'Los keywords detectados aparecerán aquí...'}
            </div>
          </div>

          <div className="panel">
            <h3>
              <IconBrain size={20} />
              Acciones de IA
            </h3>
            <div className="ai-actions">
              {aiActions.length === 0 ? (
                <div className="action-item">Esperando entrada de voz...</div>
              ) : (
                aiActions.map((action, index) => (
                  <motion.div 
                    key={index} 
                    className="action-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {action}
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <h3>💡 Frases Sugeridas</h3>
            <div className="suggested-phrases">
              <button 
                className="phrase-btn" 
                onClick={() => simulatePhrase('¿Qué son los lactobacilos?')}
              >
                "¿Qué son los lactobacilos?"
              </button>
              <button 
                className="phrase-btn" 
                onClick={() => simulatePhrase('Explícame el intestino humano')}
              >
                "Explícame el intestino humano"
              </button>
              <button 
                className="phrase-btn" 
                onClick={() => simulatePhrase('Beneficios de los probióticos')}
              >
                "Beneficios de los probióticos"
              </button>
              <button 
                className="phrase-btn" 
                onClick={() => simulatePhrase('Proceso de fermentación')}
              >
                "Proceso de fermentación"
              </button>
            </div>
          </div>
        </aside>
      </main>

      <footer className="status-bar">
        <span>{connectionStatus}</span>
        <span>Elementos dibujados: {drawingCount}</span>
        <span>Última acción: {lastAction}</span>
      </footer>
    </div>
  );
}