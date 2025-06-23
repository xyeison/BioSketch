import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMicrophone, IconPlayerStop, IconSparkles } from '@tabler/icons-react';
import { streamChatResponse, streamAudio } from './services/streamingAI';
import AnimatedSubtitles from './components/AnimatedSubtitles';
import DynamicVisualization from './components/DynamicVisualization';
import './App.css';

type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentVisualization, setCurrentVisualization] = useState('probiotico');
  const [isSubtitleActive, setIsSubtitleActive] = useState(false);
  const [error, setError] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      // Check if API key is configured
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        setError('API Key no configurada. Por favor, configura VITE_OPENAI_API_KEY en Vercel.');
        return;
      }
      
      setupVoiceRecognition();
      audioContextRef.current = new AudioContext();
      
      // Mensaje de bienvenida
      setTimeout(() => {
        const welcomeMsg = "¡Hola! Soy Elsa, tu asistente de salud digestiva. ¿Qué molestias tienes hoy?";
        addMessage('assistant', welcomeMsg);
        playTextToSpeech(welcomeMsg);
      }, 500);
    } catch (err) {
      console.error('Error initializing app:', err);
      setError('Error al inicializar la aplicación: ' + (err as Error).message);
    }
  }, []);

  const setupVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      
      recognition.onstart = () => {
        setVoiceStatus('listening');
        setCurrentTranscript('');
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
        
        setCurrentTranscript(interimTranscript || finalTranscript);
        
        if (finalTranscript) {
          handleUserInput(finalTranscript);
        }
      };
      
      recognition.onerror = () => {
        setVoiceStatus('idle');
      };
      
      recognition.onend = () => {
        if (voiceStatus === 'listening') {
          recognition.start(); // Reiniciar si todavía estamos escuchando
        }
      };
      
      recognitionRef.current = recognition;
    }
  };

  const addMessage = (type: 'user' | 'assistant', text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleUserInput = async (text: string) => {
    recognitionRef.current?.stop();
    setVoiceStatus('thinking');
    setCurrentTranscript('');
    addMessage('user', text);
    
    let responseText = '';
    setCurrentResponse('');
    
    await streamChatResponse(text, {
      onToken: (token) => {
        responseText += token;
        setCurrentResponse(responseText);
      },
      onComplete: (fullText) => {
        addMessage('assistant', fullText);
        playTextToSpeech(fullText);
      },
      onVisualization: (viz) => {
        setCurrentVisualization(viz);
      },
      onError: (error) => {
        console.error('Error:', error);
        setVoiceStatus('idle');
      }
    });
  };

  const playTextToSpeech = async (text: string) => {
    setVoiceStatus('speaking');
    setIsSubtitleActive(true);
    
    try {
      const audioChunks: ArrayBuffer[] = [];
      
      // Recolectar chunks de audio
      for await (const chunk of streamAudio(text, 'nova')) {
        audioChunks.push(chunk);
      }
      
      // Combinar chunks
      const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioChunks) {
        audioData.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      
      // Decodificar y reproducir
      const audioBuffer = await audioContextRef.current!.decodeAudioData(audioData.buffer);
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current!.destination);
      
      source.onended = () => {
        setVoiceStatus('idle');
        setIsSubtitleActive(false);
      };
      
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      setVoiceStatus('idle');
      setIsSubtitleActive(false);
    }
  };

  const toggleListening = () => {
    if (voiceStatus === 'listening') {
      recognitionRef.current?.stop();
      setVoiceStatus('idle');
    } else if (voiceStatus === 'idle') {
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="app-container">
      {/* Fondo con gradiente animado */}
      <div className="animated-background">
        <div className="gradient-orb gradient-1" />
        <div className="gradient-orb gradient-2" />
        <div className="gradient-orb gradient-3" />
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(244, 67, 54, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <h3>Error</h3>
          <p>{error}</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>
            En Vercel, ve a Settings → Environment Variables y agrega VITE_OPENAI_API_KEY
          </p>
        </div>
      )}

      {/* Header minimalista */}
      <header className="app-header">
        <div className="logo">
          <IconSparkles size={24} />
          <span>Elsa AI</span>
        </div>
        <div className="status-indicator">
          <span className={`status-dot ${voiceStatus}`} />
          <span className="status-text">
            {voiceStatus === 'idle' && 'Lista para ayudarte'}
            {voiceStatus === 'listening' && 'Escuchando...'}
            {voiceStatus === 'thinking' && 'Pensando...'}
            {voiceStatus === 'speaking' && 'Hablando...'}
          </span>
        </div>
      </header>

      {/* Área principal */}
      <main className="main-content">
        {/* Visualización 3D */}
        <div className="visualization-wrapper">
          <DynamicVisualization scene={currentVisualization} />
        </div>

        {/* Chat minimalista */}
        <div className="chat-container">
          <AnimatePresence mode="popLayout">
            {messages.slice(-3).map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`message ${message.type}`}
              >
                <div className="message-content">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Transcripción en tiempo real */}
          {currentTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="transcript"
            >
              {currentTranscript}
            </motion.div>
          )}

          {/* Respuesta en streaming */}
          {currentResponse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="message assistant streaming"
            >
              <div className="message-content">{currentResponse}</div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Subtítulos animados */}
      <AnimatedSubtitles 
        text={messages[messages.length - 1]?.type === 'assistant' ? messages[messages.length - 1].text : ''}
        isActive={isSubtitleActive}
      />

      {/* Control de voz flotante */}
      <motion.button
        className={`voice-control ${voiceStatus}`}
        onClick={toggleListening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={voiceStatus === 'thinking' || voiceStatus === 'speaking'}
      >
        {voiceStatus === 'listening' ? (
          <IconPlayerStop size={32} />
        ) : (
          <IconMicrophone size={32} />
        )}
      </motion.button>
    </div>
  );
}