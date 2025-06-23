import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface TimelineEvent {
  time: number;
  drawing: string;
  text?: string;
}

interface AudioTimelineProps {
  isPlaying: boolean;
  events: TimelineEvent[];
  onDrawingChange: (drawing: string) => void;
  audioText: string;
}

export default function AudioTimeline({ isPlaying, events, onDrawingChange, audioText }: AudioTimelineProps) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  
  useEffect(() => {
    // Create timeline
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        setCurrentTime(tl.time());
      }
    });
    
    // Add events to timeline
    events.forEach((event) => {
      tl.call(() => {
        onDrawingChange(event.drawing);
      }, [], event.time);
    });
    
    // Set duration based on audio length (estimate)
    const estimatedDuration = (audioText.length / 20) + 2; // rough estimate
    setDuration(estimatedDuration);
    tl.duration(estimatedDuration);
    
    timelineRef.current = tl;
    
    return () => {
      tl.kill();
    };
  }, [events, onDrawingChange, audioText]);
  
  useEffect(() => {
    if (timelineRef.current) {
      if (isPlaying) {
        timelineRef.current.play();
      } else {
        timelineRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  const progress = (currentTime / duration) * 100;
  
  return (
    <div className="audio-timeline">
      <div className="timeline-container">
        <div className="timeline-labels">
          {events.map((event, index) => (
            <div
              key={index}
              className="timeline-label"
              style={{ left: `${(event.time / duration) * 100}%` }}
            >
              <span>{event.drawing}</span>
            </div>
          ))}
        </div>
        <div className="timeline-track">
          <div 
            className="timeline-progress" 
            style={{ width: `${progress}%` }}
          />
          {events.map((event, index) => (
            <div
              key={index}
              className={`timeline-marker ${currentTime >= event.time ? 'active' : ''}`}
              style={{ left: `${(event.time / duration) * 100}%` }}
            />
          ))}
        </div>
        <div className="timeline-time">
          <span className="current-time">{currentTime.toFixed(1)}s</span>
          <span className="separator">/</span>
          <span className="total-time">{duration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}