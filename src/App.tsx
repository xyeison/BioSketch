import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import { getAIResponse, generateSpeechUrl, OPENAI_VOICES } from './services/openai';
import Scene3D from './components/Scene3D';
import AudioTimeline from './components/AudioTimeline';
import './App.css';

type VoiceStatus = 'inactive' | 'listening' | 'processing' | 'responding';

// Base de conocimiento del probiótico
const PROBIOTIC_INFO = {
  name: "ProBioBalance Plus",
  botName: "Elsa",
  botAvatar: "https://example.com/elsa-avatar.png",
};

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('inactive');
  const [currentText, setCurrentText] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([]);
  const [currentDrawing, setCurrentDrawing] = useState('probiotico');
  const [timelineEvents, setTimelineEvents] = useState<Array<{time: number, drawing: string}>>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setupVoiceRecognition();
    
    // Mensaje inicial
    setTimeout(async () => {
      const initialMessage = "¡Hola! Soy Elsa, tu asistente de salud digestiva. Cuéntame qué molestias tienes y te explicaré cómo nuestro probiótico puede ayudarte.";
      setMessages([{ type: 'ai', text: initialMessage }]);
      await speakText(initialMessage);
    }, 1000);
  }, []);

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
      processAIResponse(aiResponse.response, aiResponse.timeline || []);
    } catch (error) {
      console.error('Error procesando entrada:', error);
      // Fallback
      const fallbackMessage = "Disculpa, hubo un problema. ¿Podrías repetir tu consulta?";
      setMessages(prev => [...prev, { type: 'ai', text: fallbackMessage }]);
      speakText(fallbackMessage);
    }
  };

  const processAIResponse = async (responseText: string, timeline: Array<{time: number, drawing: string}>) => {
    setMessages(prev => [...prev, { type: 'ai', text: responseText }]);
    setVoiceStatus('responding');
    
    // Set timeline events
    setTimelineEvents(timeline);
    
    // Start with first drawing
    if (timeline.length > 0) {
      setCurrentDrawing(timeline[0].drawing);
    }
    
    // Speak
    speakText(responseText);
  };

  const speakText = async (text: string) => {
    try {
      // Siempre usar OpenAI con voz Nova
      const audioUrl = await generateSpeechUrl(text, OPENAI_VOICES.nova);
      
      // Crear elemento de audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsAudioPlaying(true);
      };
      
      audio.onended = () => {
        setIsAudioPlaying(false);
        setTimeout(() => {
          setVoiceStatus('inactive');
        }, 500);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        console.error('Error reproduciendo audio de OpenAI');
        setIsAudioPlaying(false);
        setVoiceStatus('inactive');
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error con OpenAI TTS:', error);
      setIsAudioPlaying(false);
      setVoiceStatus('inactive');
    }
  };

  return (
    <div className="app-modern">
      <div className="main-container">
        <div className="conversation-panel">
          <div className="conversation-header">
            <img src={PROBIOTIC_INFO.botAvatar} alt="Elsa" className="bot-avatar-header" />
            <div>
              <h2>{PROBIOTIC_INFO.botName}</h2>
              <p>Asistente de Salud Digestiva</p>
            </div>
          </div>
          
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
        </div>
        
        <div className="visualization-panel">
          <Scene3D currentDrawing={currentDrawing} />
          
          {timelineEvents.length > 0 && (
            <AudioTimeline
              isPlaying={isAudioPlaying}
              events={timelineEvents}
              onDrawingChange={setCurrentDrawing}
              audioText={messages[messages.length - 1]?.text || ''}
            />
          )}
          
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
      </div>
    </div>
  );
}