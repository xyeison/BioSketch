import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import './AnimatedSubtitles.css';

interface AnimatedSubtitlesProps {
  text: string;
  isActive: boolean;
}

export default function AnimatedSubtitles({ text, isActive }: AnimatedSubtitlesProps) {
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    if (text) {
      const newWords = text.split(' ');
      setWords(newWords);
      setCurrentWordIndex(0);
    }
  }, [text]);

  useEffect(() => {
    if (!isActive || currentWordIndex >= words.length) return;

    const timer = setTimeout(() => {
      setCurrentWordIndex(prev => prev + 1);
    }, 150); // Velocidad de aparición de palabras

    return () => clearTimeout(timer);
  }, [currentWordIndex, words.length, isActive]);

  return (
    <div className="subtitles-container">
      <AnimatePresence mode="wait">
        {isActive && text && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="subtitle-box"
          >
            <div className="subtitle-text">
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: index <= currentWordIndex ? 1 : 0.3,
                    scale: index <= currentWordIndex ? 1 : 0.8,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                  className={`subtitle-word ${index === currentWordIndex ? 'current' : ''}`}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </div>
            
            {/* Indicador de progreso */}
            <motion.div
              className="subtitle-progress"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: currentWordIndex / words.length }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}